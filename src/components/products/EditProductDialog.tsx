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
      setError("A product needs a name and a code before it can be saved.");
      return;
    }
    const wanted = sku.trim().toUpperCase();
    if (takenCodes.some((taken) => taken.trim().toUpperCase() === wanted)) {
      setError(`Another product already uses the code ${wanted}. Give this one a code of its own.`);
      return;
    }
    if (![price, cost, stock, lowStockAt].every(filled)) {
      setError("Price, cost, stock and the warning level all have to be filled in.");
      return;
    }
    if (!Object.values(numbers).every(sane)) {
      setError(
        "Price, cost, stock and the warning level all have to be numbers, and none of them can go below zero.",
      );
      return;
    }
    if (numbers.price <= 0) {
      setError("A product needs a price above zero before it can go on the storefront.");
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
        aria-label="Close the product editor"
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
              Edit this product
            </h2>
            <p className="os-num mt-0.5 text-[11px] text-muted">{row.sku}</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-[var(--radius-sm)] border border-line bg-surface-2 px-2.5 py-1 text-[12px] font-semibold"
          >
            Close
          </button>
        </header>

        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Name">
              <input
                autoFocus
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={FIELD}
              />
            </Field>
          </div>
          <Field label="Product code" hint="Your own code. No other product can hold the same one.">
            <input
              value={sku}
              onChange={(event) => setSku(event.target.value)}
              className={`${FIELD} os-num`}
            />
          </Field>
          <Field label="Price, TND" hint="What the customer pays.">
            <input
              type="number"
              min="0"
              step="0.001"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              className={`${FIELD} os-num`}
            />
          </Field>
          <Field label="Cost, TND" hint="What you pay to have it on the shelf.">
            <input
              type="number"
              min="0"
              step="0.001"
              value={cost}
              onChange={(event) => setCost(event.target.value)}
              className={`${FIELD} os-num`}
            />
          </Field>
          <Field label="Units in stock">
            <input
              type="number"
              min="0"
              step="1"
              value={stock}
              onChange={(event) => setStock(event.target.value)}
              className={`${FIELD} os-num`}
            />
          </Field>
          <Field label="Warn me at" hint="The count that turns the product yellow.">
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
              <span className="os-label">Margin per unit</span>
              <span className="os-num text-[14px] font-semibold">
                {priced ? formatTND(margin) : "Waiting on a price and a cost"}
              </span>
              {priced ? (
                <span className="os-num text-muted">{formatPercent(marginShare)}</span>
              ) : null}
            </p>
            <p className="mt-1 text-muted">
              {sellsAtALoss
                ? "The cost is above the price, so every sale loses money. You can still save it, the figure is yours."
                : !countsKnown
                  ? "Fill in the stock and the warning level to see where this product would sit."
                  : willWarn
                    ? "At this stock level the product sits in the low stock warning."
                    : "At this stock level the product sits above its warning."}
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
            Saving holds the change for this visit only. The database arrives in a later step, so a
            refresh brings the original figures back, and nothing here is sent to a storefront.
          </p>

          <div className="sm:col-span-2 flex flex-wrap gap-2">
            <button
              type="submit"
              className="rounded-[var(--radius-md)] bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hi"
            >
              Save for this visit
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="rounded-[var(--radius-md)] border border-line bg-surface px-4 py-2 text-sm font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
