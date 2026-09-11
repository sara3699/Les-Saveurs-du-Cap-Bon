"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { archiveReceipt, reprocessReceipt, saveReceipt } from "@/app/(app)/receipts/actions";
import type { ReceiptActionResult } from "@/app/(app)/receipts/actions";
import { ConfidenceMark, DemoReaderNotice, ReceiptStatusPill } from "./badges";
import {
  EXPENSE_CATEGORY_LABEL,
  EXPENSE_CATEGORY_ORDER,
  LOW_CONFIDENCE,
  RECEIPT_FIELD_LABEL,
  type ExpenseCategory,
  type Receipt,
  type ReceiptFieldName,
} from "@/lib/domain/receipts";
import type { DuplicateCandidate } from "@/lib/receipts/duplicates";
import { checkItems, checkTotals } from "@/lib/receipts/totals";
import { formatTND } from "@/lib/format";

/**
 * Where a machine's guess becomes a shop's record, or does not.
 *
 * Nothing on this screen is saved as an expense until somebody presses the button, and
 * only the owner's press turns it into a figure that counts. Every field shows how sure
 * the reader was, an unsure one is marked, and a field the reader missed is an empty
 * box with a note beside it rather than a plausible number nobody checked.
 *
 * The arithmetic warns and never blocks. Real receipts round, and a shopkeeper holding
 * a piece of paper is a better authority on what it says than this is.
 */

export interface ReceiptReviewProps {
  receipt: Receipt;
  duplicates: DuplicateCandidate[];
  canWrite: boolean;
  canVerify: boolean;
  demoReader: boolean;
  qrReason: string | null;
}

interface ItemRow {
  key: number;
  description: string;
  quantity: string;
  unitPrice: string;
  totalAmount: string;
  confidence: number | null;
}

const FIELD =
  "w-full min-w-0 rounded-[var(--radius-sm)] border border-line bg-surface-2 px-2.5 py-2 text-[13px]";
const PRIMARY =
  "rounded-[var(--radius-md)] bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hi disabled:opacity-50";
const SECONDARY =
  "rounded-[var(--radius-md)] border border-line-strong bg-surface px-4 py-2.5 text-sm font-semibold hover:bg-surface-2 disabled:opacity-50";

let rowSeq = 0;
function emptyRow(): ItemRow {
  rowSeq += 1;
  return { key: rowSeq, description: "", quantity: "1", unitPrice: "", totalAmount: "", confidence: null };
}

