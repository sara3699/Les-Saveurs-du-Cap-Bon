import Link from "next/link";
import {
  AttentionPanel,
  ChannelHubPanel,
  ConversionPanel,
  DayChart,
  DeliveryPanel,
  SourcePanel,
  type AttentionItem,
} from "@/components/dashboard/panels";
import { OrdersTable } from "@/components/orders/OrdersTable";
import { Card, CardHead, DemoChip, PageHeader, Stat } from "@/components/ui/surfaces";
import { buildAttributionIndex, resolveSource } from "@/lib/domain/attribution";
import { CHANNEL_ORDER, channel } from "@/lib/domain/channels";
import { formatTNDCompact, isOverdue, timeAgo } from "@/lib/format";
import {
  deliverySplit,
  inLastDays,
  ordersByDay,
  returnRateByChannel,
  revenueOf,
  sinceStartOfDay,
  sourceRows,
  conversionRate,
  summarizeConversions,
} from "@/lib/metrics";
import { DEMO_NOW } from "@/lib/mock/time";
import { getRepositories } from "@/lib/repositories";
import { toOrderRow } from "@/lib/views";

export const metadata = { title: "Tableau de bord, Les Saveurs du Cap Bon" };

// The demo clock moves with the visit, so these pages are rendered per request
// rather than frozen into the build.
export const dynamic = "force-dynamic";

function greeting(now: Date): string {
  const hour = now.getHours();
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon après-midi";
  return "Bonsoir";
}

