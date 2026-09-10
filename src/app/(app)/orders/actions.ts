"use server";

import { revalidatePath } from "next/cache";
import { manualOrder } from "@/lib/intake/manual";
import { currentSession } from "@/lib/session";
import { supabaseServer } from "@/lib/supabase/server";

export interface ManualOrderResult {
  ok: boolean;
  reference?: string;
  orderId?: string;
  error?: string;
  fields?: { champ: string; probleme: string }[];
}

/**
 * Records an order taken on the telephone or at the counter.
 *
 * The session is re-read here rather than trusted from the browser, and the whole
 * order is written by one database function so a failure cannot leave an order
 * without its lines. A demonstration visit is refused before any query is sent.
 */
export async function createManualOrder(
  _previous: ManualOrderResult | null,
  formData: FormData,
): Promise<ManualOrderResult> {
  const session = await currentSession();
  if (!session) {
    return { ok: false, error: "Votre session a expiré. Reconnectez-vous." };
  }
  if (!session.canWrite) {
    return {
      ok: false,
      error:
        "Cette visite passe par l'entrée de démonstration, qui peut tout consulter et rien enregistrer. Connectez-vous avec un compte pour saisir une commande.",
    };
  }

  let payload: unknown;
  try {
    payload = JSON.parse(String(formData.get("payload") ?? "{}"));
  } catch {
    return { ok: false, error: "La commande n'a pas pu être lue." };
  }

  const parsed = manualOrder.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Il manque quelque chose dans la commande.",
      fields: parsed.error.issues.map((i) => ({
        champ: i.path.map(String).join("."),
        probleme: i.message,
      })),
    };
  }

  const db = await supabaseServer();
  const { data, error } = await db.rpc("create_manual_order", { p_payload: parsed.data });

  if (error) {
    console.error("manual order failed", error.message);
    return { ok: false, error: "La commande n'a pas pu être enregistrée. Réessayez." };
  }

  const result = data as { ok: boolean; error?: string; reference?: string; order_id?: string };
  if (!result?.ok) {
    const message =
      result?.error === "items_required"
        ? "Ajoutez au moins un article."
        : result?.error === "name_required"
          ? "Choisissez un client ou donnez un nom."
          : "La commande n'a pas pu être enregistrée.";
    return { ok: false, error: message };
  }

  revalidatePath("/orders");
  revalidatePath("/dashboard");
  revalidatePath("/contacts");

  return { ok: true, reference: result.reference, orderId: result.order_id };
}
