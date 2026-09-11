import { z } from "zod";
import { EXPENSE_CATEGORY_ORDER } from "@/lib/domain/receipts";

/**
 * What the review screen is allowed to send back.
 *
 * The screen is a browser and a browser can send anything, so this is where a corrected
 * receipt stops being a claim and becomes data. Messages are French because they are
 * printed above the box that was wrong.
 */

const money = z.coerce
  .number()
  .min(0, "Un montant ne peut pas être négatif.")
  .max(10_000_000, "Ce montant est trop grand pour être un reçu.")
  .nullable();

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value === "" ? null : value))
    .nullable();

export const receiptItemInput = z.object({
  description: z.string().trim().min(1, "Chaque ligne a besoin d'une description.").max(300),
  quantity: z.coerce
    .number()
    .gt(0, "La quantité doit être supérieure à zéro.")
    .max(100_000)
    .default(1),
  unit_price: z.coerce.number().min(0).max(10_000_000).default(0),
  tax_amount: money.optional(),
  total_amount: z.coerce.number().min(0).max(10_000_000).default(0),
  category: z.enum(EXPENSE_CATEGORY_ORDER).nullable().optional(),
  confidence: z.coerce.number().min(0).max(1).nullable().optional(),
});

export const receiptReview = z.object({
  merchant_name: optionalText(200),
  merchant_address: optionalText(300),
  tax_identifier: optionalText(40),
  receipt_number: optionalText(60),
  purchase_date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "La date doit être une vraie date.")
    .nullable()
    .or(z.literal("").transform(() => null)),
  purchase_time: z
    .string()
    .trim()
    .regex(/^\d{2}:\d{2}$/, "L'heure doit être écrite 14:35.")
    .nullable()
    .or(z.literal("").transform(() => null)),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, "La devise s'écrit en trois lettres, par exemple TND.")
    .default("TND"),
  subtotal: money,
  discount: money,
  tax_amount: money,
  tip_amount: money,
  total_amount: money,
  payment_method: optionalText(60),
  /**
   * Four digits, never more. A whole card number is refused here rather than trimmed,
   * so nobody can believe it was accepted and stored.
   */
  card_last_four: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "Seuls les 4 derniers chiffres de la carte sont acceptés.")
    .nullable()
    .or(z.literal("").transform(() => null)),
  category: z.enum(EXPENSE_CATEGORY_ORDER).default("other"),
  note: optionalText(2000),
  items: z.array(receiptItemInput).max(200).default([]),
  /** Asking to verify. Refused by the database for anyone but the owner. */
  verify: z.boolean().default(false),
  /** Putting it back in the drawer rather than sending it on. */
  draft: z.boolean().default(false),
});

export type ReceiptReview = z.infer<typeof receiptReview>;
export type ReceiptItemInput = z.infer<typeof receiptItemInput>;

/** What the capture screen sends alongside the file. */
export const captureMeta = z.object({
  source_type: z.enum(["qr", "camera", "upload"]).default("upload"),
  /** The QR string exactly as the browser decoded it. Never trusted, only parsed. */
  qr_payload: z.string().max(8192).optional(),
});

export type CaptureMeta = z.infer<typeof captureMeta>;
