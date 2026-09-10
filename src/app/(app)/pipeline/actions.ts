"use server";

import { revalidatePath } from "next/cache";
import { STAGES, type StageId } from "@/components/pipeline/types";
import { currentSession } from "@/lib/session";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * Moving a card on the board, written down.
 *
 * A move is two facts, not one: the lead now stands in a different column, and
 * somebody moved it there on a given day. The first goes on the lead itself, the
 * second goes to lead_stage_history, which is the table the board's history is
 * read from. Undo is a move like any other, so it writes a second history row
 * rather than rubbing the first one out.
 *
 * The column the card came from is read from the database, never taken from the
 * browser. A page left open for an hour would otherwise write down a departure
 * that never happened.
 */

/**
 * Kept unexported on purpose: a "use server" file may only export async
 * functions. The board reads the shape off the action's return type.
 */
interface MoveResult {
  ok: boolean;
  /** Set only when ok is false. A finished French sentence for the reader. */
  error?: string;
}

function isStage(value: string): value is StageId {
  return STAGES.some((stage) => stage.id === value);
}

export async function moveLeadToStage(leadId: string, to: string): Promise<MoveResult> {
  if (!isStage(to)) {
    return { ok: false, error: "Cette étape n'existe pas." };
  }

  // The session is re read here rather than trusted from the browser, which can
  // send whatever it likes.
  const session = await currentSession();
  if (!session) {
    return { ok: false, error: "Votre session a expiré. Reconnectez-vous pour déplacer un prospect." };
  }
  if (!session.canWrite) {
    // The demonstration door. The database would refuse this write at the row
    // level security layer, so it is not attempted at all.
    return {
      ok: false,
      error: "L'entrée de démonstration ne peut rien enregistrer. Connectez-vous pour déplacer un prospect.",
    };
  }

  const db = await supabaseServer();

  const [memberRow, leadRow] = await Promise.all([
    db.from("organization_members").select("organization_id").eq("id", session.member.id).maybeSingle(),
    db.from("leads").select("id, organization_id, stage").eq("id", leadId).maybeSingle(),
  ]);

  const lead = leadRow.data;
  if (!lead) {
    return { ok: false, error: "Ce prospect est introuvable. Rafraîchissez la page." };
  }

  const organizationId = memberRow.data?.organization_id as string | undefined;
  if (!organizationId || organizationId !== lead.organization_id) {
    // Readable does not mean writable: the demonstration boutique is readable by
    // everyone. Saying so here gives a sentence instead of a row level refusal.
    return { ok: false, error: "Ce prospect n'appartient pas à votre boutique." };
  }

  const from = lead.stage as StageId;
  if (from === to) {
    // Already where the card was dropped, so nothing to write and nothing to
    // record. Two people moving the same card the same way is not an error.
    return { ok: true };
  }

  const movedAt = new Date().toISOString();

  const { error: moveError } = await db
    .from("leads")
    .update({ stage: to, updated_at: movedAt })
    .eq("id", leadId);

  if (moveError) {
    return { ok: false, error: "Le déplacement n'a pas pu être enregistré. La carte est revenue à sa place." };
  }

  // PostgREST sends one request per table, so these three writes are not one
  // transaction. What follows puts the lead back rather than leaving a move with
  // no trace of who made it, because a figure on a report has to be traceable.
  const { data: history, error: historyError } = await db
    .from("lead_stage_history")
    .insert({
      organization_id: organizationId,
      lead_id: leadId,
      from_stage: from,
      to_stage: to,
      changed_by_member_id: session.member.id,
      changed_at: movedAt,
    })
    .select("id")
    .single();

  if (historyError) {
    await db.from("leads").update({ stage: from, updated_at: movedAt }).eq("id", leadId);
    return {
      ok: false,
      error: "L'historique du prospect n'a pas pu être écrit, le déplacement a donc été annulé. Réessayez.",
    };
  }

  const { error: auditError } = await db.from("audit_logs").insert({
    organization_id: organizationId,
    actor_member_id: session.member.id,
    action: "lead.stage_changed",
    entity: "lead",
    entity_id: leadId,
    detail: { from, to },
  });

  if (auditError) {
    await db.from("lead_stage_history").delete().eq("id", history.id);
    await db.from("leads").update({ stage: from, updated_at: movedAt }).eq("id", leadId);
    return {
      ok: false,
      error: "Le déplacement n'a pas pu être tracé, il a donc été annulé. Réessayez.",
    };
  }

  // So the next render reads the saved stage rather than the one held in memory
  // from before the move.
  revalidatePath("/pipeline");

  return { ok: true };
}
