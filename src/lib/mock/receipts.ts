import {
  EXPENSE_CATEGORY_ORDER,
  type ExpenseCategory,
  type Receipt,
  type ReceiptEvent,
  type ReceiptItem,
  type ReceiptStatus,
} from "@/lib/domain/receipts";
import { demoReceiptText } from "@/lib/ocr/demo";
import { extractReceipt } from "@/lib/receipts/extract";
import { normalizeMerchant } from "@/lib/receipts/normalize";
import { TEAM } from "./core";
import { makeRng } from "./rng";
import { DEMO_NOW, daysAgo } from "./time";

/**
 * The sample receipts the demonstration shows, and the ones the project falls back to
 * when nobody has configured a database.
 *
 * They are not written out by hand. Each one is produced by running the demonstration
 * reader and then the real extractor over its output, which means the sample data is
 * exactly what this product would produce from that file, rather than a tidied version
 * of it that hides how rough a real read is.
 */

const CATEGORY_BY_SUPPLIER: Record<string, ExpenseCategory> = {
  "comptoir exemple gros": "supplies",
  "semoulerie exemple": "supplies",
  "transport exemple": "transport",
  "emballages exemple": "packaging",
  "energie exemple agence": "utilities",
  "imprimerie exemple": "marketing",
};

/** Enough receipts to fill a screen and show every state, without inventing a year of them. */
const COUNT = 26;

function statusFor(index: number, readable: boolean): ReceiptStatus {
  if (!readable) return index % 3 === 0 ? "error" : "to_verify";
  if (index % 13 === 12) return "archived";
  if (index % 7 === 6) return "draft";
  if (index % 5 === 4) return "to_verify";
  return "verified";
}

/** Keyed by receipt id, because history hangs off a receipt rather than living in it. */
export const RECEIPT_EVENTS: Record<string, ReceiptEvent[]> = {};

function build(): Receipt[] {
  const receipts: Receipt[] = [];
  const owner = TEAM[0];

  for (let index = 0; index < COUNT; index += 1) {
    const hash = `demo${index}`.padStart(64, "0");
    const rng = makeRng(index * 7919 + 13);
    const { text, confidence } = demoReceiptText(hash, DEMO_NOW);
    const read = extractReceipt(text);

    const readable = confidence >= 0.7 && read.total_amount !== null;
    const status = statusFor(index, readable);
    const filedBy = TEAM[index % TEAM.length];
    const createdAt = daysAgo(Math.floor(rng() * 80) + 1);

    const merchantKey = normalizeMerchant(read.merchant_name);
    const category: ExpenseCategory =
      (merchantKey ? CATEGORY_BY_SUPPLIER[merchantKey] : undefined) ??
      EXPENSE_CATEGORY_ORDER[index % EXPENSE_CATEGORY_ORDER.length];

    const items: ReceiptItem[] = read.items.map((item, line) => ({
      id: `rci_${index}_${line}`,
      lineNumber: line,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      taxAmount: null,
      totalAmount: item.total_amount,
      category: null,
      confidence: item.confidence,
    }));

    const events: ReceiptEvent[] = [
      {
        id: `rce_${index}_0`,
        action: "uploaded",
        actorName: filedBy.name,
        at: createdAt,
        previousValue: null,
        newValue: { file_name: `recu-${index + 1}.pdf` },
      },
    ];
    if (status !== "draft") {
      events.push({
        id: `rce_${index}_1`,
        action: readable ? "extracted" : "extraction_failed",
        actorName: filedBy.name,
        at: createdAt,
        previousValue: null,
        newValue: { provider: "demo", confidence: String(confidence) },
      });
    }
    if (status === "verified" || status === "archived") {
      events.push({
        id: `rce_${index}_2`,
        action: "verified",
        actorName: owner.name,
        at: createdAt,
        previousValue: { status: "to_verify" },
        newValue: { status: "verified" },
      });
    }

    const id = `rec_${String(index + 1).padStart(3, "0")}`;
    RECEIPT_EVENTS[id] = events.reverse();

    receipts.push({
      id,
      status,
      sourceType: index % 4 === 0 ? "camera" : index % 9 === 3 ? "qr" : "upload",
      uploadedById: filedBy.id,
      uploadedByName: filedBy.name,

      merchantName: read.merchant_name,
      merchantKey,
      merchantAddress: read.merchant_address,
      taxIdentifier: read.tax_identifier,
      receiptNumber: read.receipt_number,
      purchaseDate: read.purchase_date,
      purchaseTime: read.purchase_time,
      currency: "TND",
      subtotal: read.subtotal,
      discount: read.discount,
      taxAmount: read.tax_amount,
      tipAmount: read.tip_amount,
      totalAmount: read.total_amount,
      paymentMethod: read.payment_method,
      cardLastFour: read.card_last_four,
      category,

      qrPayload: index % 9 === 3 ? `FAC-2026-${4000 + index}` : null,
      qrKind: index % 9 === 3 ? "receipt_number" : null,
      verificationUrl: null,

      extractionProvider: status === "draft" ? null : "demo",
      extractionConfidence: status === "draft" ? null : confidence,
      extractionError:
        status === "error"
          ? "Receipt could not be reliably parsed. Le reçu n'a pas pu être lu : la photo est trop floue, trop sombre, ou ne montre pas un reçu."
          : null,
      rejectionReasons:
        status === "error"
          ? [
              {
                code: "unreadable",
                message:
                  "Le reçu n'a pas pu être lu : la photo est trop floue, trop sombre, ou ne montre pas un reçu.",
              },
            ]
          : [],
      missingFields: status === "error" ? ["merchant_name", "total_amount", "purchase_date"] : [],

      fileName: `recu-${index + 1}.pdf`,
      fileMime: "application/pdf",
      fileSize: 1800 + index * 37,

      note: null,
      createdAt,
      processedAt: status === "draft" ? null : createdAt,
      verifiedAt: status === "verified" || status === "archived" ? createdAt : null,
      verifiedByName: status === "verified" || status === "archived" ? owner.name : null,

      items,
      fields: read.fields.map((entry) => ({
        fieldName: entry.field_name,
        rawValue: entry.raw_value,
        normalizedValue: entry.normalized_value,
        confidence: entry.confidence,
        manuallyCorrected: false,
      })),
    });
  }

  return receipts.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export const RECEIPTS: Receipt[] = build();

/** The text the sample preview draws, so the drawing and the figures cannot disagree. */
export function demoReceiptImageText(receiptId: string): string | null {
  const receipt = RECEIPTS.find((entry) => entry.id === receiptId);
  if (!receipt) return null;
  const hash = `demo${Number(receipt.id.slice(4)) - 1}`.padStart(64, "0");
  return demoReceiptText(hash, DEMO_NOW).text;
}
