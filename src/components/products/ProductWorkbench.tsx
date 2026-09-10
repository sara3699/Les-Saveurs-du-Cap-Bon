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
  { value: "cards", label: "Cartes" },
  { value: "table", label: "Tableau" },
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
      `Le produit ${next.name} a été modifie sur cet écran. Rien n'a été ecrit dans une base de données et aucune boutique n'a été informee, car la base de données arrive dans une étape ulterieure.`,
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
        <Stat label="Produits" value={String(rows.length)} détail="Tous en vente" />
        {low.length === 0 ? (
          <Stat label="Stock faible" value="0" détail="Rien n'est sous son seuil d'alerte" />
        ) : (
          <div className="rounded-[var(--radius-card)] border border-accent-line bg-accent-soft p-4">
            <p className="text-xs text-accent-ink">Stock faible</p>
            <p className="os-num mt-1 font-display text-[26px] font-bold leading-none tracking-tight text-accent-ink">
              {low.length}
            </p>
            <p className="mt-1.5 text-xs font-semibold text-accent-ink">
              Au seuil que vous avez fixe ou en dessous
            </p>
          </div>
        )}
        <Stat
          label="Stock en rayon"
          value={formatTNDCompact(stockValue)}
          détail="Ce qu'il vous a coute, pas ce qu'il rapporte a la vente"
        />
        <Stat label="Unités vendues" value={String(sold)} détail="Sur les deux derniers mois" />
      </div>

      {low.length > 0 ? (
        <section className="rounded-[var(--radius-card)] border border-accent-line bg-accent-soft p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-[15px] leading-tight text-accent-ink">
                {low.length === 1 ? "Un produit arrive a court de stock" : `${low.length} produits arrivent a court de stock`}
              </h2>
              <ul className="mt-2 flex flex-col gap-1 text-[13px] text-accent-ink">
                {low.map((row) => (
                  <li key={row.id}>
                    <span className="font-semibold">{row.name}</span>, il reste{" "}
                    <span className="os-num">{row.stock}</span> unités pour un seuil fixe a{" "}
                    <span className="os-num">{row.lowStockAt}</span>. Il s'en est vendu{" "}
                    <span className="os-num">{row.unitsSold}</span> sur les deux derniers mois.
                  </li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              onClick={() => setOnlyLow((current) => !current)}
              className="rounded-[var(--radius-sm)] border border-accent-line bg-surface px-3 py-1.5 text-[12px] font-semibold text-accent-ink"
            >
              {onlyLow ? "Afficher tous les produits" : "Afficher uniquement ceux-ci"}
            </button>
          </div>
        </section>
      ) : null}

      <Card>
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex min-w-0 flex-1 flex-col gap-1 sm:max-w-[260px]">
            <span className="os-label">Recherche</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nom ou référence produit"
              aria-label="Rechercher des produits par nom ou par référence produit"
              className="w-full rounded-[var(--radius-sm)] border border-line bg-surface-2 px-2.5 py-1.5 text-[13px]"
            />
          </label>

          <label className="flex min-w-0 flex-col gap-1">
            <span className="os-label">Trier par</span>
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
              Afficher
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
                Tous les produits
              </button>
              <button
                type="button"
                onClick={() => setOnlyLow(true)}
                aria-pressed={onlyLow}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  onlyLow ? "border-primary bg-primary text-white" : "border-line bg-surface-2 text-muted"
                }`}
              >
                Stock faible, <span className="os-num">{low.length}</span>
              </button>
            </div>
          </div>

          <div className="ml-auto flex flex-col gap-1">
            <span className="os-label" id="products-view-label">
              Affichage
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
            title="Aucun produit ne correspond"
            body="Rien dans la liste ne correspond a la recherche ou au filtre actif. Effacez-les pour retrouver tous les produits, ou essayez la référence produit plutot que le nom."
          />
          <button
            type="button"
            onClick={clearFilters}
            className="self-center rounded-[var(--radius-md)] bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hi"
          >
            Effacer la recherche et le filtre
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
        La repartition par source sous chaque produit est calculee a partir des commandes qui le
        contiennent, et chaque commande garde le canal par lequel elle est arrivée. Les commandes
        refusees et remboursees sont exclues de la repartition, la même règle que le tableau de bord
        applique au chiffre d'affaires.
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
