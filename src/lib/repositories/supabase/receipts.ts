import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  ExpenseCategory,
  Receipt,
  ReceiptEvent,
  ReceiptItem,
  ReceiptSourceType,
  ReceiptStatus,
} from "@/lib/domain/receipts";
import type { ReceiptFingerprint } from "@/lib/receipts/duplicates";
import type { ReceiptFilter, ReceiptRepository } from "../types";

/**
 * The demonstration repository is the specification for this file: the same filters,
 * the same ordering, the same empty answers when nothing matches.
 *
 * Nothing below filters by organization_id, and nothing below checks a role. Row level
 * security already decides which receipts this reader may see, and repeating that rule
 * here would be a second, weaker copy of it waiting to drift.
 */

const RECEIPT_COLUMNS =
  "id, status, source_type, uploaded_by, merchant_name, merchant_normalized, merchant_address, tax_identifier, receipt_number, purchase_date, purchase_time, currency, subtotal, discount, tax_amount, tip_amount, total_amount, payment_method, card_last_four, category, qr_payload, qr_kind, verification_url, extraction_provider, extraction_confidence, extraction_error, rejection_reasons, missing_fields, file_name, file_mime, file_size, note, created_at, processed_at, verified_at, verified_by, receipt_items(id, line_number, description, quantity, unit_price, tax_amount, total_amount, category, confidence), receipt_extraction_fields(field_name, raw_value, normalized_value, confidence, manually_corrected)";

/** A shop files a few thousand receipts a year at most, and the totals add every one. */
const MAX_RECEIPTS = 5_000;

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

interface ItemRow {
  id: string;
  line_number: number | null;
  description: string | null;
  quantity: number | string | null;
  unit_price: number | string | null;
  tax_amount: number | string | null;
  total_amount: number | string | null;
  category: string | null;
  confidence: number | string | null;
}

interface FieldRow {
  field_name: string;
  raw_value: string | null;
  normalized_value: string | null;
  confidence: number | string | null;
  manually_corrected: boolean;
}

interface ReceiptRow {
  id: string;
  status: string;
  source_type: string;
  uploaded_by: string | null;
  merchant_name: string | null;
  merchant_normalized: string | null;
  merchant_address: string | null;
  tax_identifier: string | null;
  receipt_number: string | null;
  purchase_date: string | null;
  purchase_time: string | null;
  currency: string | null;
  subtotal: number | string | null;
  discount: number | string | null;
  tax_amount: number | string | null;
  tip_amount: number | string | null;
  total_amount: number | string | null;
  payment_method: string | null;
  card_last_four: string | null;
  category: string | null;
  qr_payload: string | null;
  qr_kind: string | null;
  verification_url: string | null;
  extraction_provider: string | null;
  extraction_confidence: number | string | null;
  extraction_error: string | null;
  rejection_reasons: { code?: string; message?: string }[] | null;
  missing_fields: string[] | null;
  file_name: string | null;
  file_mime: string | null;
  file_size: number | null;
  note: string | null;
  created_at: string;
  processed_at: string | null;
  verified_at: string | null;
  verified_by: string | null;
  receipt_items: ItemRow[] | null;
  receipt_extraction_fields: FieldRow[] | null;
}

function toItem(row: ItemRow): ReceiptItem {
  return {
    id: row.id,
    lineNumber: row.line_number ?? 0,
    description: row.description ?? "Article",
    quantity: toNumber(row.quantity) ?? 1,
    unitPrice: toNumber(row.unit_price) ?? 0,
    taxAmount: toNumber(row.tax_amount),
    totalAmount: toNumber(row.total_amount) ?? 0,
    category: (row.category as ExpenseCategory | null) ?? null,
    confidence: toNumber(row.confidence),
  };
}

function toReceipt(row: ReceiptRow, names: Map<string, string>): Receipt {
  return {
    id: row.id,
    status: row.status as ReceiptStatus,
    sourceType: row.source_type as ReceiptSourceType,
    uploadedById: row.uploaded_by,
    uploadedByName: row.uploaded_by ? names.get(row.uploaded_by) ?? null : null,

    merchantName: row.merchant_name,
    merchantKey: row.merchant_normalized,
    merchantAddress: row.merchant_address,
    taxIdentifier: row.tax_identifier,
    receiptNumber: row.receipt_number,
    purchaseDate: row.purchase_date,
    // Postgres hands back 14:35:00; the screens show hours and minutes.
    purchaseTime: row.purchase_time ? row.purchase_time.slice(0, 5) : null,
    currency: row.currency ?? "TND",
    subtotal: toNumber(row.subtotal),
    discount: toNumber(row.discount),
    taxAmount: toNumber(row.tax_amount),
    tipAmount: toNumber(row.tip_amount),
    totalAmount: toNumber(row.total_amount),
    paymentMethod: row.payment_method,
    cardLastFour: row.card_last_four,
    category: (row.category as ExpenseCategory | null) ?? "other",

    qrPayload: row.qr_payload,
    qrKind: row.qr_kind,
    verificationUrl: row.verification_url,

    extractionProvider: row.extraction_provider,
    extractionConfidence: toNumber(row.extraction_confidence),
    extractionError: row.extraction_error,
    rejectionReasons: (row.rejection_reasons ?? [])
      .filter((reason) => typeof reason?.message === "string")
      .map((reason) => ({ code: reason.code ?? "unknown", message: reason.message as string })),
    missingFields: row.missing_fields ?? [],

    fileName: row.file_name,
    fileMime: row.file_mime ?? "application/octet-stream",
    fileSize: row.file_size ?? 0,

    note: row.note,
    createdAt: row.created_at,
    processedAt: row.processed_at,
    verifiedAt: row.verified_at,
    verifiedByName: row.verified_by ? names.get(row.verified_by) ?? null : null,

    items: (row.receipt_items ?? []).slice().sort((a, b) => (a.line_number ?? 0) - (b.line_number ?? 0)).map(toItem),
    fields: (row.receipt_extraction_fields ?? []).map((field) => ({
      fieldName: field.field_name,
      rawValue: field.raw_value,
      normalizedValue: field.normalized_value,
      confidence: toNumber(field.confidence),
      manuallyCorrected: field.manually_corrected,
    })),
  };
}

