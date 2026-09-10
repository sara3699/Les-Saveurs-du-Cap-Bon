import type { ChannelId } from "@/lib/domain/types";

/**
 * One product as the Products screen needs it: the record itself, plus the
 * channel split worked out on the server from the orders that carry it. The
 * split is resolved through the attribution index, so a product can never be
 * shown as selling "online".
 */
export interface ProductSourceSlice {
  channelId: ChannelId;
  units: number;
}

export interface ProductRow {
  id: string;
  name: string;
  sku: string;
  price: number;
  cost: number;
  stock: number;
  lowStockAt: number;
  unitsSold: number;
  /** Sorted by units, biggest first. Empty when nothing has been ordered yet. */
  sources: ProductSourceSlice[];
  /** Already rendered on the server, so no client component touches the clock. */
  lastSoldLabel: string | null;
}

/**
 * The shop's own détails, read on the server from the same record the Store
 * screen edits and handed down so the customer preview cannot invent a shop
 * name, a delivery fee or a town of its own.
 */
export interface ShopFront {
  name: string;
  initials: string;
  tagline: string;
  website: string;
  phone: string;
  city: string;
  deliveryZone: { name: string; days: string; fee: number };
  freeDeliveryFrom: number;
  preparationLabel: string;
}

export function marginPerUnit(row: ProductRow): number {
  return row.price - row.cost;
}

export function marginShare(row: ProductRow): number {
  if (row.price <= 0) return 0;
  return ((row.price - row.cost) / row.price) * 100;
}

/** Low is at or below the level, not under it, so a product sitting exactly on it is caught. */
export function isLow(row: ProductRow): boolean {
  return row.stock <= row.lowStockAt;
}

export function sourceUnits(row: ProductRow): number {
  return row.sources.reduce((sum, slice) => sum + slice.units, 0);
}

export function sourceShare(row: ProductRow, slice: ProductSourceSlice): number {
  const total = sourceUnits(row);
  return total === 0 ? 0 : (slice.units / total) * 100;
}

export const SORTS = [
  { value: "stock_low", label: "Stock, du plus faible au plus élevé" },
  { value: "stock_high", label: "Stock, du plus élevé au plus faible" },
  { value: "sold_high", label: "Unités vendues, du plus grand au plus petit" },
  { value: "sold_low", label: "Unités vendues, du plus petit au plus grand" },
  { value: "margin_high", label: "Marge par unité, de la plus élevée à la plus faible" },
  { value: "price_high", label: "Prix, du plus élevé au plus faible" },
  { value: "name", label: "Nom, de A à Z" },
] as const;

export type SortKey = (typeof SORTS)[number]["value"];

export function sortRows(rows: ProductRow[], key: SortKey): ProductRow[] {
  const copy = [...rows];
  const byName = (a: ProductRow, b: ProductRow) => a.name.localeCompare(b.name);
  switch (key) {
    case "stock_low":
      return copy.sort((a, b) => a.stock - b.stock || byName(a, b));
    case "stock_high":
      return copy.sort((a, b) => b.stock - a.stock || byName(a, b));
    case "sold_high":
      return copy.sort((a, b) => b.unitsSold - a.unitsSold || byName(a, b));
    case "sold_low":
      return copy.sort((a, b) => a.unitsSold - b.unitsSold || byName(a, b));
    case "margin_high":
      return copy.sort((a, b) => marginPerUnit(b) - marginPerUnit(a) || byName(a, b));
    case "price_high":
      return copy.sort((a, b) => b.price - a.price || byName(a, b));
    default:
      return copy.sort(byName);
  }
}
