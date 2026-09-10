"use server";

import { revalidatePath } from "next/cache";
import { currentSession } from "@/lib/session";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * What the inbox is allowed to write, and for whom.
 *
 * A signed in account changes the conversation itself: who owns it, whether it
 * is resolved or reported, and the internal notes underneath it. Every one of
 * those goes through the request scoped client, so the database sees the person
 * and applies its own rules to them. Nothing here uses a service key.
 *
 * The demonstration door never reaches this file: the screen keeps its changes
 * in memory and says so. If it ever did reach here, the session is re-read below
 * and the write is refused, because a flag sent from a browser proves nothing.
 *
 * Nothing filters by organization_id when reading. Row level security already
 * limits every row to the caller's shop. The organization is read off the
 * conversation only because the rows written next need to carry it.
 */

type Result = { ok: true } | { ok: false; error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const REFUSED_DEMO =
  "Vous êtes entré par la porte de démonstration : rien ne peut être enregistré depuis cette visite.";
const REFUSED_SIGNED_OUT = "Votre session a expiré. Reconnectez-vous, puis recommencez.";
const NOT_FOUND = "Cette conversation est introuvable.";
const WRITE_FAILED = "Le changement n'a pas pu être enregistré. Réessayez dans un instant.";
const NOTE_FAILED = "La note n'a pas pu être enregistrée. Réessayez dans un instant.";
const NOT_ON_TEAM = "Cette personne ne fait pas partie de votre équipe.";

interface ConversationRow {
  id: string;
  organization_id: string;
  status: string;
  assignee_member_id: string | null;
}

interface Ready {
  ok: true;
  db: Awaited<ReturnType<typeof supabaseServer>>;
  memberId: string;
  conversation: ConversationRow;
}

/**
 * The one gate every action below passes through. It answers three questions in
 * order: is this a real account, does that account still exist, and does the
 * conversation it names exist for them. Only then is there a client to write
 * with and an organization to write into.
 */
async function openWrite(conversationId: string): Promise<Ready | { ok: false; error: string }> {
  if (!UUID.test(conversationId)) return { ok: false, error: NOT_FOUND };

  const session = await currentSession();
  if (!session) return { ok: false, error: REFUSED_SIGNED_OUT };
  if (!session.canWrite) return { ok: false, error: REFUSED_DEMO };

  const db = await supabaseServer();
  const { data, error } = await db
    .from("conversations")
    .select("id, organization_id, status, assignee_member_id")
    .eq("id", conversationId)
    .maybeSingle<ConversationRow>();

  if (error || !data) return { ok: false, error: NOT_FOUND };
  return { ok: true, db, memberId: session.member.id, conversation: data };
}

/**
 * The trail behind a figure on a report. It is written after the change it
 * describes, never before, so no line here claims something that did not happen.
 *
 * A failure to write the trail does not turn the change into a failure: the
 * change is already in the table the reader is looking at, and telling them
 * otherwise would be the lie this whole file exists to avoid. It is logged on
 * the server instead, where someone can act on it.
 */
async function record(
  ready: Ready,
  action: string,
  entity: string,
  entityId: string,
  detail: Record<string, unknown>,
): Promise<void> {
  const { error } = await ready.db.from("audit_logs").insert({
    organization_id: ready.conversation.organization_id,
    actor_member_id: ready.memberId,
    action,
    entity,
    entity_id: entityId,
    detail,
  });

  if (error) {
    console.error(`audit_logs: ${action} sur ${entity} ${entityId} non enregistré`, error.message);
  }
}

/** Attribuer la conversation à quelqu'un, ou lui retirer son responsable. */
export async function assignConversation(
  conversationId: string,
  memberId: string | null,
): Promise<Result> {
  const ready = await openWrite(conversationId);
  if (!ready.ok) return ready;

  if (memberId !== null) {
    if (!UUID.test(memberId)) return { ok: false, error: NOT_ON_TEAM };

    // The column's foreign key accepts any member of any shop. This is the check
    // that keeps a conversation from landing on someone else's team.
    const { data: member } = await ready.db
      .from("organization_members")
      .select("id")
      .eq("id", memberId)
      .eq("organization_id", ready.conversation.organization_id)
      .is("archived_at", null)
      .maybeSingle<{ id: string }>();

    if (!member) return { ok: false, error: NOT_ON_TEAM };
  }

  // select() is what makes a refused write visible: row level security answers a
  // forbidden update with zero rows and no error, and an unchecked update would
  // report that silence as a success.
  const { data, error } = await ready.db
    .from("conversations")
    .update({ assignee_member_id: memberId, updated_at: new Date().toISOString() })
    .eq("id", conversationId)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error || !data) return { ok: false, error: WRITE_FAILED };

  await record(
    ready,
    memberId ? "conversation.assigned" : "conversation.unassigned",
    "conversation",
    conversationId,
    { from: ready.conversation.assignee_member_id, to: memberId },
  );

  revalidatePath("/inbox");
  return { ok: true };
}

async function changeStatus(
  conversationId: string,
  status: "resolved" | "snoozed",
  action: string,
): Promise<Result> {
  const ready = await openWrite(conversationId);
  if (!ready.ok) return ready;

  const { data, error } = await ready.db
    .from("conversations")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", conversationId)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error || !data) return { ok: false, error: WRITE_FAILED };

  await record(ready, action, "conversation", conversationId, {
    from: ready.conversation.status,
    to: status,
  });

  revalidatePath("/inbox");
  return { ok: true };
}

/** Marquer la conversation comme résolue. */
export async function resolveConversation(conversationId: string): Promise<Result> {
  return changeStatus(conversationId, "resolved", "conversation.resolved");
}

/** Reporter la conversation. */
export async function snoozeConversation(conversationId: string): Promise<Result> {
  return changeStatus(conversationId, "snoozed", "conversation.snoozed");
}

/**
 * A note for the team, never for the customer. It is a message with direction
 * "note", which is the same distinction the thread already draws on screen.
 *
 * last_message_at is deliberately left alone: it orders the inbox by what the
 * customer last did, and an internal note is not that.
 */
export async function addInternalNote(conversationId: string, body: string): Promise<Result> {
  const text = body.trim();
  if (!text) return { ok: false, error: "Écrivez la note avant de l'ajouter." };
  if (text.length > 4000) {
    return { ok: false, error: "Cette note est trop longue. Raccourcissez-la avant de l'ajouter." };
  }

  const ready = await openWrite(conversationId);
  if (!ready.ok) return ready;

  const { data, error } = await ready.db
    .from("messages")
    .insert({
      organization_id: ready.conversation.organization_id,
      conversation_id: conversationId,
      direction: "note",
      body: text,
      author_member_id: ready.memberId,
    })
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error || !data) return { ok: false, error: NOTE_FAILED };

  await record(ready, "conversation.note_added", "message", data.id, {
    conversation_id: conversationId,
    length: text.length,
  });

  revalidatePath("/inbox");
  return { ok: true };
}
