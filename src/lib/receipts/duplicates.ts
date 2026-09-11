import { normalizeMerchant } from "./normalize";

/**
 * Have we seen this receipt already.
 *
 * Only one signal is strong enough to be a rule, and the database enforces it: the same
 * file cannot be filed twice. Everything here is softer than that, and softer signals
 * warn rather than block, because two genuine receipts from the same supplier on the
 * same day for the same amount do happen, and refusing the second one would make this
 * feature actively harmful in a busy shop.
 */

export type DuplicateStrength = "certain" | "likely" | "possible";

export interface DuplicateCandidate {
  id: string;
  strength: DuplicateStrength;
  /** French, printed as it is on the review screen. */
  reason: string;
}

export interface ReceiptFingerprint {
  id: string;
  fileHash: string | null;
  merchantName: string | null;
  receiptNumber: string | null;
  purchaseDate: string | null;
  totalAmount: number | null;
  currency: string | null;
}

function sameNumber(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  const strip = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const left = strip(a);
  return left !== "" && left === strip(b);
}

function sameAmount(a: number | null, b: number | null): boolean {
  if (a === null || b === null) return false;
  return Math.abs(a - b) < 0.001;
}

/**
 * Compares one receipt against the shop's existing ones and returns what it resembles,
 * strongest first. An empty list means nothing looked familiar.
 */
export function findDuplicates(
  candidate: ReceiptFingerprint,
  existing: ReceiptFingerprint[],
): DuplicateCandidate[] {
  const key = normalizeMerchant(candidate.merchantName);
  const found: DuplicateCandidate[] = [];

  for (const other of existing) {
    if (other.id === candidate.id) continue;
    const otherKey = normalizeMerchant(other.merchantName);

    if (candidate.fileHash && other.fileHash && candidate.fileHash === other.fileHash) {
      found.push({
        id: other.id,
        strength: "certain",
        reason: "C'est exactement le même fichier qu'un reçu déjà enregistré.",
      });
      continue;
    }

    if (sameNumber(candidate.receiptNumber, other.receiptNumber) && key && key === otherKey) {
      found.push({
        id: other.id,
        strength: "likely",
        reason: `Même fournisseur et même numéro de reçu (${candidate.receiptNumber}) qu'un reçu déjà enregistré.`,
      });
      continue;
    }

    const sameDay = Boolean(
      candidate.purchaseDate && other.purchaseDate && candidate.purchaseDate === other.purchaseDate,
    );
    const sameMoney =
      sameAmount(candidate.totalAmount, other.totalAmount) &&
      (candidate.currency ?? "TND") === (other.currency ?? "TND");

    if (key && key === otherKey && sameDay && sameMoney) {
      found.push({
        id: other.id,
        strength: "likely",
        reason: "Même fournisseur, même date et même montant qu'un reçu déjà enregistré.",
      });
      continue;
    }

    if (key && key === otherKey && sameMoney) {
      found.push({
        id: other.id,
        strength: "possible",
        reason: "Même fournisseur et même montant qu'un reçu déjà enregistré, à une autre date.",
      });
    }
  }

  const rank: Record<DuplicateStrength, number> = { certain: 0, likely: 1, possible: 2 };
  return found.sort((a, b) => rank[a.strength] - rank[b.strength]).slice(0, 5);
}
