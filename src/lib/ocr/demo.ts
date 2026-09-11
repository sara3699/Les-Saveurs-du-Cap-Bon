import { makeRng, pick } from "@/lib/mock/rng";
import type { OcrProvider, OcrRequest, OcrResult } from "./types";

/**
 * The reader used when no OCR service is configured, which is the state this project
 * ships in.
 *
 * It invents a receipt. It does not read the file, and it never pretends to: every
 * screen that shows its output carries "Mode démonstration", the receipt records
 * `demo` as its provider, and the document says the same thing in plain words.
 *
 * What it is good for is exercising the real pipeline. The text it produces goes
 * through the same extractor, the same normalisers and the same review screen as a
 * real provider's would, so the parts that are real are genuinely tested by using it.
 *
 * It is deterministic: the same file always produces the same receipt, because the
 * seed is the file's own hash. Re-reading a receipt cannot silently change its figures.
 */

/**
 * Invented suppliers, and invented deliberately.
 *
 * No real company is named here. The tax numbers keep the shape of a Tunisian
 * matricule fiscal so the extractor is exercised properly, but every one of them
 * begins 9999 and no such number is issued, so none can collide with a real business.
 */
const SUPPLIERS: { name: string; address: string; category: string; taxId: string }[] = [
  { name: "Comptoir Exemple, gros", address: "12 rue de l'Exemple, 8000 Nabeul", category: "supplies", taxId: "9999101A/M/000" },
  { name: "Semoulerie Exemple", address: "Route de démonstration km 4, 8000 Nabeul", category: "supplies", taxId: "9999202B/P/000" },
  { name: "Transport Exemple", address: "Avenue de démonstration, 8050 Hammamet", category: "transport", taxId: "9999303C/M/000" },
  { name: "Emballages Exemple", address: "Zone d'exemple, 4000 Sousse", category: "packaging", taxId: "9999404D/M/000" },
  { name: "Énergie Exemple, agence", address: "Place de démonstration, 8000 Nabeul", category: "utilities", taxId: "9999505E/A/000" },
  { name: "Imprimerie Exemple", address: "5 rue de démonstration, 8000 Nabeul", category: "marketing", taxId: "9999606F/M/000" },
];

const ARTICLES: Record<string, { label: string; price: number }[]> = {
  supplies: [
    { label: "Pistaches décortiquées, kg", price: 48 },
    { label: "Amandes entières, kg", price: 32.5 },
    { label: "Semoule fine, sac 25 kg", price: 42 },
    { label: "Miel de romarin, pot 1 kg", price: 38 },
    { label: "Eau de fleur d'oranger, litre", price: 9.5 },
    { label: "Dattes Deglet Nour, kg", price: 14.8 },
  ],
  transport: [
    { label: "Livraison Grand Tunis", price: 7.5 },
    { label: "Livraison Sahel", price: 9 },
    { label: "Forfait carburant", price: 60 },
  ],
  packaging: [
    { label: "Coffrets carton, lot de 50", price: 87.5 },
    { label: "Rubans satin, rouleau", price: 12 },
    { label: "Sachets kraft, lot de 200", price: 36 },
  ],
  utilities: [
    { label: "Consommation électricité", price: 214.6 },
    { label: "Redevance fixe", price: 18 },
  ],
  marketing: [
    { label: "Impression affiches A3", price: 75 },
    { label: "Cartes de visite, 500", price: 55 },
  ],
};

const PAYMENTS = ["Espèces", "Carte bancaire", "Chèque", "Virement"];

function seedFrom(hash: string): number {
  let seed = 0;
  for (let index = 0; index < hash.length; index += 1) {
    seed = (seed * 31 + hash.charCodeAt(index)) >>> 0;
  }
  return seed;
}

function money(value: number): string {
  return value.toFixed(3).replace(".", ",");
}

export function demoReceiptText(fileHash: string, now = new Date()): { text: string; confidence: number } {
  const rng = makeRng(seedFrom(fileHash));
  const supplier = pick(rng, SUPPLIERS);
  const catalogue = ARTICLES[supplier.category] ?? ARTICLES.supplies;

  const daysBack = Math.floor(rng() * 75);
  const when = new Date(now.getTime() - daysBack * 86_400_000);
  const day = String(when.getDate()).padStart(2, "0");
  const month = String(when.getMonth() + 1).padStart(2, "0");
  const hour = String(8 + Math.floor(rng() * 10)).padStart(2, "0");
  const minute = String(Math.floor(rng() * 60)).padStart(2, "0");

  const lineCount = 1 + Math.floor(rng() * Math.min(4, catalogue.length));
  const chosen: { label: string; quantity: number; unit: number; line: number }[] = [];
  const used = new Set<string>();
  while (chosen.length < lineCount) {
    const article = pick(rng, catalogue);
    if (used.has(article.label)) continue;
    used.add(article.label);
    const quantity = 1 + Math.floor(rng() * 4);
    chosen.push({
      label: article.label,
      quantity,
      unit: article.price,
      line: Number((article.price * quantity).toFixed(3)),
    });
  }

  const subtotal = Number(chosen.reduce((sum, item) => sum + item.line, 0).toFixed(3));
  const tax = Number((subtotal * 0.19).toFixed(3));
  const total = Number((subtotal + tax).toFixed(3));
  const payment = pick(rng, PAYMENTS);

  // One receipt in six comes back smudged, so the low-confidence warning and the
  // "Erreur" state are things a person can actually see in the demonstration rather
  // than features described in a document.
  const smudged = rng() < 0.17;

  const body = [
    supplier.name.toUpperCase(),
    supplier.address,
    `Matricule fiscal : ${supplier.taxId}`,
    "--------------------------------",
    `Facture N° ${2400 + Math.floor(rng() * 600)}`,
    `Date : ${day}/${month}/${when.getFullYear()}    ${hour}:${minute}`,
    "--------------------------------",
    ...chosen.map((item) =>
      smudged
        ? `${item.quantity} x ${item.label}   ${money(item.line).replace(/\d/, "?")}`
        : `${item.quantity} x ${item.label}   ${money(item.line)}`,
    ),
    "--------------------------------",
    `SOUS-TOTAL HT        ${money(subtotal)}`,
    `TVA 19%              ${money(tax)}`,
    `TOTAL TTC            ${money(total)}`,
    `Règlement : ${payment}`,
    payment === "Carte bancaire" ? `Carte **** **** **** ${1000 + Math.floor(rng() * 8999)}` : "",
    "--------------------------------",
    "Merci de votre confiance",
    "Données d'exemple, aucun reçu réel n'a été lu",
  ]
    .filter((line) => line !== "")
    .join("\n");

  return { text: body, confidence: smudged ? 0.52 : Number((0.88 + rng() * 0.09).toFixed(3)) };
}

export const demoOcr: OcrProvider = {
  name: "demo",
  demo: true,
  // The demonstration reader never opens the file, so every format it is offered is
  // one it can answer for, HEIC included.
  accepts: () => true,
  async extract(request: OcrRequest): Promise<OcrResult> {
    const { text, confidence } = demoReceiptText(request.fileHash);
    return { provider: "demo", rawText: text, confidence, demo: true };
  },
};
