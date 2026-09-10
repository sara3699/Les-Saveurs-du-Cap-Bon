import { CHANNEL_ORDER, channel } from "./channels";
import type {
  ChannelConnection,
  ChannelId,
  Conversation,
  Order,
  SourceAttribution,
} from "./types";

export interface AttributionIndex {
  attributions: Map<string, SourceAttribution>;
  connections: Map<string, ChannelConnection>;
}

export function buildAttributionIndex(
  attributions: SourceAttribution[],
  connections: ChannelConnection[],
): AttributionIndex {
  return {
    attributions: new Map(attributions.map((a) => [a.id, a])),
    connections: new Map(connections.map((c) => [c.id, c])),
  };
}

export interface ResolvedSource {
  channelId: ChannelId;
  /** "WhatsApp", never "Online". */
  label: string;
  /** "WhatsApp Business" plus the account, when there is a connected account. */
  accountLabel: string | null;
  connectionId: string | null;
  externalId: string | null;
  receivedAt: string;
  campaign: string | null;
  referrer: string | null;
}

/**
 * Every screen that shows where something came from goes through this function.
 *
 * It throws rather than falling back to a friendly default. A missing attribution
 * is a bug in the data, and a bug that shows up as the word "Online" on a customer's
 * order is exactly the failure this product exists to prevent, so it fails loudly
 * in development instead of lying quietly in production.
 */
export function resolveSource(attributionId: string, index: AttributionIndex): ResolvedSource {
  const attribution = index.attributions.get(attributionId);
  if (!attribution) {
    throw new Error(
      `No source attribution found for ${attributionId}. A record without a source cannot be displayed.`,
    );
  }
  const connection = attribution.connectionId
    ? index.connections.get(attribution.connectionId) ?? null
    : null;

  return {
    channelId: attribution.channelId,
    label: channel(attribution.channelId).label,
    accountLabel: connection ? connection.accountLabel : null,
    connectionId: attribution.connectionId,
    externalId: attribution.externalId,
    receivedAt: attribution.receivedAt,
    campaign: attribution.campaign,
    referrer: attribution.referrer,
  };
}

export function orderSource(order: Order, index: AttributionIndex): ResolvedSource {
  return resolveSource(order.attributionId, index);
}

export function conversationSource(
  conversation: Conversation,
  index: AttributionIndex,
): ResolvedSource {
  return resolveSource(conversation.attributionId, index);
}

export interface ChannelTotals {
  channelId: ChannelId;
  label: string;
  orders: number;
  revenue: number;
  /** Share of orders in the set, 0 to 100. */
  share: number;
}

/**
 * Revenue counts orders that were actually paid or are out for cash on delivery.
 * A refused card is still a WhatsApp order and still appears in the count, which
 * is why counts and revenue are reported separately rather than as one number.
 */
export function totalsByChannel(orders: Order[], index: AttributionIndex): ChannelTotals[] {
  const counts = new Map<ChannelId, { orders: number; revenue: number }>();
  for (const id of CHANNEL_ORDER) counts.set(id, { orders: 0, revenue: 0 });

  for (const order of orders) {
    const source = orderSource(order, index);
    const bucket = counts.get(source.channelId);
    if (!bucket) continue;
    bucket.orders += 1;
    if (order.paymentStatus !== "refused" && order.paymentStatus !== "refunded") {
      bucket.revenue += order.total;
    }
  }

  const totalOrders = orders.length || 1;
  return CHANNEL_ORDER.map((id) => {
    const bucket = counts.get(id)!;
    return {
      channelId: id,
      label: channel(id).label,
      orders: bucket.orders,
      revenue: bucket.revenue,
      share: (bucket.orders / totalOrders) * 100,
    };
  });
}

/**
 * First touch is the channel a customer arrived on and is never rewritten.
 * Latest touch follows them. Showing both is how the owner sees that Instagram
 * brought the customer in even though the order was placed on the website.
 */
export function touchSummary(
  firstTouch: ChannelId,
  latestTouch: ChannelId,
): { changed: boolean; first: string; latest: string } {
  return {
    changed: firstTouch !== latestTouch,
    first: channel(firstTouch).label,
    latest: channel(latestTouch).label,
  };
}
