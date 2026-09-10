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

export const metadata = { title: "Statistiques, Les Saveurs du Cap Bon" };

// The demo clock moves with the visit, so these pages are rendered per request
// rather than frozen into the build.
export const dynamic = "force-dynamic";

type Params = Promise<Record<string, string | string[] | undefined>>;

const DAY = 86_400_000;

/** A channel needs this many orders before its return rate is worth naming. */
const RETURN_RATE_MINIMUM = 10;

const PERIODS = [
  { value: "7", days: 7, label: "7 jours" },
  { value: "30", days: 30, label: "30 jours" },
  { value: "90", days: 90, label: "90 jours" },
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
    repos.intégrations.list(),
    repos.workspace.attributions(),
  ]);

  const index = buildAttributionIndex(attributions, connections);
  const now = DEMO_NOW;
  const startMs = now.getTime() - days * DAY;
  const rangeLabel = `du ${formatDate(new Date(startMs).toISOString())} au ${formatDate(now.toISOString())}`;

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
          ? `le ${formatDate(from.toISOString())}`
          : `du ${formatDate(from.toISOString())} au ${formatDate(to.toISOString())}`,
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
  const bucketWord = bucketDays === 1 ? "jour" : "semaine";

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Statistiques"
        subtitle={`Tous les chiffres ci-dessous couvrent les ${days} derniers jours, ${rangeLabel}.`}
        actions={
          <>
            <DemoChip />
            <span className="flex gap-1.5" role="group" aria-label="Période couverte par tous les chiffres de cette page">
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
          title="Aucune commande sur cette période"
          body={
            days === 90
              ? "Aucune commande n'a été passee sur les 90 derniers jours, la plage la plus large que cet écran propose, il n'y a donc rien a comparer pour l'instant."
              : "Aucune commande n'a été passee sur la plage choisie, il n'y a donc rien a comparer. Elargissez la plage et les six sources reviennent."
          }
          action={
            days === 90
              ? undefined
              : { label: "Voir les 90 derniers jours", href: "/statistics?days=90" }
          }
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat
              label="Commandes"
              value={String(orders.length)}
              détail={
                threads.length === 1
                  ? "1 conversation est aussi arrivée"
                  : `${threads.length} conversations sont aussi arrivées`
              }
            />
            <Stat
              label="Chiffre d'affaires"
              value={formatTNDCompact(totalRevenue)}
              détail="Les commandes refusees et remboursees sont exclues"
              tone="money"
            />
            <Stat
              label="Commande moyenne"
              value={formatTNDCompact(
                countedForRevenue.length === 0 ? 0 : totalRevenue / countedForRevenue.length,
              )}
              détail={`Sur ${countedForRevenue.length} commandes, les refusees et les remboursees exclues`}
            />
            <Stat
              label="Conversations qui ont mene a une commande"
              value={`${convertedTotal} sur ${threads.length}`}
              détail={
                threads.length === 0
                  ? "Aucune conversation n'est arrivée sur cette période"
                  : `${((convertedTotal / threads.length) * 100).toFixed(0)} pour cent sur les six sources`
              }
            />
          </div>

          <ChannelComparison rows={rows} periodLabel={`${days} derniers jours`} />

          <div className="grid gap-3 xl:grid-cols-2">
            <PeriodBars
              title="Chiffre d'affaires sur la période"
              hint={`Une barre par ${bucketWord}, commandes refusees et remboursees exclues`}
              bars={revenueBars}
              tone="money"
              showValues={false}
              footer={`${formatTND(totalRevenue)} au total. La barre la plus haute couvre ${busiest.title}, avec ${formatTND(busiest.revenue)}.`}
            />
            <PeriodBars
              title="Commandes sur la période"
              hint={`Les memes ${bucketWord}s que le graphique du chiffre d'affaires, toutes les commandes comptees, y compris les refusees`}
              bars={orderBars}
              tone="orders"
              showValues={orderBars.length <= 10}
              footer={`${orders.length} commandes au total, soit une moyenne de ${(orders.length / days).toFixed(1)} par jour.`}
            />
          </div>

          <DeliveryByChannel
            rows={deliveryRows}
            worst={worstReturns}
            minimumOrders={RETURN_RATE_MINIMUM}
          />

          <Card>
            <p className="text-[13px] leading-relaxed text-muted">
              Chaque chiffre de cet écran est calcule a partir des commandes et des conversations
              enregistrees dans Les Saveurs du Cap Bon, decoupees par le canal sur lequel chaque demande est
              arrivée. Une copie a telecharger et a envoyer a quelqu'un d'autre est prévue mais pas
              construite, il n'y a donc rien a exporter d'ici pour l'instant.{" "}
              <Link href="/orders" className="font-semibold text-primary hover:underline">
                Ouvrir les commandes derriere ces chiffres
              </Link>
              .
            </p>
          </Card>
        </>
      )}
    </div>
  );
}
