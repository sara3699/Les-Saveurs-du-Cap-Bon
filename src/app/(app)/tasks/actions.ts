"use server";

import { revalidatePath } from "next/cache";
import { currentSession } from "@/lib/session";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * Cocher une relance, pour de vrai.
 *
 * The browser sends the follow-up and whether it is now done. It does not send
 * who is asking, because a browser can say anything: the session is read again
 * here, on the server, and a demonstration visit is refused before a single
 * query is sent. What does go to the database goes through the request scoped
 * client, so row level security sees the signed in person and applies the same
 * rules it would apply to anyone else.
 */

export type TaskWriteResult = { ok: true } | { ok: false; error: string };

/** Postgres rejects a malformed uuid with an error nobody can read. Catch it here. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function setTaskCompleted(taskId: string, done: boolean): Promise<TaskWriteResult> {
  if (!UUID.test(taskId)) {
    return { ok: false, error: "Cette relance n'a pas d'identifiant valide, rien n'a été modifié." };
  }

  const session = await currentSession();
  if (!session) {
    return {
      ok: false,
      error: "Votre session s'est terminée. Reconnectez-vous, puis cochez la relance à nouveau.",
    };
  }

  // The demonstration door. The database would refuse the write at the row level
  // security layer anyway, so nothing is attempted and the reader is told why.
  if (!session.canWrite) {
    return {
      ok: false,
      error:
        "L'entrée de démonstration n'enregistre rien. Connectez-vous avec un compte pour cocher une relance.",
    };
  }

  // Past this point the database is configured: canWrite is only ever true for a
  // person the database itself recognised, which it cannot do when it is absent.
  const db = await supabaseServer();
  const completedAt = done ? new Date().toISOString() : null;

  // The row comes back so the audit line is filed against the organisation the
  // database actually wrote to, never against one worked out in the browser.
  // Nothing here names an organisation in the filter: row level security already
  // limits the update to the shops this person belongs to.
  const { data: task, error } = await db
    .from("tasks")
    .update({ completed_at: completedAt, updated_at: new Date().toISOString() })
    .eq("id", taskId)
    .select("id, organization_id, title")
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      error: "L'enregistrement a échoué. Réessayez dans un instant.",
    };
  }

  // No error and no row means the update matched nothing: the follow-up has been
  // deleted, or it belongs to a shop this account cannot write to. Either way it
  // is not saved, and the screen must not pretend otherwise.
  if (!task) {
    return {
      ok: false,
      error:
        "Cette relance n'a pas pu être enregistrée. Elle a peut-être été supprimée, ou votre compte n'a pas le droit de la modifier.",
    };
  }

  // The trace, so a completed follow-up on a report leads back to a person and
  // a moment. If this line fails the follow-up is still saved, so the reader is
  // not told the opposite; only the trace is missing.
  await db.from("audit_logs").insert({
    organization_id: task.organization_id,
    actor_member_id: session.member.id,
    action: done ? "task.completed" : "task.reopened",
    entity: "task",
    entity_id: task.id,
    detail: { title: task.title, completed_at: completedAt },
  });

  // The screen groups by due date and by completion, so the next render has to
  // be built again rather than served from the last one.
  revalidatePath("/tasks");

  return { ok: true };
}
