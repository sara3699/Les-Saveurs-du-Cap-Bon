import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { websiteIntake } from "@/lib/intake/schema";
import { supabaseEnv } from "@/lib/supabase/env";

/**
 * The address the shop's own website posts an order to.
 *
 * It authenticates with one secret key, which the database checks against a hash;
 * this route never learns which shop the key belongs to, and never names one. The
 * work happens inside a single database function so a half written order cannot
 * survive a failure halfway through.
 *
 * The key belongs on the site's server, never in a page a visitor can read.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function readKey(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  return request.headers.get("x-intake-key");
}

export async function POST(request: Request) {
  const key = readKey(request);
  if (!key) {
    return NextResponse.json(
      { ok: false, error: "Clé manquante. Envoyez-la dans l'en-tête Authorization: Bearer." },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Le corps doit être du JSON." }, { status: 400 });
  }

  const parsed = websiteIntake.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Certains champs ne sont pas valides.",
        details: parsed.error.issues.map((i) => ({ champ: i.path.map(String).join("."), probleme: i.message })),
      },
      { status: 400 },
    );
  }

  const { url, key: anonKey } = supabaseEnv();
  const db = createClient(url, anonKey, { auth: { persistSession: false } });

  const { data, error } = await db.rpc("ingest_website_order", {
    p_key: key,
    p_payload: parsed.data,
  });

  if (error) {
    // The message is deliberately vague to the caller and precise in the log.
    console.error("website intake failed", error.message);
    return NextResponse.json({ ok: false, error: "La commande n'a pas pu être enregistrée." }, { status: 502 });
  }

  const result = data as { ok: boolean; error?: string; duplicate?: boolean; reference?: string };

  if (!result?.ok) {
    const status =
      result?.error === "unauthorised" ? 401 : result?.error === "too_many_requests" ? 429 : 400;
    const message =
      result?.error === "unauthorised"
        ? "Clé refusée."
        : result?.error === "too_many_requests"
          ? "Trop d'envois. Réessayez dans une minute."
          : result?.error === "name_required"
            ? "Le nom du client est obligatoire."
            : "Il faut un numéro de téléphone ou une adresse e-mail.";
    return NextResponse.json({ ok: false, error: message }, { status });
  }

  // A repeat of something already received is a success, not a second order.
  return NextResponse.json(
    {
      ok: true,
      duplicate: result.duplicate ?? false,
      reference: result.reference ?? null,
    },
    { status: result.duplicate ? 200 : 201 },
  );
}

export async function GET() {
  return NextResponse.json(
    { ok: false, error: "Envoyez une requête POST en JSON." },
    { status: 405 },
  );
}
