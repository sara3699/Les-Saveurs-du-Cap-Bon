"use client";

import { ChannelDot } from "@/components/ui/badges";
import { channel } from "@/lib/domain/channels";
import { formatPercent, formatTND } from "@/lib/format";
import {
  isLow,
  marginPerUnit,
  marginShare,
  sourceShare,
  type ProductRow,
} from "./types";

export interface ViewProps {
  rows: ProductRow[];
  onEdit: (id: string) => void;
  onPreview: (id: string) => void;
}

/**
 * The channel split for one product. Every slice is a channel resolved on the
 * server through the attribution index, so the bar can only ever be made of
 * real sources. When the bar carries more channels than the list under it
 * names, it says so rather than letting three stand in for all of them.
 */
function SourceStrip({ row, limit = 3 }: { row: ProductRow; limit?: number }) {
  if (row.sources.length === 0) {
    return (
      <p className="text-[11.5px] text-muted">
        Aucune commande enregistrée pour ce produit pour l'instant.
      </p>
    );
  }
  const rest = row.sources.length - limit;
  return (
    <div>
      <p className="os-label">D'ou viennent ses commandes</p>
      <span className="mt-1.5 flex h-1.5 w-full overflow-hidden rounded-full bg-surface-2 ring-1 ring-line">
        {row.sources.map((slice) => (
          <span
            key={slice.channelId}
            className="block h-full first:rounded-l-full last:rounded-r-full"
            style={{
              width: `${sourceShare(row, slice)}%`,
              background: channel(slice.channelId).colorVar,
            }}
          />
        ))}
      </span>
      <span className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted">
        {row.sources.slice(0, limit).map((slice) => (
          <span key={slice.channelId} className="flex items-center gap-1.5">
            <ChannelDot channelId={slice.channelId} size={7} />
            {channel(slice.channelId).label}
            <span className="os-num text-ink">{formatPercent(sourceShare(row, slice))}</span>
          </span>
        ))}
        {rest > 0 ? (
          <span>
            et <span className="os-num">{rest}</span> de plus dans la barre
          </span>
        ) : null}
      </span>
    </div>
  );
}

