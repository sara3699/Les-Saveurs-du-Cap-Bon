/**
 * The vocabulary of money going out.
 *
 * Orders carry a source that can never be rewritten. Receipts carry the same idea one
 * step further: every field also carries how sure the reader was about it, and a
 * receipt does not count towards any total until a person has confirmed it. A number
 * a machine guessed and a number a person typed must never look alike on the screen.
 *
 * Values here are the database's, in English. Labels are French, because the shop is.
 */

export type ReceiptStatus = "draft" | "to_verify" | "verified" | "error" | "archived";

/** How the receipt got here. Not the same thing as its status. */
export type ReceiptSourceType = "qr" | "camera" | "upload";

export type ExpenseCategory =
  | "supplies"
  | "transport"
  | "packaging"
  | "marketing"
  | "rent"
  | "utilities"
  | "taxes"
  | "fees"
  | "other";

/** The fields the reader is asked to find, and the review screen lets a person fix. */
export type ReceiptFieldName =
  | "merchant_name"
  | "merchant_address"
  | "tax_identifier"
  | "receipt_number"
  | "purchase_date"
  | "purchase_time"
  | "currency"
  | "subtotal"
  | "discount"
  | "tax_amount"
  | "tip_amount"
  | "total_amount"
  | "payment_method"
  | "card_last_four";

export interface ReceiptItem {
  id: string;
  lineNumber: number;
  description: string;
  quantity: number;
  unitPrice: number;
  taxAmount: number | null;
  totalAmount: number;
  category: ExpenseCategory | null;
  /** Null when a person typed this line rather than a reader finding it. */
  confidence: number | null;
}

export interface ReceiptField {
  fieldName: string;
  rawValue: string | null;
  normalizedValue: string | null;
  confidence: number | null;
  /** True once a person has changed it, and it stays true afterwards. */
  manuallyCorrected: boolean;
}

/** Why a reading was refused. Our own sentences, never text read off the receipt. */
export interface ReceiptRejection {
  code: string;
  message: string;
}

export interface ReceiptEvent {
  id: string;
  action: string;
  actorName: string | null;
  at: string;
  previousValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
}

export interface Receipt {
  id: string;
  status: ReceiptStatus;
  sourceType: ReceiptSourceType;
  uploadedById: string | null;
  uploadedByName: string | null;

  merchantName: string | null;
  /** The key two spellings of one supplier collapse onto. Computed by the database. */
  merchantKey: string | null;
  merchantAddress: string | null;
  taxIdentifier: string | null;
  receiptNumber: string | null;
  purchaseDate: string | null;
  purchaseTime: string | null;
  currency: string;
  subtotal: number | null;
  discount: number | null;
  taxAmount: number | null;
  tipAmount: number | null;
  totalAmount: number | null;
  paymentMethod: string | null;
  /** Four digits at most. A whole card number is never stored anywhere. */
  cardLastFour: string | null;
  category: ExpenseCategory;

  /** Exactly what the QR code said, never interpreted for display. */
  qrPayload: string | null;
  qrKind: string | null;
  /** Kept so a person can decide. Nothing in this product opens it. */
  verificationUrl: string | null;

  extractionProvider: string | null;
  extractionConfidence: number | null;
  extractionError: string | null;
  /** Empty unless the reading was refused. A refused receipt keeps everything it read. */
  rejectionReasons: ReceiptRejection[];
  /** The required fields that were not found, so the screen can point at them. */
  missingFields: string[];

  fileName: string | null;
  fileMime: string;
  fileSize: number;

  note: string | null;
  createdAt: string;
  processedAt: string | null;
  verifiedAt: string | null;
  verifiedByName: string | null;

  items: ReceiptItem[];
  fields: ReceiptField[];
}

export const RECEIPT_STATUS_ORDER: ReceiptStatus[] = [
  "draft",
  "to_verify",
  "verified",
  "error",
  "archived",
];

type Tone = "success" | "danger" | "accent" | "muted" | "primary";

export const RECEIPT_STATUS_COPY: Record<ReceiptStatus, { label: string; tone: Tone; hint: string }> =
  {
    draft: {
      label: "Brouillon",
      tone: "muted",
      hint: "Déposé, pas encore lu.",
    },
    to_verify: {
      label: "À vérifier",
      tone: "accent",
      hint: "Lu par la machine. Personne ne l'a encore confirmé, donc il ne compte pas.",
    },
    verified: {
      label: "Vérifié",
      tone: "success",
      hint: "Confirmé par la propriétaire. Compte dans les totaux.",
    },
    error: {
      label: "Erreur",
      tone: "danger",
      hint: "La lecture a échoué. Vous pouvez relancer ou tout saisir à la main.",
    },
    archived: {
      label: "Archivé",
      tone: "muted",
      hint: "Mis de côté. Ne compte plus dans les totaux.",
    },
  };

export const EXPENSE_CATEGORY_ORDER: ExpenseCategory[] = [
  "supplies",
  "transport",
  "packaging",
  "marketing",
  "rent",
  "utilities",
  "taxes",
  "fees",
  "other",
];

export const EXPENSE_CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  supplies: "Fournitures et marchandises",
  transport: "Transport et livraison",
  packaging: "Emballage",
  marketing: "Publicité et marketing",
  rent: "Loyer",
  utilities: "Eau, électricité, téléphone",
  taxes: "Taxes et impôts",
  fees: "Frais bancaires et commissions",
  other: "Autre",
};

/** The short form, for a table column that cannot take a sentence. */
export const EXPENSE_CATEGORY_SHORT: Record<ExpenseCategory, string> = {
  supplies: "Fournitures",
  transport: "Transport",
  packaging: "Emballage",
  marketing: "Marketing",
  rent: "Loyer",
  utilities: "Énergie",
  taxes: "Taxes",
  fees: "Frais",
  other: "Autre",
};

export const RECEIPT_SOURCE_LABEL: Record<ReceiptSourceType, string> = {
  qr: "Code QR scanné",
  camera: "Photographié",
  upload: "Fichier déposé",
};

/** What each field is called above its box on the review screen. */
export const RECEIPT_FIELD_LABEL: Record<ReceiptFieldName, string> = {
  merchant_name: "Fournisseur",
  merchant_address: "Adresse du fournisseur",
  tax_identifier: "Matricule fiscal",
  receipt_number: "Numéro du reçu",
  purchase_date: "Date d'achat",
  purchase_time: "Heure",
  currency: "Devise",
  subtotal: "Sous-total",
  discount: "Remise",
  tax_amount: "TVA",
  tip_amount: "Pourboire",
  total_amount: "Total",
  payment_method: "Moyen de paiement",
  card_last_four: "4 derniers chiffres de la carte",
};

/**
 * Below this, the field is shown as needing a human eye. It is not a threshold the
 * machine acts on: nothing is ever refused for low confidence, it is only pointed at.
 */
export const LOW_CONFIDENCE = 0.7;

export function confidenceLabel(confidence: number | null): string {
  if (confidence === null) return "Saisi à la main";
  if (confidence >= 0.9) return "Lecture sûre";
  if (confidence >= LOW_CONFIDENCE) return "Lecture probable";
  return "Lecture incertaine, à relire";
}

/** Only a verified receipt counts. Everything on the expenses screen leans on this. */
export function countsTowardsTotals(receipt: { status: ReceiptStatus }): boolean {
  return receipt.status === "verified";
}
