"use server";

import { revalidatePath } from "next/cache";
import { currentSession } from "@/lib/session";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * Enregistrer un appel, pour de vrai.
 *
 * The browser sends who took the call and how it went. It does not send who is
 * asking, because a browser can say anything: the session is read again here, on
 * the server, and a demonstration visit is refused before a single query is sent.
 * What does go to the database goes through the request scoped client, so row
 * level security sees the signed in person and applies the same rules it would
 * apply to anyone else.
 *
 * The funnel on this screen and the one on the dashboard are both summed from
 * the calls table, so a saved call moves them on the next render.
 */

export type CallOutcome = "won" | "rejected" | "undecided";

export interface RecordCallInput {
  /** Who took the call, chosen in the form. */
  memberId: string;
  reached: boolean;
  outcome: CallOutcome;
  /** What the order was worth in dinars, or null when the call produced none. */
  orderValue: number | null;
}

export type RecordCallResult = { ok: true; callId: string } | { ok: false; error: string };

export type UndoCallResult = { ok: true } | { ok: false; error: string };

/** Postgres rejects a malformed uuid with an error nobody can read. Catch it here. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const OUTCOMES: CallOutcome[] = ["won", "rejected", "undecided"];

/** Everything a write needs, or the one sentence explaining why there is no write. */
type Writer =
  | { error: string }
  | {
      db: Awaited<ReturnType<typeof supabaseServer>>;
      actorMemberId: string;
      organizationId: string;
    };

async function openWriter(refusal: string): Promise<Writer> {
  const session = await currentSession();
  if (!session) {
    return {
      error: "Votre session s'est terminée. Reconnectez-vous, puis recommencez.",
    };
  }

  // The demonstration door. The database would refuse the write at the row level
  // security layer anyway, so nothing is attempted and the reader is told why.
  if (!session.canWrite) {
    return { error: refusal };
  }

  // Past this point the database is configured: canWrite is only ever true for a
  // person the database itself recognised, which it cannot do when it is absent.
  const db = await supabaseServer();

  // A call belongs to the shop of the person recording it, never to a shop named
  // in the browser. The insert has to carry an organization_id, so it is read
  // from the member row here rather than guessed.
  const { data } = await db
    .from("organization_members")
    .select("organization_id")
    .eq("id", session.member.id)
    .is("archived_at", null)
    .maybeSingle();

  if (!data) {
    return { error: "Votre compte n'est rattaché à aucune équipe, rien n'a été enregistré." };
  }

  return {
    db,
    actorMemberId: session.member.id,
    organizationId: data.organization_id as string,
  };
}

export async function recordCall(input: RecordCallInput): Promise<RecordCallResult> {
  const memberId = typeof input?.memberId === "string" ? input.memberId.trim() : "";
  if (!UUID.test(memberId)) {
    return { ok: false, error: "Choisissez la personne qui a pris l'appel." };
  }

  const writer = await openWriter(
    "L'entrée de démonstration n'enregistre rien. Connectez-vous avec un compte pour enregistrer un appel.",
  );
  if ("error" in writer) return { ok: false, error: writer.error };
  const { db, actorMemberId, organizationId } = writer;

  const reached = input.reached === true;
  // A call nobody answered has no outcome to speak of, and no order behind it.
  const outcome: CallOutcome =
    reached && OUTCOMES.includes(input.outcome) ? input.outcome : "undecided";
  const won = reached && outcome === "won";

  // Null is the rule saying "no order", which is not the same rule as an order
  // of zero dinars, so it stays null.
  let orderValue: number | null = null;
  if (won && input.orderValue !== null && input.orderValue !== undefined) {
    const value = Number(input.orderValue);
    if (!Number.isFinite(value) || value <= 0) {
      return {
        ok: false,
        error:
          "Donnez un montant en dinars à la commande, ou indiquez qu'aucune commande n'a été passée.",
      };
    }
    orderValue = Math.round(value * 100) / 100;
  }

  // Whoever took the call has to be on this team. Row level security would let
  // the row through with any member_id at all, since it only reads the
  // organisation, so a hand-made request is stopped here instead.
  const { data: taker } = await db
    .from("organization_members")
    .select("id")
    .eq("id", memberId)
    .eq("organization_id", organizationId)
    .is("archived_at", null)
    .maybeSingle();

  if (!taker) {
    return { ok: false, error: "Cette personne ne fait pas partie de votre équipe." };
  }

  // The id comes back so the screen can hand this exact row to undoCall.
  const { data: call, error } = await db
    .from("calls")
    .insert({
      organization_id: organizationId,
      member_id: memberId,
      reached,
      outcome,
      order_value: orderValue,
      recorded_at: new Date().toISOString(),
      recorded_by_member_id: actorMemberId,
    })
    .select("id")
    .maybeSingle();

  if (error || !call) {
    return { ok: false, error: "L'appel n'a pas pu être enregistré. Réessayez dans un instant." };
  }

  // The trace, so a figure in the funnel leads back to a person and a moment. If
  // this line fails the call is still saved, so the reader is not told the
  // opposite; only the trace is missing.
  await db.from("audit_logs").insert({
    organization_id: organizationId,
    actor_member_id: actorMemberId,
    action: "call.recorded",
    entity: "call",
    entity_id: call.id,
    detail: { member_id: memberId, reached, outcome, order_value: orderValue },
  });

  // Both screens count these rows, so neither may be served from the last render.
  revalidatePath("/team");
  revalidatePath("/dashboard");

  return { ok: true, callId: call.id as string };
}

/** Takes back one call: the row the insert above returned, and no other. */
export async function undoCall(callId: string): Promise<UndoCallResult> {
  const id = typeof callId === "string" ? callId.trim() : "";
  if (!UUID.test(id)) {
    return { ok: false, error: "Cet appel n'a pas d'identifiant valide, rien n'a été modifié." };
  }

  const writer = await openWriter(
    "L'entrée de démonstration n'enregistre rien, il n'y a donc aucun appel à retirer.",
  );
  if ("error" in writer) return { ok: false, error: writer.error };
  const { db, actorMemberId, organizationId } = writer;

  // Three filters, and all three matter. The id names one row. The organisation
  // and the recorder mean it has to be a call this person recorded from this
  // screen, so nothing that arrived any other way can be deleted from here.
  const { data: call, error } = await db
    .from("calls")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId)
    .eq("recorded_by_member_id", actorMemberId)
    .select("id, member_id, reached, outcome, order_value")
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      error: "Cet appel n'a pas pu être retiré. Rechargez la page pour voir ce qui est enregistré.",
    };
  }

  // No error and no row means the delete matched nothing: somebody else recorded
  // that call, or it is already gone. Either way this screen must not pretend it
  // just removed it.
  if (!call) {
    return {
      ok: false,
      error:
        "Cet appel n'a pas été retrouvé. Rechargez la page pour voir ce qui est enregistré.",
    };
  }

  // The removal is traced like the recording was. A failure here loses the trace
  // and nothing else, so the reader is not told the call came back.
  await db.from("audit_logs").insert({
    organization_id: organizationId,
    actor_member_id: actorMemberId,
    action: "call.deleted",
    entity: "call",
    entity_id: call.id,
    detail: {
      member_id: call.member_id,
      reached: call.reached,
      outcome: call.outcome,
      order_value: call.order_value,
    },
  });

  revalidatePath("/team");
  revalidatePath("/dashboard");

  return { ok: true };
}
