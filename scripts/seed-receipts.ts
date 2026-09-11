/**
 * Fills the demonstration shop with receipts.
 *
 * It does not insert rows. It signs in as a real member and walks the same path the
 * application does: generate a file, upload it through row level security, register it,
 * read it with the demonstration reader, and let the owner verify some of them. So if
 * this script works, the feature works, and if a policy is wrong this is where it shows.
 *
 * It is safe to run twice. The same file cannot be filed twice, so a second run adds
 * nothing. Run it with:
 *
 *   npx tsx scripts/seed-receipts.ts
 *   npx tsx scripts/seed-receipts.ts --reset    (clears the shop's receipts first)
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { demoReceiptText } from "../src/lib/ocr/demo";
import { extractReceipt } from "../src/lib/receipts/extract";
import { hashBytes, storagePath } from "../src/lib/receipts/files";
import { judgeExtraction, rejectionNote } from "../src/lib/receipts/validate";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((line) => line.includes("=") && !line.trim().startsWith("#"))
    .map((line) => {
      const at = line.indexOf("=");
      return [line.slice(0, at).trim(), line.slice(at + 1).trim()];
    }),
);

const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const DEMO_ORG = "10f2108b-0e88-46ba-a9bb-d53550b0fbdb";
const BUCKET = "receipts";
const COUNT = 26;

const PEOPLE = [
  { email: "sarra@saveurs-demo.tn", password: "kQ7-marsa-91", role: "owner" as const },
  { email: "mouna@saveurs-demo.tn", password: "pT9-korba-52", role: "agent" as const },
];

/**
 * A one-page PDF, written by hand.
 *
 * The alternative was committing a megabyte of sample photographs to a public
 * repository. This draws the same text the demonstration reader will later claim to
 * have read, so the file and the figures on the screen agree with each other.
 */
