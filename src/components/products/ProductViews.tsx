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
        No orders on record for this product yet.
      </p>
    );
  }
  const rest = row.sources.length - limit;
  return (
    <div>
      <p className="os-label">Where its orders come from</p>
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
            and <span className="os-num">{rest}</span> more in the bar
          </span>
        ) : null}
      </span>
    </div>
  );
}

function Figure({
  label,
  value,
  detail,
  tone = "plain",
}: {
  label: string;
  value: string;
  detail?: React.ReactNode;
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
      {detail ? <dd className="text-[11px] text-muted">{detail}</dd> : null}
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
      Preview
    </a>
  );
}

function StockNote({ row, low }: { row: ProductRow; low: boolean }) {
  return (
    <>
      {low ? "Low, reorder at " : "Warning at "}
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
            Low on stock
          </span>
        ) : null}
      </header>

      <dl className="grid grid-cols-3 gap-x-3 gap-y-2.5">
        <Figure label="Price, TND" value={formatTND(row.price, { withCurrency: false })} />
        <Figure label="Cost, TND" value={formatTND(row.cost, { withCurrency: false })} />
        <Figure
          label="Margin per unit"
          value={formatTND(marginPerUnit(row), { withCurrency: false })}
          detail={<span className="os-num">{formatPercent(marginShare(row))}</span>}
        />
        <Figure
          label="In stock"
          value={String(row.stock)}
          detail={<StockNote row={row} low={low} />}
          tone={low ? "warning" : "plain"}
        />
        <Figure label="Units sold" value={String(row.unitsSold)} detail="Last two months" />
        <Figure
          label="Stock value"
          value={formatTND(row.stock * row.cost, { withCurrency: false })}
          detail="At cost"
        />
      </dl>

      <SourceStrip row={row} />

      <footer className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
        <span className="text-[11px] text-muted">
          {row.lastSoldLabel ? `Last sold ${row.lastSoldLabel}` : "Not sold yet"}
        </span>
        <span className="flex gap-1.5">
          <PreviewLink id={row.id} onPreview={onPreview} />
          <ActionButton onClick={() => onEdit(row.id)} primary>
            Edit
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
            <th className="os-label pb-2.5 pr-3 text-left font-normal">Product</th>
            <th className="os-label pb-2.5 pr-3 text-left font-normal">Sells through</th>
            <th className="os-label pb-2.5 pr-3 text-right font-normal">Price, TND</th>
            <th className="os-label pb-2.5 pr-3 text-right font-normal">Cost, TND</th>
            <th className="os-label pb-2.5 pr-3 text-right font-normal">Margin per unit</th>
            <th className="os-label pb-2.5 pr-3 text-right font-normal">In stock</th>
            <th className="os-label pb-2.5 pr-3 text-right font-normal">Units sold</th>
            <th className="os-label pb-2.5 text-right font-normal">Edit or preview</th>
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
                      <span>No orders yet</span>
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
                            and <span className="os-num">{rest}</span> more
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
                      Edit
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
