import type { AttributionIndex } from "@/lib/domain/attribution";
import { orderSource } from "@/lib/domain/attribution";
import { formatTND, relativeTime } from "@/lib/format";
import type { ChannelId, Order, PaymentStatus, DeliveryStatus } from "@/lib/domain/types";

export interface OrderRow {
  id: string;
  reference: string;
  customer: string;
  channelId: ChannelId;
  account: string | null;
  campaign: string | null;
  payment: PaymentStatus;
  delivery: DeliveryStatus;
  totalLabel: string;
  placedLabel: string;
  assignee: string | null;
  href: string;
}

/**
 * One conversion from record to row, used by the Orders table and the dashboard
 * extract, so the source shown in both places comes from the same resolver.
 */
export function toOrderRow(
  order: Order,
  index: AttributionIndex,
  names: { contacts: Map<string, string>; team: Map<string, string> },
  now: Date,
): OrderRow {
  const source = orderSource(order, index);
  return {
    id: order.id,
    reference: order.reference,
    customer: names.contacts.get(order.contactId) ?? "Client inconnu",
    channelId: source.channelId,
    account: source.accountLabel,
    campaign: source.campaign,
    payment: order.paymentStatus,
    delivery: order.deliveryStatus,
    totalLabel: formatTND(order.total, { withCurrency: false }),
    placedLabel: relativeTime(order.placedAt, now),
    assignee: order.assigneeId ? names.team.get(order.assigneeId) ?? null : null,
    href: `/orders/${order.reference}`,
  };
}
