import Link from "next/link";
import {
  ChannelComparison,
  DeliveryByChannel,
  PeriodBars,
  type ComparisonRow,
  type DeliveryRow,
  type PeriodBar,
} from "@/components/statistics/panels";
import { Card, DemoChip, EmptyState, PageHeader, Stat } from "@/components/ui/surfaces";
import { buildAttributionIndex, orderSource, resolveSource } from "@/lib/domain/attribution";
import { CHANNEL_ORDER, channel } from "@/lib/domain/channels";
import type { ChannelId, Message, Order } from "@/lib/domain/types";
import { formatDate, formatTND, formatTNDCompact } from "@/lib/format";
import { deliverySplit, revenueOf } from "@/lib/metrics";
import { DEMO_NOW } from "@/lib/mock/time";
import { getRepositories } from "@/lib/repositories";

export const metadata = { title: "Statistics, Les Saveurs du Cap Bon" };

// The demo clock moves with the visit, so these pages are rendered per request
// rather than frozen into the build.
export const dynamic = "force-dynamic";

type Params = Promise<Record<string, string | string[] | undefined>>;

const DAY = 86_400_000;

/** A channel needs this many orders before its return rate is worth naming. */
const RETURN_RATE_MINIMUM = 10;

const PERIODS = [
  { value: "7", days: 7, label: "7 days" },
  { value: "30", days: 30, label: "30 days" },
  { value: "90", days: 90, label: "90 days" },
];

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * How long the customer waited for a first answer. The reply has to come after
 * the customer's message in the thread, so a message we sent first, before the
 * customer had written anything, is never counted as a fast reply.
 */
function replyGapMs(messages: Message[]): number | null {
  const firstInbound = messages.findIndex((m) => m.direction === "inbound");
  if (firstInbound === -1) return null;
  const askedAt = new Date(messages[firstInbound].sentAt).getTime();
  const reply = messages.slice(firstInbound + 1).find((m) => m.direction === "outbound");
  if (!reply) return null;
  const gap = new Date(reply.sentAt).getTime() - askedAt;
  return gap < 0 ? null : gap;
}