function toNumber(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const parsed = Number(trimmed.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function text(value: number | null): string {
  return value === null ? "" : String(value);
}

/**
 * Declared out here rather than inside the form. A component defined during a render is
 * a new component on every keystroke, and React throws away everything inside it.
 */
function Mark({ found }: { found: { confidence: number | null; corrected: boolean } | null }) {
  if (!found) return <span className="text-[11px] text-faint">Non trouvé, à saisir</span>;
  return <ConfidenceMark confidence={found.confidence} corrected={found.corrected} />;
}

function Field({
  field,
  mark,
  children,
}: {
  field: ReceiptFieldName;
  mark: { confidence: number | null; corrected: boolean } | null;
  children: React.ReactNode;
}) {
  const caption = RECEIPT_FIELD_LABEL[field];
  return (
    <div className="flex flex-col gap-1">
      {/*
        The reading note sits outside the label on purpose. Inside it, "Lu · 78 %" would
        be read out as part of the control's name, and the field would no longer be
        called what is printed above it.
      */}
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span aria-hidden className="os-label text-xs font-semibold text-muted">
          {caption}
        </span>
        <Mark found={mark} />
      </div>
      <label className="contents">
        <span className="sr-only">{caption}</span>
        {children}
      </label>
    </div>
  );
}

export function ReceiptReviewForm({
  receipt,
  duplicates,
  canWrite,
  canVerify,
  demoReader,
  qrReason,
}: ReceiptReviewProps) {
  const [merchantName, setMerchantName] = useState(receipt.merchantName ?? "");
  const [merchantAddress, setMerchantAddress] = useState(receipt.merchantAddress ?? "");
  const [taxIdentifier, setTaxIdentifier] = useState(receipt.taxIdentifier ?? "");
  const [receiptNumber, setReceiptNumber] = useState(receipt.receiptNumber ?? "");
  const [purchaseDate, setPurchaseDate] = useState(receipt.purchaseDate ?? "");
  const [purchaseTime, setPurchaseTime] = useState(receipt.purchaseTime ?? "");
  const [currency, setCurrency] = useState(receipt.currency || "TND");
  const [subtotal, setSubtotal] = useState(text(receipt.subtotal));
  const [discount, setDiscount] = useState(text(receipt.discount));
  const [taxAmount, setTaxAmount] = useState(text(receipt.taxAmount));
  const [tipAmount, setTipAmount] = useState(text(receipt.tipAmount));
  const [totalAmount, setTotalAmount] = useState(text(receipt.totalAmount));
  const [paymentMethod, setPaymentMethod] = useState(receipt.paymentMethod ?? "");
  const [cardLastFour, setCardLastFour] = useState(receipt.cardLastFour ?? "");
  const [category, setCategory] = useState<ExpenseCategory>(receipt.category);
  const [note, setNote] = useState(receipt.note ?? "");
  const [items, setItems] = useState<ItemRow[]>(() =>
    receipt.items.length === 0
      ? [emptyRow()]
      : receipt.items.map((item) => {
          rowSeq += 1;
          return {
            key: rowSeq,
            description: item.description,
            quantity: String(item.quantity),
            unitPrice: String(item.unitPrice),
            totalAmount: String(item.totalAmount),
            confidence: item.confidence,
          };
        }),
  );

  const [result, act, pending] = useActionState<ReceiptActionResult | null, FormData>(
    saveReceipt,
    null,
  );
  const [archiveResult, archive, archiving] = useActionState<ReceiptActionResult | null, FormData>(
    archiveReceipt,
    null,
  );
  const [readAgainResult, readAgain, rereading] = useActionState<ReceiptActionResult | null, FormData>(
    reprocessReceipt,
    null,
  );

  const confidenceOf = useMemo(() => {
    const map = new Map<string, { confidence: number | null; corrected: boolean }>();
    for (const field of receipt.fields) {
      map.set(field.fieldName, {
        confidence: field.confidence,
        corrected: field.manuallyCorrected,
      });
    }
    return map;
  }, [receipt.fields]);

  const filledItems = items
    .filter((row) => row.description.trim() !== "")
    .map((row) => ({
      description: row.description.trim(),
      quantity: toNumber(row.quantity) ?? 1,
      unit_price: toNumber(row.unitPrice) ?? 0,
      total_amount: toNumber(row.totalAmount) ?? (toNumber(row.quantity) ?? 1) * (toNumber(row.unitPrice) ?? 0),
      confidence: row.confidence,
    }));

  const totals = checkTotals({
    subtotal: toNumber(subtotal),
    discount: toNumber(discount),
    taxAmount: toNumber(taxAmount),
    tipAmount: toNumber(tipAmount),
    totalAmount: toNumber(totalAmount),
  });
  const itemsCheck = checkItems(
    filledItems.map((item) => ({ totalAmount: item.total_amount })),
    { subtotal: toNumber(subtotal), totalAmount: toNumber(totalAmount) },
  );

  /**
   * Which button was pressed travels as the button's own value, the way a form has
   * always done it, rather than by reaching into the DOM behind React's back.
   */
  const payload = () =>
    JSON.stringify({
      merchant_name: merchantName,
      merchant_address: merchantAddress,
      tax_identifier: taxIdentifier,
      receipt_number: receiptNumber,
      purchase_date: purchaseDate,
      purchase_time: purchaseTime,
      currency,
      subtotal,
      discount,
      tax_amount: taxAmount,
      tip_amount: tipAmount,
      total_amount: totalAmount,
      payment_method: paymentMethod,
      card_last_four: cardLastFour,
      category,
      note,
      items: filledItems,
    });

  const locked = !canWrite || receipt.status === "archived";
  const busy = pending || archiving || rereading;

  const missing = new Set(receipt.missingFields);

  const lowFor = (field: ReceiptFieldName, value: string) => {
    const found = confidenceOf.get(field);
    const unsure = found ? found.confidence !== null && found.confidence < LOW_CONFIDENCE : true;
    // A field the verdict named is marked in red rather than amber: it is not an unsure
    // reading, it is one of the reasons this receipt was refused.
    if (missing.has(field) && value.trim() === "") return "border-danger ring-1 ring-danger/30";
    return value.trim() === "" || unsure ? "border-accent ring-1 ring-accent/30" : "";
  };

  const markFor = (field: ReceiptFieldName) => confidenceOf.get(field) ?? null;

  return (
    <div className="flex flex-col gap-4">
      {demoReader ? <DemoReaderNotice /> : null}

      {receipt.rejectionReasons.length > 0 ? (
        <div className="rounded-[var(--radius-md)] border border-danger/25 bg-danger-soft px-3 py-3">
          <p className="text-sm font-semibold text-danger">
            {receipt.rejectionReasons.length === 1
              ? "Ce reçu n'a pas pu être lu de façon fiable"
              : `Ce reçu n'a pas pu être lu de façon fiable, pour ${receipt.rejectionReasons.length} raisons`}
          </p>
          <ul className="mt-1 list-inside list-disc text-sm text-danger">
            {receipt.rejectionReasons.map((reason) => (
              <li key={reason.code}>{reason.message}</li>
            ))}
          </ul>
          {receipt.missingFields.length > 0 ? (
            <p className="mt-2 text-sm text-danger">
              À compléter :{" "}
              <span className="font-semibold">
                {receipt.missingFields
                  .map((field) => RECEIPT_FIELD_LABEL[field as ReceiptFieldName] ?? field)
                  .join(", ")}
              </span>
            </p>
          ) : null}
          <p className="mt-2 text-xs text-danger">
            Rien n&apos;a été perdu : le fichier et tout ce qui a été lu sont conservés. Complétez
            ce qui manque ci-dessous, ou relancez la lecture.
          </p>
        </div>
      ) : receipt.extractionError ? (
        <div className="rounded-[var(--radius-md)] border border-danger/25 bg-danger-soft px-3 py-2">
          <p className="text-sm font-semibold text-danger">La lecture a échoué</p>
          <p className="mt-0.5 text-sm text-danger">{receipt.extractionError}</p>
        </div>
      ) : null}

      {qrReason ? (
        <p className="rounded-[var(--radius-md)] border border-accent-line bg-accent-soft px-3 py-2 text-xs font-semibold text-accent-ink">
          {qrReason}
        </p>
      ) : null}

      {duplicates.length > 0 ? (
        <div className="rounded-[var(--radius-md)] border border-accent-line bg-accent-soft px-3 py-2">
          <p className="text-sm font-semibold text-accent-ink">
            Ce reçu ressemble à {duplicates.length === 1 ? "un reçu déjà" : `${duplicates.length} reçus déjà`} enregistré
            {duplicates.length === 1 ? "" : "s"}
          </p>
          <ul className="mt-1 flex flex-col gap-1">
            {duplicates.map((duplicate) => (
              <li key={duplicate.id} className="text-sm text-accent-ink">
                {duplicate.reason}{" "}
                <Link href={`/receipts/${duplicate.id}`} className="font-semibold underline">
                  L&apos;ouvrir
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-1 text-xs text-accent-ink">
            Rien n&apos;est bloqué. Vérifiez, puis enregistrez si ce sont bien deux achats
            différents.
          </p>
        </div>
      ) : null}

      {!totals.balanced ? (
        <p className="rounded-[var(--radius-md)] border border-accent-line bg-accent-soft px-3 py-2 text-sm font-semibold text-accent-ink">
          {totals.message}
        </p>
      ) : null}
      {!itemsCheck.matches ? (
        <p className="rounded-[var(--radius-md)] border border-accent-line bg-accent-soft px-3 py-2 text-sm text-accent-ink">
          {itemsCheck.message}
        </p>
      ) : null}

      <form action={act} className="flex flex-col gap-4">
        <input type="hidden" name="receipt_id" value={receipt.id} />
        <input type="hidden" name="payload" value={payload()} />

        <section className="os-card p-4 sm:p-5">
          <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[15px]">Le fournisseur</h2>
            <ReceiptStatusPill status={receipt.status} />
          </header>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field field="merchant_name" mark={markFor("merchant_name")}>
              <input
                className={`${FIELD} ${lowFor("merchant_name", merchantName)}`}
                value={merchantName}
                onChange={(event) => setMerchantName(event.target.value)}
                disabled={locked}
                maxLength={200}
              />
            </Field>
            <Field field="tax_identifier" mark={markFor("tax_identifier")}>
              <input
                className={`${FIELD} ${lowFor("tax_identifier", taxIdentifier)}`}
                value={taxIdentifier}
                onChange={(event) => setTaxIdentifier(event.target.value)}
                disabled={locked}
                maxLength={40}
              />
            </Field>
            <Field field="merchant_address" mark={markFor("merchant_address")}>
              <input
                className={FIELD}
                value={merchantAddress}
                onChange={(event) => setMerchantAddress(event.target.value)}
                disabled={locked}
                maxLength={300}
              />
            </Field>
            <label className="flex flex-col gap-1">
              <span className="os-label text-xs font-semibold text-muted">Catégorie de dépense</span>
              <select
                className={FIELD}
                value={category}
                onChange={(event) => setCategory(event.target.value as ExpenseCategory)}
                disabled={locked}
              >
                {EXPENSE_CATEGORY_ORDER.map((value) => (
                  <option key={value} value={value}>
                    {EXPENSE_CATEGORY_LABEL[value]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="os-card p-4 sm:p-5">
          <h2 className="mb-4 text-[15px]">Le reçu</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field field="receipt_number" mark={markFor("receipt_number")}>
              <input
                className={`${FIELD} ${lowFor("receipt_number", receiptNumber)}`}
                value={receiptNumber}
                onChange={(event) => setReceiptNumber(event.target.value)}
                disabled={locked}
                maxLength={60}
              />
            </Field>
            <Field field="purchase_date" mark={markFor("purchase_date")}>
              <input
                type="date"
                className={`${FIELD} ${lowFor("purchase_date", purchaseDate)}`}
                value={purchaseDate}
                onChange={(event) => setPurchaseDate(event.target.value)}
                disabled={locked}
              />
            </Field>
            <Field field="purchase_time" mark={markFor("purchase_time")}>
              <input
                type="time"
                className={FIELD}
                value={purchaseTime}
                onChange={(event) => setPurchaseTime(event.target.value)}
                disabled={locked}
              />
            </Field>
            <Field field="currency" mark={markFor("currency")}>
              <input
                className={FIELD}
                value={currency}
                onChange={(event) => setCurrency(event.target.value.toUpperCase())}
                disabled={locked}
                maxLength={3}
              />
            </Field>
          </div>
        </section>

        <section className="os-card p-4 sm:p-5">
          <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[15px]">Les articles</h2>
            <button
              type="button"
              className={SECONDARY}
              disabled={locked}
              onClick={() => setItems((rows) => [...rows, emptyRow()])}
            >
              Ajouter une ligne
            </button>
          </header>

          <div className="os-scroll overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted">
                  <th className="pb-2 font-semibold">Description</th>
                  <th className="pb-2 font-semibold">Quantité</th>
                  <th className="pb-2 font-semibold">Prix unitaire</th>
                  <th className="pb-2 font-semibold">Total</th>
                  <th className="pb-2 font-semibold">Lecture</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {items.map((row, index) => (
                  <tr key={row.key} className="border-b border-line/60">
                    <td className="py-2 pr-2">
                      <input
                        aria-label={`Description de l'article ${index + 1}`}
                        className={FIELD}
                        value={row.description}
                        onChange={(event) =>
                          setItems((rows) =>
                            rows.map((entry) =>
                              entry.key === row.key
                                ? { ...entry, description: event.target.value }
                                : entry,
                            ),
                          )
                        }
                        disabled={locked}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        aria-label={`Quantité de l'article ${index + 1}`}
                        inputMode="decimal"
                        className={`${FIELD} max-w-[90px]`}
                        value={row.quantity}
                        onChange={(event) =>
                          setItems((rows) =>
                            rows.map((entry) =>
                              entry.key === row.key ? { ...entry, quantity: event.target.value } : entry,
                            ),
                          )
                        }
                        disabled={locked}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        aria-label={`Prix unitaire de l'article ${index + 1}`}
                        inputMode="decimal"
                        className={`${FIELD} max-w-[120px]`}
                        value={row.unitPrice}
                        onChange={(event) =>
                          setItems((rows) =>
                            rows.map((entry) =>
                              entry.key === row.key ? { ...entry, unitPrice: event.target.value } : entry,
                            ),
                          )
                        }
                        disabled={locked}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        aria-label={`Total de l'article ${index + 1}`}
                        inputMode="decimal"
                        className={`${FIELD} max-w-[120px]`}
                        value={row.totalAmount}
                        onChange={(event) =>
                          setItems((rows) =>
                            rows.map((entry) =>
                              entry.key === row.key
                                ? { ...entry, totalAmount: event.target.value }
                                : entry,
                            ),
                          )
                        }
                        disabled={locked}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <ConfidenceMark confidence={row.confidence} />
                    </td>
                    <td className="py-2 text-right">
                      <button
                        type="button"
                        aria-label={`Supprimer l'article ${index + 1}`}
                        className="rounded-[var(--radius-sm)] border border-line px-2 py-1 text-xs font-semibold text-muted hover:text-danger disabled:opacity-50"
                        disabled={locked}
                        onClick={() =>
                          setItems((rows) =>
                            rows.length === 1 ? [emptyRow()] : rows.filter((entry) => entry.key !== row.key),
                          )
                        }
                      >
                        Retirer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-xs text-muted">
            Les articles font {formatTND(itemsCheck.itemsTotal)}.
          </p>
        </section>

        <section className="os-card p-4 sm:p-5">
          <h2 className="mb-4 text-[15px]">Les montants</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field field="subtotal" mark={markFor("subtotal")}>
              <input
                inputMode="decimal"
                className={`${FIELD} ${lowFor("subtotal", subtotal)}`}
                value={subtotal}
                onChange={(event) => setSubtotal(event.target.value)}
                disabled={locked}
              />
            </Field>
            <Field field="discount" mark={markFor("discount")}>
              <input
                inputMode="decimal"
                className={FIELD}
                value={discount}
                onChange={(event) => setDiscount(event.target.value)}
                disabled={locked}
              />
            </Field>
            <Field field="tax_amount" mark={markFor("tax_amount")}>
              <input
                inputMode="decimal"
                className={`${FIELD} ${lowFor("tax_amount", taxAmount)}`}
                value={taxAmount}
                onChange={(event) => setTaxAmount(event.target.value)}
                disabled={locked}
              />
            </Field>
            <Field field="tip_amount" mark={markFor("tip_amount")}>
              <input
                inputMode="decimal"
                className={FIELD}
                value={tipAmount}
                onChange={(event) => setTipAmount(event.target.value)}
                disabled={locked}
              />
            </Field>
            <Field field="total_amount" mark={markFor("total_amount")}>
              <input
                inputMode="decimal"
                className={`${FIELD} ${lowFor("total_amount", totalAmount)}`}
                value={totalAmount}
                onChange={(event) => setTotalAmount(event.target.value)}
                disabled={locked}
              />
            </Field>
            <Field field="payment_method" mark={markFor("payment_method")}>
              <input
                className={FIELD}
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
                disabled={locked}
                maxLength={60}
              />
            </Field>
            <Field field="card_last_four" mark={markFor("card_last_four")}>
              <input
                inputMode="numeric"
                className={FIELD}
                value={cardLastFour}
                onChange={(event) => setCardLastFour(event.target.value.replace(/\D/g, "").slice(0, 4))}
                disabled={locked}
                maxLength={4}
                placeholder="4 chiffres"
              />
            </Field>
          </div>
          <p className="mt-2 text-xs text-muted">
            Le numéro complet d&apos;une carte n&apos;est jamais enregistré, seulement les quatre
            derniers chiffres.
          </p>

          <label className="mt-4 flex flex-col gap-1">
            <span className="os-label text-xs font-semibold text-muted">Note interne</span>
            <textarea
              className={`${FIELD} min-h-[72px]`}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              disabled={locked}
              maxLength={2000}
            />
          </label>
        </section>

        {result?.error ? (
          <div className="rounded-[var(--radius-md)] border border-danger/25 bg-danger-soft px-3 py-2">
            <p className="text-sm font-semibold text-danger">{result.error}</p>
            {result.fields?.length ? (
              <ul className="mt-1 list-inside list-disc text-sm text-danger">
                {result.fields.map((entry) => (
                  <li key={entry.champ}>
                    {RECEIPT_FIELD_LABEL[entry.champ as ReceiptFieldName] ?? entry.champ} :{" "}
                    {entry.probleme}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
        {result?.ok ? (
          <p className="rounded-[var(--radius-md)] border border-success/20 bg-success-soft px-3 py-2 text-sm font-semibold text-success">
            {result.status === "verified"
              ? "Reçu vérifié. Il compte maintenant dans les dépenses."
              : result.status === "draft"
                ? "Brouillon enregistré."
                : "Enregistré. En attente de vérification par la propriétaire."}
          </p>
        ) : null}
        {archiveResult?.error ? (
          <p className="text-sm font-semibold text-danger">{archiveResult.error}</p>
        ) : null}
        {readAgainResult?.error ? (
          <p className="text-sm font-semibold text-danger">{readAgainResult.error}</p>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="submit"
            name="intent"
            value={canVerify ? "verify" : "save"}
            className={PRIMARY}
            disabled={locked || busy}
          >
            {pending
              ? "Enregistrement…"
              : canVerify
                ? "Confirmer et enregistrer"
                : "Enregistrer pour vérification"}
          </button>
          <button
            type="submit"
            name="intent"
            value="draft"
            className={SECONDARY}
            disabled={locked || busy}
          >
            Enregistrer le brouillon
          </button>
          <Link href="/receipts" className={SECONDARY}>
            Annuler
          </Link>
        </div>

        {!canVerify && canWrite ? (
          <p className="text-xs text-muted">
            Seule la propriétaire vérifie un reçu. Le vôtre passera en « À vérifier » et
            n&apos;entrera dans les totaux qu&apos;une fois confirmé.
          </p>
        ) : null}
      </form>

      <div className="flex flex-wrap gap-2">
        <form action={readAgain}>
          <input type="hidden" name="receipt_id" value={receipt.id} />
          <button type="submit" className={SECONDARY} disabled={locked || busy}>
            {rereading ? "Relecture…" : "Relire le fichier"}
          </button>
        </form>
        {canVerify && receipt.status !== "archived" ? (
          <form action={archive}>
            <input type="hidden" name="receipt_id" value={receipt.id} />
            <button type="submit" className={SECONDARY} disabled={busy}>
              {archiving ? "Archivage…" : "Archiver"}
            </button>
          </form>
        ) : null}
      </div>

      {receipt.status === "archived" ? (
        <p className="text-sm text-muted">
          Ce reçu est archivé. Il ne compte plus dans les dépenses et ne peut plus être modifié.
        </p>
      ) : null}
    </div>
  );
}