/** Who filed it and who confirmed it, looked up once rather than per receipt. */
async function memberNames(client: SupabaseClient): Promise<Map<string, string>> {
  const { data } = await client.from("organization_members").select("id, display_name");
  const names = new Map<string, string>();
  for (const row of (data ?? []) as { id: string; display_name: string }[]) {
    names.set(row.id, row.display_name);
  }
  return names;
}

export function supabaseReceipts(client: SupabaseClient): ReceiptRepository {
  return {
    async list(filter: ReceiptFilter = {}) {
      let query = client
        .from("receipts")
        .select(RECEIPT_COLUMNS)
        .order("purchase_date", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(MAX_RECEIPTS);

      if (filter.statuses?.length) query = query.in("status", filter.statuses);
      if (filter.categories?.length) query = query.in("category", filter.categories);
      if (filter.merchantKey) query = query.eq("merchant_normalized", filter.merchantKey);
      if (filter.uploadedById) query = query.eq("uploaded_by", filter.uploadedById);
      if (filter.from) query = query.gte("purchase_date", filter.from);
      if (filter.to) query = query.lte("purchase_date", filter.to);
      if (filter.search) {
        // Escaped, because a comma or a bracket in the box would otherwise be read as
        // more filter syntax rather than as something to search for.
        const needle = filter.search.replace(/[%,()\\]/g, " ").trim();
        if (needle !== "") {
          query = query.or(
            `merchant_name.ilike.%${needle}%,receipt_number.ilike.%${needle}%,note.ilike.%${needle}%`,
          );
        }
      }

      const [{ data, error }, names] = await Promise.all([query, memberNames(client)]);
      if (error) throw new Error(`Receipts could not be read: ${error.message}`);
      return ((data ?? []) as unknown as ReceiptRow[]).map((row) => toReceipt(row, names));
    },

    async byId(id: string) {
      const [{ data, error }, names] = await Promise.all([
        client.from("receipts").select(RECEIPT_COLUMNS).eq("id", id).maybeSingle(),
        memberNames(client),
      ]);
      if (error) throw new Error(`That receipt could not be read: ${error.message}`);
      return data ? toReceipt(data as unknown as ReceiptRow, names) : null;
    },

    async fingerprints() {
      const { data, error } = await client
        .from("receipts")
        .select("id, file_hash, merchant_name, receipt_number, purchase_date, total_amount, currency")
        .neq("status", "archived")
        .limit(MAX_RECEIPTS);
      if (error) throw new Error(`Receipts could not be compared: ${error.message}`);
      return ((data ?? []) as Record<string, unknown>[]).map(
        (row): ReceiptFingerprint => ({
          id: row.id as string,
          fileHash: (row.file_hash as string | null) ?? null,
          merchantName: (row.merchant_name as string | null) ?? null,
          receiptNumber: (row.receipt_number as string | null) ?? null,
          purchaseDate: (row.purchase_date as string | null) ?? null,
          totalAmount: toNumber(row.total_amount),
          currency: (row.currency as string | null) ?? null,
        }),
      );
    },

    async events(receiptId: string) {
      const [{ data, error }, names] = await Promise.all([
        client
          .from("receipt_events")
          .select("id, action, actor_member_id, previous_value, new_value, created_at")
          .eq("receipt_id", receiptId)
          .order("created_at", { ascending: false })
          .limit(100),
        memberNames(client),
      ]);
      if (error) throw new Error(`That receipt's history could not be read: ${error.message}`);
      return ((data ?? []) as Record<string, unknown>[]).map(
        (row): ReceiptEvent => ({
          id: row.id as string,
          action: row.action as string,
          actorName: row.actor_member_id ? names.get(row.actor_member_id as string) ?? null : null,
          at: row.created_at as string,
          previousValue: (row.previous_value as Record<string, unknown> | null) ?? null,
          newValue: (row.new_value as Record<string, unknown> | null) ?? null,
        }),
      );
    },
  };
}
