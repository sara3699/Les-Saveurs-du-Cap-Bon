import { NextResponse } from "next/server";
import { extractReceipt } from "@/lib/receipts/extract";
import { parseQrPayload } from "@/lib/receipts/qr";
import { scanFileForQr } from "@/lib/receipts/scan-server";
import { judgeExtraction, rejectionNote } from "@/lib/receipts/validate";
import { OcrUnavailable, ocrProvider } from "@/lib/ocr";
import { currentSession } from "@/lib/session";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * Reading a receipt that has already been stored.
 *
 * Kept out of the upload so that a slow or failing reader cannot lose a file that was
 * safely received, and so that a failed read can be tried again without uploading the
 * photograph a second time.
 *
 * It is safe to call twice. The database refuses to act on a receipt somebody has
 * already looked at, and replaces the lines and field notes rather than adding to them,
 * so a retry produces one receipt and not two.
 *
 * There is no queue here. For one shop filing a few receipts a day, a request that
 * waits is the right shape and an honest one. `docs-receipts.md` records what would
 * have to move to pgmq at a scale this is not built for.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Cloud Vision takes its time on a photograph of a long till roll. */
export const maxDuration = 120;

const BUCKET = "receipts";

type Params = Promise<{ id: string }>;

export async function POST(_request: Request, { params }: { params: Params }) {
  const { id } = await params;
  const session = await currentSession();

  if (!session) {
    return NextResponse.json(
      { ok: false, error: "Votre session a expiré. Reconnectez-vous." },
      { status: 401 },
    );
  }
  if (!session.canWrite) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Cette visite passe par l'entrée de démonstration, qui peut tout consulter et rien enregistrer.",
      },
      { status: 403 },
    );
  }

  const db = await supabaseServer();
  const { data: row, error: readError } = await db
    .from("receipts")
    .select("id, status, file_path, file_mime, file_hash, file_name, qr_payload, currency")
    .eq("id", id)
    .maybeSingle();

  if (readError) {
    console.error("receipt could not be read before processing", readError.message);
    return NextResponse.json({ ok: false, error: "Le reçu n'a pas pu être lu." }, { status: 502 });
  }
  if (!row) {
    return NextResponse.json({ ok: false, error: "Ce reçu est introuvable." }, { status: 404 });
  }

  // The database will refuse anyway; answering here saves downloading the file and
  // paying a reader for a receipt somebody has already corrected.
  if (row.status !== "draft" && row.status !== "error") {
    return NextResponse.json({ ok: true, skipped: true, status: row.status });
  }

  const reader = ocrProvider();

  // A code the server read off the file, kept here so the failure path below can
  // still record it. Reading the receipt and finding its code are separate successes,
  // and losing the second because the first failed is the bug this variable prevents.
  let foundOnServer: string | null = null;

  const fail = async (message: string) => {
    if (foundOnServer) {
      const parsed = parseQrPayload(foundOnServer);
      await db.rpc("attach_receipt_qr", {
        p_receipt: id,
        p_payload: {
          qr_payload: parsed.raw,
          qr_kind: parsed.kind,
          verification_url: parsed.verificationUrl,
        },
      });
    }
    await db.rpc("apply_receipt_extraction", {
      p_receipt: id,
      p_payload: {
        error: message,
        provider: reader.name,
        reasons: [{ code: "unreadable", message }],
        missing_fields: ["merchant_name", "total_amount", "purchase_date"],
      },
    });
    return NextResponse.json({
      ok: true,
      status: "rejected",
      extracted_data: null,
      reasons: [message],
      reason_codes: ["unreadable"],
      missing_fields: ["merchant_name", "total_amount", "purchase_date"],
      confidence: 0,
      file_reference: id,
      suggested_next_step: "manual review",
    });
  };

  const download = await db.storage.from(BUCKET).download(row.file_path as string);
  if (download.error || !download.data) {
    console.error("receipt file could not be fetched", download.error?.message);
    return await fail("Le fichier du reçu n'a pas pu être retrouvé. Déposez-le à nouveau.");
  }

  const bytes = new Uint8Array(await download.data.arrayBuffer());
  const mime = row.file_mime as string;

  // The browser reads codes off photographs before sending them, and cannot read one
  // inside a PDF at all. The file is here now, so the server looks for itself. This is
  // also the only look a PDF ever gets, and PDFs are how suppliers send invoices.
  if (!row.qr_payload) {
    foundOnServer = await scanFileForQr(bytes, mime);
  }

  if (!reader.accepts(mime)) {
    return await fail(
      "Ce format ne peut pas être lu automatiquement par le service configuré. Envoyez une photo JPG ou PNG, ou un PDF, ou saisissez les montants à la main.",
    );
  }

  let read;
  try {
    read = await reader.extract({
      bytes,
      mime,
      fileName: null,
      fileHash: row.file_hash as string,
    });
  } catch (cause) {
    if (cause instanceof OcrUnavailable) return await fail(cause.frenchMessage);
    // The message is not shown: it can contain the contents of the receipt.
    console.error("receipt reader failed", cause instanceof Error ? cause.name : "unknown");
    return await fail("La lecture a échoué. Réessayez, ou saisissez les montants à la main.");
  }

  // One parse point for both, because whoever found the code, it is still a string a
  // stranger printed and parseQrPayload is the only thing allowed to judge it. What the
  // browser found wins: it saw the paper, and the server is only the safety net.
  const raw = (row.qr_payload as string | null) ?? foundOnServer;
  const qr = raw ? parseQrPayload(raw) : null;
  const extracted = extractReceipt(read.rawText, qr);

  // Is this good enough to hand somebody as a receipt? Decided in one place, on the
  // extraction rather than on the provider's text, so it holds whichever reader ran.
  const verdict = judgeExtraction({
    extraction: extracted,
    rawText: read.rawText,
    fallbackCurrency: (row.currency as string | null) ?? "TND",
  });

  const asText = (value: number | null) => (value === null ? null : String(value));

  const { data, error } = await db.rpc("apply_receipt_extraction", {
    p_receipt: id,
    p_payload: {
      merchant_name: extracted.merchant_name,
      merchant_address: extracted.merchant_address,
      tax_identifier: extracted.tax_identifier,
      receipt_number: extracted.receipt_number,
      purchase_date: extracted.purchase_date,
      purchase_time: extracted.purchase_time,
      currency: extracted.currency,
      subtotal: asText(extracted.subtotal),
      discount: asText(extracted.discount),
      tax_amount: asText(extracted.tax_amount),
      tip_amount: asText(extracted.tip_amount),
      total_amount: asText(extracted.total_amount),
      payment_method: extracted.payment_method,
      card_last_four: extracted.card_last_four,
      qr_payload: qr?.raw ?? null,
      qr_kind: qr?.kind ?? null,
      verification_url: qr?.verificationUrl ?? null,
      raw_ocr_text: read.rawText.slice(0, 20_000),
      rejected: verdict.status === "rejected",
      reasons: verdict.reasons,
      missing_fields: verdict.missingFields,
      note: rejectionNote(verdict),
      provider: read.provider,
      confidence: String(Math.min(read.confidence, extracted.confidence || read.confidence)),
      items: extracted.items.map((item) => ({
        description: item.description,
        quantity: String(item.quantity),
        unit_price: String(item.unit_price),
        total_amount: String(item.total_amount),
        confidence: String(item.confidence),
      })),
      fields: extracted.fields.map((field) => ({
        field_name: field.field_name,
        raw_value: field.raw_value,
        normalized_value: field.normalized_value,
        confidence: String(field.confidence),
      })),
    },
  });

  if (error) {
    console.error("extraction could not be saved", error.message);
    return NextResponse.json(
      { ok: false, error: "La lecture n'a pas pu être enregistrée. Réessayez." },
      { status: 502 },
    );
  }

  const result = data as { ok: boolean; status?: string; skipped?: boolean; error?: string };
  if (!result?.ok) {
    return NextResponse.json(
      { ok: false, error: "La lecture n'a pas pu être enregistrée." },
      { status: 400 },
    );
  }

  // The shape a dashboard can consume. `extracted_data` carries what was read even when
  // the verdict is "rejected": the file is kept, the reading is kept, and only the claim
  // that it can be trusted is withheld. Nothing in it was invented, so a missing total
  // arrives as null rather than as a plausible number.
  return NextResponse.json({
    ok: true,
    status: verdict.status,
    extracted_data: {
      merchant_name: extracted.merchant_name,
      merchant_address: extracted.merchant_address,
      tax_identifier: extracted.tax_identifier,
      receipt_number: extracted.receipt_number,
      purchase_date: extracted.purchase_date,
      purchase_time: extracted.purchase_time,
      currency: extracted.currency ?? ((row.currency as string | null) ?? "TND"),
      subtotal: extracted.subtotal,
      discount: extracted.discount,
      tax_amount: extracted.tax_amount,
      tip_amount: extracted.tip_amount,
      total_amount: extracted.total_amount,
      payment_method: extracted.payment_method,
      card_last_four: extracted.card_last_four,
      line_items: extracted.items,
      field_confidence: Object.fromEntries(
        extracted.fields.map((field) => [field.field_name, field.confidence]),
      ),
    },
    reasons: verdict.reasons.map((reason) => reason.message),
    reason_codes: verdict.reasons.map((reason) => reason.code),
    missing_fields: verdict.missingFields,
    confidence: verdict.confidence,
    file_reference: id,
    suggested_next_step: "manual review",

    // What this application's own screens read, unchanged.
    skipped: result.skipped ?? false,
    demo: read.demo,
    provider: read.provider,
    qrNeedsReview: qr?.needsReview ?? false,
    qrReason: qr?.reason ?? null,
  });
}
