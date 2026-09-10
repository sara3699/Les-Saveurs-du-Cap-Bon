import type { AttributionIndex } from "@/lib/domain/attribution";
import { orderSource, totalsByChannel } from "@/lib/domain/attribution";
import { CHANNEL_ORDER } from "@/lib/domain/channels";
import type { ChannelId, Order, TeamConversionMetric } from "@/lib/domain/types";

const DAY = 86_400_000;

export function inLastDays(orders: Order[], days: number, now: Date): Order[] {
  const cutoff = now.getTime() - days * DAY;
  return orders.filter((o) => new Date(o.placedAt).getTime() >= cutoff);
}

export function sinceStartOfDay(orders: Order[], now: Date): Order[] {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return orders.filter((o) => new Date(o.placedAt) >= start);
}

/** Refused and refunded orders are excluded from money, never from counts. */
export function revenueOf(orders: Order[]): number {
  return orders
    .filter((o) => o.paymentStatus !== "refused" && o.paymentStatus !== "refunded")
    .reduce((sum, o) => sum + o.total, 0);
}

export interface DayBar {
  label: string;
  confirmed: number;
  abandoned: number;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function ordersByDay(orders: Order[], days: number, now: Date): DayBar[] {
  const bars: DayBar[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const dayStart = new Date(now.getTime() - i * DAY);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart.getTime() + DAY);
    const inDay = orders.filter((o) => {
      const at = new Date(o.placedAt);
      return at >= dayStart && at < dayEnd;
    });
    bars.push({
      label: WEEKDAYS[dayStart.getDay()],
      confirmed: inDay.filter((o) => o.paymentStatus !== "refused" && o.deliveryStatus !== "cancelled").length,
      abandoned: inDay.filter((o) => o.paymentStatus === "refused" || o.deliveryStatus === "cancelled").length,
    });
  }
  return bars;
}

export interface DeliverySplit {
  delivered: number;
  dispatched: number;
  preparing: number;
  returned: number;
  cancelled: number;
  total: number;
}

export function deliverySplit(orders: Order[]): DeliverySplit {
  const split: DeliverySplit = {
    delivered: 0, dispatched: 0, preparing: 0, returned: 0, cancelled: 0, total: orders.length,
  };
  for (const order of orders) split[order.deliveryStatus] += 1;
  return split;
}

export interface SourceRow {
  channelId: ChannelId;
  label: string;
  orders: number;
  revenue: number;
  share: number;
  /** Change in order count against the previous period of the same length. */
  trend: number | null;
}

/**
 * The panel the whole product is built around. Trend compares this period with
 * the one immediately before it, and reports null rather than a fake zero when
 * there is nothing to compare against.
 */
export function sourceRows(
  current: Order[],
  previous: Order[],
  index: AttributionIndex,
): SourceRow[] {
  const now = totalsByChannel(current, index);
  const before = new Map(
    totalsByChannel(previous, index).map((t) => [t.channelId, t.orders]),
  );

  return CHANNEL_ORDER.map((channelId) => {
    const row = now.find((t) => t.channelId === channelId)!;
    const past = before.get(channelId) ?? 0;
    const trend = past === 0 ? null : ((row.orders - past) / past) * 100;
    return { ...row, trend };
  }).sort((a, b) => b.orders - a.orders);
}

export interface ChannelDemand {
  channelId: ChannelId;
  conversations: number;
  unread: number;
}

export function averageOrderValue(orders: Order[]): number {
  const paying = orders.filter(
    (o) => o.paymentStatus !== "refused" && o.paymentStatus !== "refunded",
  );
  if (paying.length === 0) return 0;
  return revenueOf(paying) / paying.length;
}

export function returnRateByChannel(orders: Order[], index: AttributionIndex) {
  const totals = new Map<ChannelId, { orders: number; returned: number }>();
  for (const id of CHANNEL_ORDER) totals.set(id, { orders: 0, returned: 0 });
  for (const order of orders) {
    const bucket = totals.get(orderSource(order, index).channelId)!;
    bucket.orders += 1;
    if (order.deliveryStatus === "returned") bucket.returned += 1;
  }
  return CHANNEL_ORDER.map((channelId) => {
    const bucket = totals.get(channelId)!;
    return {
      channelId,
      rate: bucket.orders === 0 ? 0 : (bucket.returned / bucket.orders) * 100,
      orders: bucket.orders,
    };
  });
}

export interface ConversionSummary {
  callsReceived: number;
  customersReached: number;
  customersWon: number;
  customersRejected: number;
  ordersPlaced: number;
  revenue: number;
  reachRate: number;
  conversionRate: number;
  orderRate: number;
}

function rate(part: number, whole: number): number {
  return whole === 0 ? 0 : (part / whole) * 100;
}

export function summarizeConversions(metrics: TeamConversionMetric[]): ConversionSummary {
  const summary = metrics.reduce(
    (totals, metric) => ({
      callsReceived: totals.callsReceived + metric.callsReceived,
      customersReached: totals.customersReached + metric.customersReached,
      customersWon: totals.customersWon + metric.customersWon,
      customersRejected: totals.customersRejected + metric.customersRejected,
      ordersPlaced: totals.ordersPlaced + metric.ordersPlaced,
      revenue: totals.revenue + metric.revenue,
    }),
    {
      callsReceived: 0,
      customersReached: 0,
      customersWon: 0,
      customersRejected: 0,
      ordersPlaced: 0,
      revenue: 0,
    },
  );

  return {
    ...summary,
    reachRate: rate(summary.customersReached, summary.callsReceived),
    conversionRate: rate(summary.customersWon, summary.callsReceived),
    orderRate: rate(summary.ordersPlaced, summary.callsReceived),
  };
}

export function conversionRate(metric: TeamConversionMetric): number {
  return rate(metric.customersWon, metric.callsReceived);
}
