"use client";

import { useState } from "react";
import { formatPercent, formatTND } from "@/lib/format";
import type { ProductRow } from "./types";

const FIELD =
  "rounded-[var(--radius-sm)] border border-line bg-surface-2 px-2.5 py-1.5 text-[13px]";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="os-label">{label}</span>
      {children}
      {hint ? <span className="text-[11px] text-muted">{hint}</span> : null}
    </label>
  );
}

/**
 * The edit panel. It changes the row on screen and says so in the same breath,
 * because a Save that looks like every other Save and quietly forgets is worse
 * than no Save at all.
 *
 * The checks are the ones the database would make later: a name, a code no
 * other product is already using, and four figures that are actually filled in.
 * A field left empty is refused rather than quietly saved as zero.
 */
export function EditProductDialog({
  row,
  takenCodes,
  onCancel,
  onSave,
}: {
  row: ProductRow;
  /** The codes the other products already hold, so a duplicate is caught here. */
  takenCodes: string[];
  onCancel: () => void;
  onSave: (next: ProductRow) => void;
}) {
  const [name, setName] = useState(row.name);
  const [sku, setSku] = useState(row.sku);
  const [price, setPrice] = useState(String(row.price));
  const [cost, setCost] = useState(String(row.cost));
  const [stock, setStock] = useState(String(row.stock));
  const [lowStockAt, setLowStockAt] = useState(String(row.lowStockAt));
  const [error, setError] = useState<string | null>(null);

  const numbers = {
    price: Number(price),
    cost: Number(cost),
    stock: Number(stock),
    lowStockAt: Number(lowStockAt),
  };
  const filled = (value: string) => value.trim() !== "";
  const sane = (value: number) => Number.isFinite(value) && value >= 0;

  const priced = filled(price) && filled(cost) && sane(numbers.price) && sane(numbers.cost) && numbers.price > 0;
  const countsKnown = filled(stock) && filled(lowStockAt) && sane(numbers.stock) && sane(numbers.lowStockAt);

  const margin = numbers.price - numbers.cost;
  const marginShare = priced ? (margin / numbers.price) * 100 : 0;
  const sellsAtALoss = priced && margin < 0;
  const willWarn = countsKnown && numbers.stock <= numbers.lowStockAt;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || !sku.trim()) {
      setError("Un produit a besoin d'un nom et d'une référence avant de pouvoir être enregistré.");
      return;
    }
    const wanted = sku.trim().toUpperCase();
    if (takenCodes.some((taken) => taken.trim().toUpperCase() === wanted)) {
      setError(`Un autre produit utilise déjà la référence ${wanted}. Donnez à celui-ci une référence qui lui est propre.`);
      return;
    }
    if (![price, cost, stock, lowStockAt].every(filled)) {
      setError("Le prix, le coût, le stock et le seuil d'alerte doivent tous être remplis.");
      return;
    }
    if (!Object.values(numbers).every(sane)) {
      setError(
        "Le prix, le coût, le stock et le seuil d'alerte doivent tous être des nombres, et aucun ne peut passer sous zéro.",
      );
      return;
    }
    if (numbers.price <= 0) {
      setError("Un produit a besoin d'un prix supérieur à zéro avant de pouvoir figurer sur la boutique.");
      return;
    }
    setError(null);
    onSave({
      ...row,
      name: name.trim(),
      sku: wanted,
      price: numbers.price,
      cost: numbers.cost,
      stock: Math.round(numbers.stock),
      lowStockAt: Math.round(numbers.lowStockAt),
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center"
      onKeyDown={(event) => {
        if (event.key === "Escape") onCancel();
      }}
    >
      <button
        type="button"
        aria-label="Fermer l'éditeur de produit"
        onClick={onCancel}
        className="absolute inset-0 bg-ink/40"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-product-title"
        className="os-card relative z-10 max-h-[90vh] w-full max-w-[560px] overflow-y-auto p-4 sm:p-5"
      >
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="edit-product-title" className="text-[15px] leading-tight">
              Modifier ce produit
            </h2>
            <p className="os-num mt-0.5 text-[11px] text-muted">{row.sku}</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-[var(--radius-sm)] border border-line bg-surface-2 px-2.5 py-1 text-[12px] font-semibold"
          >
            Fermer
          </button>
        </header>

        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Nom">
              <input
                autoFocus
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={FIELD}
              />
            </Field>
          </div>
          <Field label="Référence produit" hint="Votre propre code. Aucun autre produit ne peut porter le même.">
            <input
              value={sku}
              onChange={(event) => setSku(event.target.value)}
              className={`${FIELD} os-num`}
            />
          </Field>
          <Field label="Prix, TND" hint="Ce que le client paie.">
            <input
              type="number"
              min="0"
              step="0.001"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              className={`${FIELD} os-num`}
            />
          </Field>
          <Field label="Coût, TND" hint="Ce que vous payez pour l'avoir en rayon.">
            <input
              type="number"
              min="0"
              step="0.001"
              value={cost}
              onChange={(event) => setCost(event.target.value)}
              className={`${FIELD} os-num`}
            />
          </Field>
          <Field label="Unités en stock">
            <input
              type="number"
              min="0"
              step="1"
              value={stock}
              onChange={(event) => setStock(event.target.value)}
              className={`${FIELD} os-num`}
            />
          </Field>
          <Field label="Seuil d'alerte" hint="Le nombre qui fait passer le produit en jaune.">
            <input
              type="number"
              min="0"
              step="1"
              value={lowStockAt}
              onChange={(event) => setLowStockAt(event.target.value)}
              className={`${FIELD} os-num`}
            />
          </Field>

          <div className="sm:col-span-2 rounded-[var(--radius-md)] border border-line bg-surface-2 px-3 py-2.5 text-[12px]">
            <p className="flex flex-wrap items-baseline gap-x-2">
              <span className="os-label">Marge par unité</span>
              <span className="os-num text-[14px] font-semibold">
                {priced ? formatTND(margin) : "En attente d'un prix et d'un coût"}
              </span>
              {priced ? (
                <span className="os-num text-muted">{formatPercent(marginShare)}</span>
              ) : null}
            </p>
            <p className="mt-1 text-muted">
              {sellsAtALoss
                ? "Le coût est supérieur au prix, chaque vente perd donc de l'argent. Vous pouvez quand même enregistrer, le chiffre vous appartient."
                : !countsKnown
                  ? "Remplissez le stock et le seuil d'alerte pour voir où se situerait ce produit."
                  : willWarn
                    ? "À ce niveau de stock, le produit se trouve dans l'alerte de stock faible."
                    : "À ce niveau de stock, le produit se trouve au-dessus de son seuil d'alerte."}
            </p>
          </div>

          {error ? (
            <p
              role="alert"
              className="sm:col-span-2 rounded-[var(--radius-sm)] border border-danger/20 bg-danger-soft px-3 py-2 text-[12px] text-danger"
            >
              {error}
            </p>
          ) : null}

          <p className="sm:col-span-2 text-[12px] leading-relaxed text-muted">
            L'enregistrement conserve la modification pour cette visite uniquement. La base de
            données arrive dans une étape ultérieure, un rafraîchissement ramène donc les chiffres
            d'origine, et rien ici n'est envoyé à une boutique.
          </p>

          <div className="sm:col-span-2 flex flex-wrap gap-2">
            <button
              type="submit"
              className="rounded-[var(--radius-md)] bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hi"
            >
              Enregistrer pour cette visite
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="rounded-[var(--radius-md)] border border-line bg-surface px-4 py-2 text-sm font-semibold"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
