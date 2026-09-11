import { NextResponse } from "next/server";
import { captureMeta } from "@/lib/receipts/schema";
import {
  displayFileName,
  hashBytes,
  storagePath,
  validateReceiptFile,
} from "@/lib/receipts/files";
import { parseQrPayload } from "@/lib/receipts/qr";
import { currentSession } from "@/lib/session";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * Where a photographed receipt arrives.
 *
 * The bytes come here rather than straight to storage, because the only honest way to
 * know what a file is is to look at it, and the browser cannot be asked to do that on
 * our behalf. So the order is: check the bytes, refuse or accept, take the row, then
 * store the file. Taking the row first means a refused upload never leaves a file
 * behind with nothing pointing at it.
 *
 * Everything runs as the person who signed in. There is no service-role key in this
 * project and this route does not introduce one: row level security is what decides
 * whether this receipt may be filed at all.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "receipts";

export async function POST(request: Request) {
  const session = await currentSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "Votre session a expiré. Reconnectez-vous." },
      { status: 401 },
    );
  }
  if (!session.canWrite || !session.organizationId) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Cette visite passe par l'entrée de démonstration, qui peut tout consulter et rien enregistrer. Connectez-vous avec un compte pour déposer un reçu.",
      },
      { status: 403 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Le fichier n'a pas pu être lu. Réessayez." },
      { status: 400 },
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Aucun fichier n'a été envoyé." }, { status: 400 });
  }

  const meta = captureMeta.safeParse({
    source_type: form.get("source_type") ?? undefined,
    qr_payload: form.get("qr_payload") ?? undefined,
  });
  if (!meta.success) {
    return NextResponse.json(
      { ok: false, error: "Les informations de capture ne sont pas valides." },
      { status: 400 },
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const verdict = validateReceiptFile({
    fileName: file.name,
    declaredType: file.type,
    size: file.size,
    bytes,
  });
  if (!verdict.ok || !verdict.mime || !verdict.extension) {
    return NextResponse.json({ ok: false, error: verdict.error }, { status: 415 });
  }

  // Whatever the browser decoded is a string a stranger printed. It is parsed here,
  // on the server, and only what survives that is stored.
  const qr = meta.data.qr_payload ? parseQrPayload(meta.data.qr_payload) : null;

  const hash = await hashBytes(bytes);
  const path = storagePath({ organizationId: session.organizationId, extension: verdict.extension });
  const db = await supabaseServer();

  const { data, error } = await db.rpc("register_receipt", {
    p_payload: {
      file_path: path,
      file_name: displayFileName(file.name),
      file_mime: verdict.mime,
      file_size: bytes.length,
      file_hash: hash,
      source_type: meta.data.source_type,
      qr_payload: qr?.raw ?? null,
      qr_kind: qr?.kind ?? null,
      verification_url: qr?.verificationUrl ?? null,
    },
  });

  if (error) {
    // Precise in the log, vague to the caller: the message can quote the receipt back.
    console.error("receipt could not be registered", error.message);
    return NextResponse.json(
      { ok: false, error: "Le reçu n'a pas pu être enregistré. Réessayez." },
      { status: 502 },
    );
  }

  const result = data as { ok: boolean; error?: string; receipt_id?: string };
  if (!result?.ok) {
    if (result?.error === "duplicate_file") {
      return NextResponse.json(
        {
          ok: false,
          error: "Ce fichier a déjà été déposé. Ouvrez le reçu existant plutôt que d'en créer un second.",
          receiptId: result.receipt_id ?? null,
          duplicate: true,
        },
        { status: 409 },
      );
    }
    const message =
      result?.error === "too_many_requests"
        ? "Trop de reçus déposés d'un coup. Attendez une minute."
        : result?.error === "not_a_member"
          ? "Ce compte n'appartient à aucune boutique."
          : "Le reçu n'a pas pu être enregistré.";
    const status = result?.error === "too_many_requests" ? 429 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }

  const receiptId = result.receipt_id!;
  const upload = await db.storage.from(BUCKET).upload(path, bytes, {
    contentType: verdict.mime,
    upsert: false,
  });

  if (upload.error) {
    // The row would otherwise sit there for ever pointing at a file that was never
    // stored, and its hash would block a second attempt at the same receipt.
    console.error("receipt file could not be stored", upload.error.message);
    await db.rpc("discard_receipt", { p_receipt: receiptId });
    return NextResponse.json(
      { ok: false, error: "Le fichier n'a pas pu être enregistré. Réessayez." },
      { status: 502 },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      receiptId,
      previewable: verdict.previewable,
      mime: verdict.mime,
      qrKind: qr?.kind ?? null,
      qrNeedsReview: qr?.needsReview ?? false,
      qrReason: qr?.reason ?? null,
    },
    { status: 201 },
  );
}

export async function GET() {
  return NextResponse.json(
    { ok: false, error: "Envoyez le fichier en POST." },
    { status: 405 },
  );
}
