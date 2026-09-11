"use server";

import { revalidatePath } from "next/cache";
import { receiptReview } from "@/lib/receipts/schema";
import { canSeeFinances, currentSession } from "@/lib/session";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * What the review screen does when a person presses a button.
 *
 * The session is re-read here rather than trusted from the browser, and the whole
 * receipt is written by one database function so a correction cannot leave the lines
 * and the total disagreeing with each other.
 *
 * Verifying is the owner's. That is checked in the database, and the answer it gives
 * is passed through rather than translated into a shrug, so the screen can say why.
 */

export interface ReceiptActionResult {
  ok: boolean;
  status?: string;
  error?: string;
  fields?: { champ: string; probleme: string }[];
}

const EXPIRED: ReceiptActionResult = {
  ok: false,
  error: "Votre session a expiré. Reconnectez-vous.",
};

const DEMO_DOOR: ReceiptActionResult = {
  ok: false,
  error:
    "Cette visite passe par l'entrée de démonstration, qui peut tout consulter et rien enregistrer. Connectez-vous avec un compte pour modifier un reçu.",
};

function refresh(receiptId: string) {
  revalidatePath("/receipts");
  revalidatePath(`/receipts/${receiptId}`);
  revalidatePath("/dashboard");
}

export async function saveReceipt(
  _previous: ReceiptActionResult | null,
  formData: FormData,
): Promise<ReceiptActionResult> {
  const session = await currentSession();
  if (!session) return EXPIRED;
  if (!session.canWrite) return DEMO_DOOR;

  const receiptId = String(formData.get("receipt_id") ?? "");
  if (receiptId === "") return { ok: false, error: "Ce reçu est introuvable." };

  let payload: unknown;
  try {
    payload = JSON.parse(String(formData.get("payload") ?? "{}"));
  } catch {
    return { ok: false, error: "Le reçu n'a pas pu être lu." };
  }

  // Which button was pressed, rather than a flag the browser could set on its own.
  const intent = String(formData.get("intent") ?? "save");

  const parsed = receiptReview.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Il y a encore quelque chose à corriger.",
      fields: parsed.error.issues.map((issue) => ({
        champ: issue.path.map(String).join("."),
        probleme: issue.message,
      })),
    };
  }

  // Asking to verify without the role is refused here as well as in the database, so
  // the person is told rather than watching a button do nothing.
  if (intent === "verify" && !canSeeFinances(session.member.role)) {
    return {
      ok: false,
      error: "Seule la propriétaire peut vérifier un reçu. Le vôtre reste « À vérifier ».",
    };
  }

  const db = await supabaseServer();
  const { data, error } = await db.rpc("save_receipt", {
    p_receipt: receiptId,
    p_payload: { ...parsed.data, verify: intent === "verify", draft: intent === "draft" },
  });

  if (error) {
    console.error("receipt could not be saved", error.message);
    return { ok: false, error: "Le reçu n'a pas pu être enregistré. Réessayez." };
  }

  const result = data as { ok: boolean; status?: string; error?: string };
  if (!result?.ok) {
    return { ok: false, error: refusal(result?.error) };
  }

  refresh(receiptId);
  return { ok: true, status: result.status };
}

export async function archiveReceipt(
  _previous: ReceiptActionResult | null,
  formData: FormData,
): Promise<ReceiptActionResult> {
  const session = await currentSession();
  if (!session) return EXPIRED;
  if (!session.canWrite) return DEMO_DOOR;

  const receiptId = String(formData.get("receipt_id") ?? "");
  const db = await supabaseServer();
  const { data, error } = await db.rpc("archive_receipt", { p_receipt: receiptId });

  if (error) {
    console.error("receipt could not be archived", error.message);
    return { ok: false, error: "Le reçu n'a pas pu être archivé. Réessayez." };
  }

  const result = data as { ok: boolean; status?: string; error?: string };
  if (!result?.ok) return { ok: false, error: refusal(result?.error) };

  refresh(receiptId);
  return { ok: true, status: result.status };
}

export async function reprocessReceipt(
  _previous: ReceiptActionResult | null,
  formData: FormData,
): Promise<ReceiptActionResult> {
  const session = await currentSession();
  if (!session) return EXPIRED;
  if (!session.canWrite) return DEMO_DOOR;

  const receiptId = String(formData.get("receipt_id") ?? "");
  const db = await supabaseServer();
  const { data, error } = await db.rpc("reprocess_receipt", { p_receipt: receiptId });

  if (error) {
    console.error("receipt could not be queued for a second read", error.message);
    return { ok: false, error: "La relecture n'a pas pu être lancée. Réessayez." };
  }

  const result = data as { ok: boolean; status?: string; error?: string };
  if (!result?.ok) return { ok: false, error: refusal(result?.error) };

  refresh(receiptId);
  return { ok: true, status: result.status };
}

function refusal(code: string | undefined): string {
  switch (code) {
    case "owner_only":
      return "Seule la propriétaire peut faire cela.";
    case "not_found":
      return "Ce reçu est introuvable.";
    case "archived":
      return "Ce reçu est archivé. Sortez-le des archives avant de le relire.";
    case "not_a_member":
      return "Ce compte n'appartient à aucune boutique.";
    default:
      return "Cette modification a été refusée.";
  }
}