export default async function StatisticsPage({ searchParams }: { searchParams: Params }) {
  const params = await searchParams;
  const requested = one(params.days) ?? "30";
  const period = PERIODS.find((p) => p.value === requested) ?? PERIODS[1];
  const days = period.days;

  const repos = getRepositories();
  const [orders, allConversations, connections, attributions] = await Promise.all([
    repos.orders.list({ sinceDays: days }),
    repos.conversations.list(),
    repos.integrations.list(),
    repos.workspace.attributions(),
  ]);

  const index = buildAttributionIndex(attributions, connections);
  const now = DEMO_NOW;
  const startMs = now.getTime() - days * DAY;
  const rangeLabel = `${formatDate(new Date(startMs).toISOString())} to ${formatDate(now.toISOString())}`;

  // Conversations are counted from the moment Les Saveurs du Cap Bon received the request,
  // which is the same clock the orders are measured on.
  const threads = await Promise.all(
    allConversations
      .filter((c) => new Date(resolveSource(c.attributionId, index).receivedAt).getTime() >= startMs)
      .map(async (conversation) => {
        const source = resolveSource(conversation.attributionId, index);
        const messages = await repos.conversations.messages(conversation.id);
        return {
          id: conversation.id,
          contactId: conversation.contactId,
          channelId: source.channelId,
          receivedAt: new Date(source.receivedAt).getTime(),
          gapMs: replyGapMs(messages),
        };
      }),
  );

  // The join the whole screen rests on: a conversation counts as converted when
  // the same customer placed an order on or after the day it arrived.
  const producedAnOrder = (thread: { id: string; contactId: string; receivedAt: number }) =>
    orders.some(
      (order) =>
        order.conversationId === thread.id ||
        (order.contactId === thread.contactId &&
          new Date(order.placedAt).getTime() >= thread.receivedAt),
    );

  const ordersByChannel = new Map<ChannelId, Order[]>();
  for (const id of CHANNEL_ORDER) ordersByChannel.set(id, []);
  for (const order of orders) {
    ordersByChannel.get(orderSource(order, index).channelId)!.push(order);
  }

  const totalRevenue = revenueOf(orders);
  // The same set revenueOf adds up, so the average below is that revenue divided
  // by the orders it actually came from. Awaiting payment still counts here.
  const countedForRevenue = orders.filter(
    (o) => o.paymentStatus !== "refused" && o.paymentStatus !== "refunded",
  );
  const convertedTotal = threads.filter(producedAnOrder).length;

  const rows: ComparisonRow[] = CHANNEL_ORDER.map((channelId) => {
    const channelOrders = ordersByChannel.get(channelId)!;
    const revenue = revenueOf(channelOrders);
    const paying = channelOrders.filter(
      (o) => o.paymentStatus !== "refused" && o.paymentStatus !== "refunded",
    );
    const channelThreads = threads.filter((t) => t.channelId === channelId);
    const answered = channelThreads.filter((t) => t.gapMs !== null);
    const converted = channelThreads.filter(producedAnOrder).length;
    return {
      channelId,
      label: channel(channelId).label,
      orders: channelOrders.length,
      revenue,
      revenueShare: totalRevenue === 0 ? 0 : (revenue / totalRevenue) * 100,
      averageOrder: paying.length === 0 ? null : revenue / paying.length,
      conversations: channelThreads.length,
      converted,
      conversionRate:
        channelThreads.length === 0 ? null : (converted / channelThreads.length) * 100,
      replyMs:
        answered.length === 0
          ? null
          : answered.reduce((sum, t) => sum + (t.gapMs ?? 0), 0) / answered.length,
      replySamples: answered.length,
    };
  }).sort((a, b) => b.revenue - a.revenue);

  const deliveryRows: DeliveryRow[] = rows.map((row) => {
    const split = deliverySplit(ordersByChannel.get(row.channelId)!);
    return {
      channelId: row.channelId,
      label: row.label,
      orders: split.total,
      delivered: split.delivered,
      dispatched: split.dispatched,
      preparing: split.preparing,
      cancelled: split.cancelled,
      returned: split.returned,
      returnRate: split.total === 0 ? null : (split.returned / split.total) * 100,
    };
  });

  const worstReturns =
    deliveryRows
      .filter((r) => r.orders >= RETURN_RATE_MINIMUM && r.returnRate !== null)
      .sort((a, b) => (b.returnRate ?? 0) - (a.returnRate ?? 0))[0] ?? null;

  // Seven and thirty days read day by day. Ninety would be too many bars to tell
  // apart, so it goes week by week; the chart says which of the two it is.
  const bucketDays = days === 90 ? 7 : 1;
  const bucketMs = bucketDays * DAY;
  const bucketCount = Math.ceil(days / bucketDays);
  const buckets: Order[][] = Array.from({ length: bucketCount }, () => []);
  for (const order of orders) {
    const offset = new Date(order.placedAt).getTime() - startMs;
    const slot = Math.min(bucketCount - 1, Math.max(0, Math.floor(offset / bucketMs)));
    buckets[slot].push(order);
  }

  const bucketMeta = buckets.map((bucketOrders, i) => {
    const from = new Date(startMs + i * bucketMs);
    const to = new Date(Math.min(startMs + (i + 1) * bucketMs - 1, now.getTime()));
    return {
      key: `bk_${i}`,
      label: String(from.getDate()),
      title:
        bucketDays === 1
          ? formatDate(from.toISOString())
          : `${formatDate(from.toISOString())} to ${formatDate(to.toISOString())}`,
      orders: bucketOrders.length,
      revenue: revenueOf(bucketOrders),
    };
  });

  const revenueBars: PeriodBar[] = bucketMeta.map((b) => ({
    key: b.key,
    label: b.label,
    title: b.title,
    value: b.revenue,
    valueLabel: formatTNDCompact(b.revenue),
  }));
  const orderBars: PeriodBar[] = bucketMeta.map((b) => ({
    key: b.key,
    label: b.label,
    title: b.title,
    value: b.orders,
    valueLabel: String(b.orders),
  }));

  const busiest = bucketMeta.reduce((best, b) => (b.revenue > best.revenue ? b : best), bucketMeta[0]);
  const bucketWord = bucketDays === 1 ? "day" : "week";

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Statistics"
        subtitle={`Every figure below covers the last ${days} days, ${rangeLabel}.`}
        actions={
          <>
            <DemoChip />
            <span className="flex gap-1.5" role="group" aria-label="Date range for every figure on this page">
              {PERIODS.map((option) => (
                <Link
                  key={option.value}
                  href={`/statistics?days=${option.value}`}
                  aria-current={option.value === period.value ? "page" : undefined}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                    option.value === period.value
                      ? "border-primary bg-primary text-white"
                      : "border-line bg-surface-2 text-muted hover:border-line-strong"
                  }`}
                >
                  {option.label}
                </Link>
              ))}
            </span>
          </>
        }
      />

      {orders.length === 0 ? (
        <EmptyState
          title="No orders in this period"
          body={
            days === 90
              ? "Nothing was ordered in the last 90 days, which is the widest range this screen offers, so there is nothing to compare yet."
              : "Nothing was ordered in the range you picked, so there is nothing to compare. Widen the range and the six sources come back."
          }
          action={
            days === 90
              ? undefined
              : { label: "Look at the last 90 days", href: "/statistics?days=90" }
          }
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat
              label="Orders"
              value={String(orders.length)}
              detail={
                threads.length === 1
                  ? "1 conversation arrived as well"
                  : `${threads.length} conversations arrived as well`
              }
            />
            <Stat
              label="Revenue"
              value={formatTNDCompact(totalRevenue)}
              detail="Refused and refunded orders are left out"
              tone="money"
            />
            <Stat
              label="Average order"
              value={formatTNDCompact(
                countedForRevenue.length === 0 ? 0 : totalRevenue / countedForRevenue.length,
              )}
              detail={`Across ${countedForRevenue.length} orders, with the refused and refunded ones left out`}
            />
            <Stat
              label="Conversations that led to an order"
              value={`${convertedTotal} of ${threads.length}`}
              detail={
                threads.length === 0
                  ? "No conversation arrived in this period"
                  : `${((convertedTotal / threads.length) * 100).toFixed(0)} percent across all six sources`
              }
            />
          </div>

          <ChannelComparison rows={rows} periodLabel={`Last ${days} days`} />

          <div className="grid gap-3 xl:grid-cols-2">
            <PeriodBars
              title="Revenue over the period"
              hint={`One bar per ${bucketWord}, refused and refunded orders left out`}
              bars={revenueBars}
              tone="money"
              showValues={false}
              footer={`${formatTND(totalRevenue)} in total. The tallest bar is ${busiest.title}, at ${formatTND(busiest.revenue)}.`}
            />
            <PeriodBars
              title="Orders over the period"
              hint={`The same ${bucketWord}s as the revenue chart, counting every order including the refused ones`}
              bars={orderBars}
              tone="orders"
              showValues={orderBars.length <= 10}
              footer={`${orders.length} orders in total, an average of ${(orders.length / days).toFixed(1)} a day.`}
            />
          </div>

          <DeliveryByChannel
            rows={deliveryRows}
            worst={worstReturns}
            minimumOrders={RETURN_RATE_MINIMUM}
          />

          <Card>
            <p className="text-[13px] leading-relaxed text-muted">
              Every number on this screen is worked out from the orders and conversations held in
              Les Saveurs du Cap Bon, cut by the channel each request arrived on. A copy you can download and
              send to someone else is designed but not built, so there is nothing to export from
              here yet.{" "}
              <Link href="/orders" className="font-semibold text-primary hover:underline">
                Open the orders behind these figures
              </Link>
              .
            </p>
          </Card>
        </>
      )}
    </div>
  );
}