export default async function DashboardPage() {
  const repos = getRepositories();
  const [orders, contacts, team, conversionMetrics, connections, attributions, conversations, tasks] =
    await Promise.all([
      repos.orders.list(),
      repos.contacts.list(),
      repos.workspace.team(),
      repos.workspace.conversionMetrics(),
      repos.intégrations.list(),
      repos.workspace.attributions(),
      repos.conversations.list(),
      repos.workspace.tasks(),
    ]);

  const index = buildAttributionIndex(attributions, connections);
  const now = DEMO_NOW;

  const today = sinceStartOfDay(orders, now);
  const week = inLastDays(orders, 7, now);
  const month = inLastDays(orders, 30, now);
  const previousMonth = orders.filter((o) => {
    const at = new Date(o.placedAt).getTime();
    return at < now.getTime() - 30 * 86_400_000 && at >= now.getTime() - 60 * 86_400_000;
  });

  const channelOf = (order: (typeof orders)[number]) =>
    channel(resolveSource(order.attributionId, index).channelId).label;

  const rows = sourceRows(month, previousMonth, index);
  const bars = ordersByDay(orders, 7, now);
  const split = deliverySplit(month);
  const returns = returnRateByChannel(month, index)
    .filter((r) => r.orders >= 5)
    .sort((a, b) => b.rate - a.rate)[0] ?? null;

  const contactNames = new Map(contacts.map((c) => [c.id, c.name]));
  const teamNames = new Map(team.map((m) => [m.id, m.name]));
  const latest = orders
    .slice(0, 6)
    .map((o) => toOrderRow(o, index, { contacts: contactNames, team: teamNames }, now));

  const connectionByChannel = new Map(
    connections.filter((c) => !c.planned).map((c) => [c.channelId, c]),
  );
  const demand = CHANNEL_ORDER.map((channelId) => {
    const connection = connectionByChannel.get(channelId);
    const ordersOn = (set: typeof orders) =>
      set.filter((o) => resolveSource(o.attributionId, index).channelId === channelId).length;
    const waiting = conversations.filter(
      (c) =>
        resolveSource(c.attributionId, index).channelId === channelId &&
        c.status !== "resolved" &&
        c.unreadCount > 0,
    ).length;
    return {
      channelId,
      ordersToday: ordersOn(today),
      ordersThisWeek: ordersOn(week),
      waiting,
      connected: connection?.status === "connected",
      status: connection?.status ?? "not_connected",
      accountLabel: connection?.accountLabel ?? "Aucun compte connecté pour l'instant",
      eventsThisWeek: connection?.eventsThisWeek ?? 0,
    };
  });

  const conversionSummary = summarizeConversions(conversionMetrics);
  const conversionRows = team
    .map((member) => {
      const metric = conversionMetrics.find((entry) => entry.teamMemberId === member.id);
      if (!metric) return null;
      return {
        id: member.id,
        name: member.name,
        initials: member.initials,
        callsReceived: metric.callsReceived,
        customersReached: metric.customersReached,
        customersWon: metric.customersWon,
        customersRejected: metric.customersRejected,
        ordersPlaced: metric.ordersPlaced,
        revenue: metric.revenue,
        conversionRate: conversionRate(metric),
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort((a, b) => b.conversionRate - a.conversionRate);

  const unassigned = conversations.filter((c) => !c.assigneeId && c.status !== "resolved");
  const overdue = tasks.filter((t) => !t.completedAt && isOverdue(t.dueAt, now));
  const products = await repos.workspace.products();
  const lowStock = products.filter((p) => p.stock <= p.lowStockAt);
  const brokenConnections = connections.filter((c) => c.status === "error");

  const attention: AttentionItem[] = [];
  if (unassigned.length > 0) {
    const oldest = unassigned[unassigned.length - 1];
    attention.push({
      id: "att_unassigned",
      title: `${unassigned.length} demandes sans responsable`,
      détail: `La plus ancienne est arrivée ${timeAgo(oldest.lastMessageAt, now)}.`,
      href: "/inbox",
      severity: "error",
    });
  }
  if (overdue.length > 0) {
    attention.push({
      id: "att_overdue",
      title: `${overdue.length} suivis sont en retard`,
      détail: overdue
        .slice(0, 2)
        .map((t) => contactNames.get(t.contactId ?? "") ?? "Aucun client")
        .join(" et "),
      href: "/tasks",
      severity: "warning",
    });
  }
  if (lowStock.length > 0) {
    attention.push({
      id: "att_stock",
      title: `${lowStock[0].name} n'a plus que ${lowStock[0].stock} unités`,
      détail: `Il s'en est vendu ${lowStock[0].unitsSold} sur les deux derniers mois.`,
      href: "/products",
      severity: "warning",
    });
  }
  for (const broken of brokenConnections) {
    attention.push({
      id: `att_${broken.id}`,
      title: `${broken.accountLabel} ne reçoit plus de messages`,
      détail: broken.lastErrorMessage ?? "Ouvrez le connecteur pour voir ce qui a changé.",
      href: "/integrations",
      severity: "error",
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={`${greeting(now)}, ${team[0].name}`}
        subtitle={`Dernière commande ${timeAgo(orders[0].placedAt, now)}, depuis ${channelOf(orders[0])}. Les chiffres portent sur les 30 derniers jours.`}
        actions={
          <>
            <DemoChip />
            <Link
              href="/orders"
              className="rounded-[var(--radius-md)] bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hi"
            >
              Ouvrir les commandes
            </Link>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Commandes aujourd'hui" value={String(today.length)} détail={`${sinceStartOfDay(orders, now).filter((o) => o.paymentStatus === "paid").length} déjà payées`} />
        <Stat label="Commandes cette semaine" value={String(week.length)} détail={`${formatTNDCompact(revenueOf(week))} encaissés`} />
        <Stat label="Commandes ce mois-ci" value={String(month.length)} détail={`${previousMonth.length} sur les 30 jours précédents`} />
        <Stat
          label="Chiffre d'affaires ce mois-ci"
          value={formatTNDCompact(revenueOf(month))}
          détail={`Période précédente ${formatTNDCompact(revenueOf(previousMonth))}`}
          tone="money"
        />
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.4fr_1fr]">
        <SourcePanel rows={rows} periodLabel="30 derniers jours" />
        <AttentionPanel items={attention} />
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <DayChart bars={bars} />
        <DeliveryPanel split={split} worstReturns={returns} />
      </div>

      <ChannelHubPanel rows={demand} />

      <ConversionPanel summary={conversionSummary} rows={conversionRows} />

      <Card>
        <CardHead
          title="Dernières commandes"
          hint="La colonne source n'est jamais vide et n'indique jamais un vague « En ligne »"
          action={
            <Link href="/orders" className="text-xs font-semibold text-primary hover:underline">
              Voir toutes les {orders.length}
            </Link>
          }
        />
        <OrdersTable rows={latest} />
      </Card>
    </div>
  );
}