function miniPdf(text: string): Uint8Array {
  const escape = (line: string) => {
    let out = "";
    for (const character of line) {
      const code = character.codePointAt(0) ?? 63;
      if (character === "(" || character === ")" || character === "\\") out += `\\${character}`;
      else if (code < 32) out += " ";
      else if (code < 127) out += character;
      else if (code < 256) out += `\\${code.toString(8).padStart(3, "0")}`;
      else out += "?";
    }
    return out;
  };

  const lines = text.split("\n");
  const height = 48 + lines.length * 12;
  const body = [
    "BT",
    "/F1 8 Tf",
    ...lines.map((line, index) => `1 0 0 1 16 ${height - 26 - index * 12} Tm (${escape(line)}) Tj`),
    "ET",
  ].join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 ${height}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>`,
    `<< /Length ${body.length} >>\nstream\n${body}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>",
  ];

  let file = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((object, index) => {
    offsets.push(file.length);
    file += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefAt = file.length;
  file += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) file += `${String(offset).padStart(10, "0")} 00000 n \n`;
  file += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`;

  return new Uint8Array(Buffer.from(file, "latin1"));
}

async function signIn(person: (typeof PEOPLE)[number]): Promise<SupabaseClient> {
  const client = createClient(URL_, KEY);
  const { error } = await client.auth.signInWithPassword({
    email: person.email,
    password: person.password,
  });
  if (error) throw new Error(`${person.email} could not sign in: ${error.message}`);
  return client;
}

async function reset(owner: SupabaseClient) {
  const { data } = await owner.from("receipts").select("id, file_path").eq("organization_id", DEMO_ORG);
  const rows = (data ?? []) as { id: string; file_path: string }[];
  if (rows.length === 0) {
    console.log("Nothing to clear.");
    return;
  }
  await owner.storage.from(BUCKET).remove(rows.map((row) => row.file_path));
  const { error } = await owner.from("receipts").delete().eq("organization_id", DEMO_ORG);
  if (error) throw new Error(`Receipts could not be cleared: ${error.message}`);
  console.log(`Cleared ${rows.length} receipts and their files.`);
}

async function main() {
  const owner = await signIn(PEOPLE[0]);
  const agent = await signIn(PEOPLE[1]);

  if (process.argv.includes("--reset")) await reset(owner);

  let filed = 0;
  let already = 0;
  let verified = 0;
  let failed = 0;

  for (let index = 0; index < COUNT; index += 1) {
    // Matches the hash the file-less demonstration set uses, so the two look alike.
    const seed = `demo${index}`.padStart(64, "0");
    const { text, confidence } = demoReceiptText(seed);
    const bytes = miniPdf(text);
    const fileHash = await hashBytes(bytes);

    // Every third receipt is filed by the agent, so the screen shows more than one name
    // and the "only your own" rule has something to hide.
    const client = index % 3 === 2 ? agent : owner;
    const path = storagePath({ organizationId: DEMO_ORG, extension: "pdf" });

    const { data: registered, error } = await client.rpc("register_receipt", {
      p_payload: {
        file_path: path,
        file_name: `recu-${index + 1}.pdf`,
        file_mime: "application/pdf",
        file_size: bytes.length,
        file_hash: fileHash,
        source_type: index % 4 === 0 ? "camera" : index % 9 === 3 ? "qr" : "upload",
        qr_payload: index % 9 === 3 ? `FAC-2026-${4000 + index}` : null,
        qr_kind: index % 9 === 3 ? "receipt_number" : null,
      },
    });
    if (error) throw new Error(`register_receipt failed: ${error.message}`);

    const result = registered as { ok: boolean; error?: string; receipt_id?: string };
    if (!result.ok) {
      if (result.error === "duplicate_file") {
        already += 1;
        continue;
      }
      throw new Error(`register_receipt refused: ${result.error}`);
    }
    const receiptId = result.receipt_id!;

    const upload = await client.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: "application/pdf", upsert: false });
    if (upload.error) {
      await client.rpc("discard_receipt", { p_receipt: receiptId });
      throw new Error(`upload failed: ${upload.error.message}`);
    }
    filed += 1;

    // A couple are left unread, so the "Brouillon" state is visible.
    if (index % 7 === 6) continue;

    // A smudged read is refused outright, so the refusal state is visible in the
    // demonstration with the same shape a real one has: reasons and missing fields,
    // not a hand-written sentence.
    if (confidence < 0.7 && index % 2 === 0) {
      const unreadable = {
        code: "unreadable",
        message:
          "Le reçu n'a pas pu être lu : la photo est trop floue, trop sombre, ou ne montre pas un reçu.",
      };
      await client.rpc("apply_receipt_extraction", {
        p_receipt: receiptId,
        p_payload: {
          error: `Receipt could not be reliably parsed. ${unreadable.message}`,
          provider: "demo",
          reasons: [unreadable],
          missing_fields: ["merchant_name", "total_amount", "purchase_date"],
        },
      });
      failed += 1;
      continue;
    }

    const read = extractReceipt(text);
    // The same verdict the processing route reaches, so the demonstration cannot show a
    // state the real path would never produce.
    const verdict = judgeExtraction({ extraction: read, rawText: text, fallbackCurrency: "TND" });
    const asText = (value: number | null) => (value === null ? null : String(value));
    const { error: applyError } = await client.rpc("apply_receipt_extraction", {
      p_receipt: receiptId,
      p_payload: {
        merchant_name: read.merchant_name,
        merchant_address: read.merchant_address,
        tax_identifier: read.tax_identifier,
        receipt_number: read.receipt_number,
        purchase_date: read.purchase_date,
        purchase_time: read.purchase_time,
        currency: read.currency ?? "TND",
        subtotal: asText(read.subtotal),
        tax_amount: asText(read.tax_amount),
        total_amount: asText(read.total_amount),
        payment_method: read.payment_method,
        card_last_four: read.card_last_four,
        raw_ocr_text: text,
        rejected: verdict.status === "rejected",
        reasons: verdict.reasons,
        missing_fields: verdict.missingFields,
        note: rejectionNote(verdict),
        provider: "demo",
        confidence: String(confidence),
        category: categoryFor(read.merchant_name),
        items: read.items.map((item) => ({
          description: item.description,
          quantity: String(item.quantity),
          unit_price: String(item.unit_price),
          total_amount: String(item.total_amount),
          confidence: String(item.confidence),
        })),
        fields: read.fields.map((field) => ({
          field_name: field.field_name,
          raw_value: field.raw_value,
          normalized_value: field.normalized_value,
          confidence: String(field.confidence),
        })),
      },
    });
    if (applyError) throw new Error(`apply_receipt_extraction failed: ${applyError.message}`);

    // Some stay "À vérifier" on purpose, so the owner has something waiting for her.
    if (index % 5 === 4) continue;
    // And a refused one is never then confirmed; that is the whole point of refusing.
    if (verdict.status === "rejected") {
      failed += 1;
      continue;
    }

    const { data: saved, error: saveError } = await owner.rpc("save_receipt", {
      p_receipt: receiptId,
      p_payload: {
        verify: true,
        merchant_name: read.merchant_name,
        merchant_address: read.merchant_address,
        tax_identifier: read.tax_identifier,
        receipt_number: read.receipt_number,
        purchase_date: read.purchase_date,
        purchase_time: read.purchase_time,
        currency: read.currency ?? "TND",
        subtotal: asText(read.subtotal),
        tax_amount: asText(read.tax_amount),
        total_amount: asText(read.total_amount),
        payment_method: read.payment_method,
        card_last_four: read.card_last_four,
        category: categoryFor(read.merchant_name),
      },
    });
    if (saveError) throw new Error(`save_receipt failed: ${saveError.message}`);
    if (!(saved as { ok: boolean }).ok) {
      throw new Error(`save_receipt refused: ${JSON.stringify(saved)}`);
    }
    verified += 1;

    if (index % 13 === 12) {
      await owner.rpc("archive_receipt", { p_receipt: receiptId });
    }
  }

  console.log(
    `Filed ${filed} receipts, ${verified} verified, ${failed} left in error, ${already} were already there.`,
  );
}

function categoryFor(merchant: string | null): string {
  const name = (merchant ?? "").toLowerCase();
  if (name.includes("transport")) return "transport";
  if (name.includes("emballage")) return "packaging";
  if (name.includes("energie") || name.includes("énergie")) return "utilities";
  if (name.includes("imprimerie")) return "marketing";
  return "supplies";
}

main().catch((cause) => {
  console.error(cause instanceof Error ? cause.message : cause);
  process.exit(1);
});