function Figure({
  label,
  value,
  détail,
  tone = "plain",
}: {
  label: string;
  value: string;
  détail?: React.ReactNode;
  tone?: "plain" | "warning";
}) {
  return (
    <div>
      <dt className="os-label">{label}</dt>
      <dd
        className={`os-num mt-0.5 text-[14px] font-semibold ${tone === "warning" ? "text-accent-ink" : ""}`}
      >
        {value}
      </dd>
      {détail ? <dd className="text-[11px] text-muted">{détail}</dd> : null}
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  primary = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[var(--radius-sm)] px-3 py-1.5 text-[12px] font-semibold ${
        primary
          ? "bg-primary text-white hover:bg-primary-hi"
          : "border border-line bg-surface-2 text-ink hover:border-line-strong"
      }`}
    >
      {children}
    </button>
  );
}

/**
 * The preview action is an anchor as well as a click: it swaps the product in
 * the storefront panel and takes the reader down to it, so the panel is never
 * changed somewhere off screen.
 */
function PreviewLink({ id, onPreview }: { id: string; onPreview: (id: string) => void }) {
  return (
    <a
      href="#storefront-preview"
      onClick={() => onPreview(id)}
      className="rounded-[var(--radius-sm)] border border-line bg-surface-2 px-3 py-1.5 text-[12px] font-semibold text-ink hover:border-line-strong"
    >
      Apercu
    </a>
  );
}

function StockNote({ row, low }: { row: ProductRow; low: boolean }) {
  return (
    <>
      {low ? "Faible, reapprovisionner a " : "Alerte a "}
      <span className="os-num">{row.lowStockAt}</span>
    </>
  );
}

function ProductCard({ row, onEdit, onPreview }: { row: ProductRow } & Omit<ViewProps, "rows">) {
  const low = isLow(row);
  return (
    <article
      className={
        low
          ? "flex flex-col gap-3 rounded-[var(--radius-card)] border border-accent-line bg-accent-soft p-4"
          : "os-card flex flex-col gap-3 p-4"
      }
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[15px] leading-tight">{row.name}</h3>
          <p className="os-num mt-1 text-[11px] text-muted">{row.sku}</p>
        </div>
        {low ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-accent-line bg-surface px-2.5 py-1 text-[11.5px] font-semibold text-accent-ink">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent" />
            Stock faible
          </span>
        ) : null}
      </header>

      <dl className="grid grid-cols-3 gap-x-3 gap-y-2.5">
        <Figure label="Prix, TND" value={formatTND(row.price, { withCurrency: false })} />
        <Figure label="Coût, TND" value={formatTND(row.cost, { withCurrency: false })} />
        <Figure
          label="Marge par unité"
          value={formatTND(marginPerUnit(row), { withCurrency: false })}
          détail={<span className="os-num">{formatPercent(marginShare(row))}</span>}
        />
        <Figure
          label="En stock"
          value={String(row.stock)}
          détail={<StockNote row={row} low={low} />}
          tone={low ? "warning" : "plain"}
        />
        <Figure label="Unités vendues" value={String(row.unitsSold)} détail="Deux derniers mois" />
        <Figure
          label="Valeur du stock"
          value={formatTND(row.stock * row.cost, { withCurrency: false })}
          détail="Au cout"
        />
      </dl>

      <SourceStrip row={row} />

      <footer className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
        <span className="text-[11px] text-muted">
          {row.lastSoldLabel ? `Dernière vente ${row.lastSoldLabel}` : "Pas encore vendu"}
        </span>
        <span className="flex gap-1.5">
          <PreviewLink id={row.id} onPreview={onPreview} />
          <ActionButton onClick={() => onEdit(row.id)} primary>
            Modifier
          </ActionButton>
        </span>
      </footer>
    </article>
  );
}

export function ProductCards({ rows, onEdit, onPreview }: ViewProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {rows.map((row) => (
        <ProductCard key={row.id} row={row} onEdit={onEdit} onPreview={onPreview} />
      ))}
    </div>
  );
}

export function ProductTable({ rows, onEdit, onPreview }: ViewProps) {
  return (
    <div className="os-scroll">
      <table className="w-full min-w-[980px] border-collapse text-sm">
        <thead>
          <tr>
            <th className="os-label pb-2.5 pr-3 text-left font-normal">Produit</th>
            <th className="os-label pb-2.5 pr-3 text-left font-normal">Canaux de vente</th>
            <th className="os-label pb-2.5 pr-3 text-right font-normal">Prix, TND</th>
            <th className="os-label pb-2.5 pr-3 text-right font-normal">Coût, TND</th>
            <th className="os-label pb-2.5 pr-3 text-right font-normal">Marge par unité</th>
            <th className="os-label pb-2.5 pr-3 text-right font-normal">En stock</th>
            <th className="os-label pb-2.5 pr-3 text-right font-normal">Unités vendues</th>
            <th className="os-label pb-2.5 text-right font-normal">Modifier ou apercu</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const low = isLow(row);
            const rest = row.sources.length - 3;
            return (
              <tr
                key={row.id}
                className={`border-t border-line ${low ? "bg-accent-soft" : "hover:bg-surface-2"}`}
              >
                <td className="py-2.5 pr-3">
                  <span className="block text-[13px] font-semibold leading-snug">{row.name}</span>
                  <span className="os-num block text-[11px] text-muted">{row.sku}</span>
                </td>
                <td className="py-2.5 pr-3">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-muted">
                    {row.sources.length === 0 ? (
                      <span>Pas encore de commande</span>
                    ) : (
                      <>
                        {row.sources.slice(0, 3).map((slice) => (
                          <span key={slice.channelId} className="flex items-center gap-1.5">
                            <ChannelDot channelId={slice.channelId} size={7} />
                            {channel(slice.channelId).label}
                          </span>
                        ))}
                        {rest > 0 ? (
                          <span>
                            et <span className="os-num">{rest}</span> de plus
                          </span>
                        ) : null}
                      </>
                    )}
                  </span>
                </td>
                <td className="os-num py-2.5 pr-3 text-right text-[12.5px]">
                  {formatTND(row.price, { withCurrency: false })}
                </td>
                <td className="os-num py-2.5 pr-3 text-right text-[12.5px] text-muted">
                  {formatTND(row.cost, { withCurrency: false })}
                </td>
                <td className="py-2.5 pr-3 text-right">
                  <span className="os-num block text-[12.5px]">
                    {formatTND(marginPerUnit(row), { withCurrency: false })}
                  </span>
                  <span className="os-num block text-[11px] text-muted">
                    {formatPercent(marginShare(row))}
                  </span>
                </td>
                <td className="py-2.5 pr-3 text-right">
                  <span
                    className={`os-num block text-[13px] font-semibold ${low ? "text-accent-ink" : ""}`}
                  >
                    {row.stock}
                  </span>
                  <span
                    className={`block text-[11px] ${low ? "font-semibold text-accent-ink" : "text-muted"}`}
                  >
                    <StockNote row={row} low={low} />
                  </span>
                </td>
                <td className="os-num py-2.5 pr-3 text-right text-[12.5px]">{row.unitsSold}</td>
                <td className="py-2.5 text-right">
                  <span className="flex justify-end gap-1.5">
                    <PreviewLink id={row.id} onPreview={onPreview} />
                    <ActionButton onClick={() => onEdit(row.id)} primary>
                      Modifier
                    </ActionButton>
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
