"use client";

import { useState } from "react";
import { EditProductDialog } from "./EditProductDialog";
import { ProductCards, ProductTable } from "./ProductViews";
import { StorefrontPreview } from "./StorefrontPreview";
import {
  SORTS,
  isLow,
  sortRows,
  type ProductRow,
  type ShopFront,
  type SortKey,
} from "./types";
import { Card, EmptyState, Stat } from "@/components/ui/surfaces";
import { formatTNDCompact } from "@/lib/format";

const VIEWS = [
  { value: "cards", label: "Cards" },
  { value: "table", label: "Table" },
] as const;

type ViewKey = (typeof VIEWS)[number]["value"];

/**
 * Everything on this screen that reacts to a click lives here, because the edit
 * panel writes back into the same list the tiles and the storefront preview are
 * counted from. Change a price and the margin, the stock value and the customer
 * view all move together, which is the only way the demo tells the truth.
 */
export function ProductWorkbench({ rows: initialRows, shop }: { rows: ProductRow[]; shop: ShopFront }) {
  const [rows, setRows] = useState(initialRows);
  const [view, setView] = useState<ViewKey>("cards");
  const [sort, setSort] = useState<SortKey>("stock_low");
  const [onlyLow, setOnlyLow] = useState(false);
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(initialRows[0]?.id ?? null);
  const [receipt, setReceipt] = useState<string | null>(null);

  const low = rows.filter(isLow);
  const stockValue = rows.reduce((sum, row) => sum + row.stock * row.cost, 0);
  const sold = rows.reduce((sum, row) => sum + row.unitsSold, 0);

  const term = query.trim().toLowerCase();
  const matches = rows.filter((row) => {
    if (onlyLow && !isLow(row)) return false;
    if (!term) return true;
    return row.name.toLowerCase().includes(term) || row.sku.toLowerCase().includes(term);
  });
  const visible = sortRows(matches, sort);

  const editing = rows.find((row) => row.id === editingId) ?? null;
  const previewed = rows.find((row) => row.id === previewId) ?? rows[0] ?? null;

  function save(next: ProductRow) {
    setRows((current) => current.map((row) => (row.id === next.id ? next : row)));
    setEditingId(null);
    setPreviewId(next.id);
    setReceipt(
      `${next.name} was changed on this screen. Nothing was written to a database and no storefront was told, because the database arrives in a later step.`,
    );
  }

  function clearFilters() {
    setQuery("");
    setOnlyLow(false);
    setReceipt(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Products" value={String(rows.length)} detail="All of them for sale" />
        {low.length === 0 ? (
          <Stat label="Low on stock" value="0" detail="Nothing is under its warning level" />
        ) : (
          <div className="rounded-[var(--radius-card)] border border-accent-line bg-accent-soft p-4">
            <p className="text-xs text-accent-ink">Low on stock</p>
            <p className="os-num mt-1 font-display text-[26px] font-bold leading-none tracking-tight text-accent-ink">
              {low.length}
            </p>
            <p className="mt-1.5 text-xs font-semibold text-accent-ink">
              At or below the level you set
            </p>
          </div>
        )}
        <Stat
          label="Stock on the shelf"
          value={formatTNDCompact(stockValue)}
          detail="What it cost you, not what it sells for"
        />
        <Stat label="Units sold" value={String(sold)} detail="Across the last two months" />
      </div>

      {low.length > 0 ? (
        <section className="rounded-[var(--radius-card)] border border-accent-line bg-accent-soft p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-[15px] leading-tight text-accent-ink">
                {low.length === 1 ? "One product is running low" : `${low.length} products are running low`}
              </h2>
              <ul className="mt-2 flex flex-col gap-1 text-[13px] text-accent-ink">
                {low.map((row) => (
                  <li key={row.id}>
                    <span className="font-semibold">{row.name}</span>,{" "}
                    <span className="os-num">{row.stock}</span> left against a warning set at{" "}
                    <span className="os-num">{row.lowStockAt}</span>. It sold{" "}
                    <span className="os-num">{row.unitsSold}</span> in the last two months.
                  </li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              onClick={() => setOnlyLow((current) => !current)}
              className="rounded-[var(--radius-sm)] border border-accent-line bg-surface px-3 py-1.5 text-[12px] font-semibold text-accent-ink"
            >
              {onlyLow ? "Show every product" : "Show only these"}
            </button>
          </div>
        </section>
      ) : null}

      <Card>
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex min-w-0 flex-1 flex-col gap-1 sm:max-w-[260px]">
            <span className="os-label">Search</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name or product code"
              aria-label="Search products by name or product code"
              className="w-full rounded-[var(--radius-sm)] border border-line bg-surface-2 px-2.5 py-1.5 text-[13px]"
            />
          </label>

          <label className="flex min-w-0 flex-col gap-1">
            <span className="os-label">Sort by</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
              className="max-w-full rounded-[var(--radius-sm)] border border-line bg-surface-2 px-2.5 py-1.5 text-[13px]"
            >
              {SORTS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-col gap-1">
            <span className="os-label" id="products-show-label">
              Show
            </span>
            <div role="group" aria-labelledby="products-show-label" className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setOnlyLow(false)}
                aria-pressed={!onlyLow}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  onlyLow ? "border-line bg-surface-2 text-muted" : "border-primary bg-primary text-white"
                }`}
              >
                All products
              </button>
              <button
                type="button"
                onClick={() => setOnlyLow(true)}
                aria-pressed={onlyLow}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  onlyLow ? "border-primary bg-primary text-white" : "border-line bg-surface-2 text-muted"
                }`}
              >
                Low on stock, <span className="os-num">{low.length}</span>
              </button>
            </div>
          </div>

          <div className="ml-auto flex flex-col gap-1">
            <span className="os-label" id="products-view-label">
              View
            </span>
            <div role="group" aria-labelledby="products-view-label" className="flex gap-1.5">
              {VIEWS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setView(option.value)}
                  aria-pressed={view === option.value}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                    view === option.value
                      ? "border-primary bg-primary text-white"
                      : "border-line bg-surface-2 text-muted"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {receipt ? (
          <p
            role="status"
            className="mt-3 rounded-[var(--radius-sm)] border border-line bg-surface-2 px-3 py-2 text-[12px] text-muted"
          >
            {receipt}
          </p>
        ) : null}
      </Card>

      {visible.length === 0 ? (
        <div className="flex flex-col gap-3">
          <EmptyState
            title="No product matches this"
            body="Nothing in the list matches the search or the filter you have on. Clear them to bring every product back, or try the product code instead of the name."
          />
          <button
            type="button"
            onClick={clearFilters}
            className="self-center rounded-[var(--radius-md)] bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hi"
          >
            Clear the search and the filter
          </button>
        </div>
      ) : view === "cards" ? (
        <ProductCards rows={visible} onEdit={setEditingId} onPreview={setPreviewId} />
      ) : (
        <Card>
          <ProductTable rows={visible} onEdit={setEditingId} onPreview={setPreviewId} />
        </Card>
      )}

      <p className="max-w-[80ch] text-xs leading-relaxed text-muted">
        The source split under each product is worked out from the orders that carry it, and each
        order keeps the channel it arrived on. Refused and refunded orders are left out of the
        split, the same rule the dashboard uses for revenue.
      </p>

      {previewed ? (
        <div id="storefront-preview" className="scroll-mt-16">
          <StorefrontPreview row={previewed} rows={rows} shop={shop} onSelect={setPreviewId} />
        </div>
      ) : null}

      {editing ? (
        <EditProductDialog
          key={editing.id}
          row={editing}
          takenCodes={rows.filter((row) => row.id !== editing.id).map((row) => row.sku)}
          onCancel={() => setEditingId(null)}
          onSave={save}
        />
      ) : null}
    </div>
  );
}
