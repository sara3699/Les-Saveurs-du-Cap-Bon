import { NextResponse } from "next/server";
import { demoReceiptImageText } from "@/lib/mock/receipts";
import { currentSession } from "@/lib/session";
import { supabaseConfigured } from "@/lib/supabase/env";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * The original, shown back to the person checking it.
 *
 * The bucket is private, so there is no address for a receipt that works on its own.
 * This mints one that lasts five minutes and sends the reader to it. Whether it may be
 * minted at all is decided by row level security on the stored object, not here, which
 * is why this route has no role check of its own to get wrong.
 *
 * With no database configured there is no file either, so what comes back is a drawing
 * of the sample text. It is labelled as a drawing, because a placeholder that looks
 * like a photograph is a small lie that gets repeated every time the screen is shown.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "receipts";
const SIGNED_FOR_SECONDS = 300;

type Params = Promise<{ id: string }>;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sampleDrawing(text: string): string {
  const rows = text.split("\n").slice(0, 32);
  const height = 90 + rows.length * 20;
  const lines = rows
    .map(
      (line, index) =>
        `<text x="34" y="${78 + index * 20}" class="l">${escapeXml(line.slice(0, 52))}</text>`,
    )
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 ${height}" width="520" height="${height}" role="img" aria-label="Dessin d'un reçu d'exemple">
<style>
  .p { fill: #FFFEFA; stroke: #DDE9E4; }
  .l { font: 13px ui-monospace, "SF Mono", Menlo, monospace; fill: #16211E; }
  .t { font: 600 12px ui-sans-serif, system-ui, sans-serif; fill: #7A5300; }
</style>
<rect width="520" height="${height}" fill="#EDF4F1"/>
<rect class="p" x="18" y="18" width="484" height="${height - 36}" rx="10"/>
<text x="34" y="44" class="t">Exemple dessiné, ce n'est pas la photo d'un vrai reçu</text>
${lines}
</svg>`;
}

export async function GET(_request: Request, { params }: { params: Params }) {
  const { id } = await params;
  const session = await currentSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "Votre session a expiré. Reconnectez-vous." },
      { status: 401 },
    );
  }

  if (!supabaseConfigured()) {
    const text = demoReceiptImageText(id);
    if (!text) {
      return NextResponse.json({ ok: false, error: "Ce reçu est introuvable." }, { status: 404 });
    }
    return new NextResponse(sampleDrawing(text), {
      headers: {
        "content-type": "image/svg+xml; charset=utf-8",
        "cache-control": "private, max-age=60",
      },
    });
  }

  const db = await supabaseServer();
  const { data: row, error } = await db
    .from("receipts")
    .select("file_path")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("receipt path could not be read", error.message);
    return NextResponse.json({ ok: false, error: "Le reçu n'a pas pu être lu." }, { status: 502 });
  }
  if (!row) {
    return NextResponse.json({ ok: false, error: "Ce reçu est introuvable." }, { status: 404 });
  }

  const signed = await db.storage
    .from(BUCKET)
    .createSignedUrl(row.file_path as string, SIGNED_FOR_SECONDS);

  if (signed.error || !signed.data) {
    // Storage refuses a reader who is not allowed the file, which is the same answer
    // as a file that is not there. Neither says which to the person asking.
    return NextResponse.json(
      { ok: false, error: "Ce fichier n'est pas disponible." },
      { status: 404 },
    );
  }

  return NextResponse.redirect(signed.data.signedUrl, {
    status: 307,
    headers: { "cache-control": "private, no-store" },
  });
}
