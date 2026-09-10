import Link from "next/link";
import { ReassignControl, type ReassignItem } from "@/components/team/ReassignControl";
import { ChannelDot, Pill, SourceBadge } from "@/components/ui/badges";
import { CallPerformance } from "@/components/team/CallPerformance";
import { Card, CardHead, DemoChip, EmptyState, PageHeader, Stat } from "@/components/ui/surfaces";
import { buildAttributionIndex, resolveSource } from "@/lib/domain/attribution";
import { CHANNEL_ORDER, channel } from "@/lib/domain/channels";
import type { ChannelId, Conversation, Order, Task, TeamRole } from "@/lib/domain/types";
import { formatTND, formatTNDCompact, isOverdue, timeAgo } from "@/lib/format";
import { DEMO_NOW } from "@/lib/mock/time";
import { getRepositories } from "@/lib/repositories";
import { currentSession } from "@/lib/session";

export const metadata = { title: "Équipe, Les Saveurs du Cap Bon" };

// The demo clock moves with the visit, so the workload is counted per request
// rather than frozen into the build.
export const dynamic = "force-dynamic";

type Params = Promise<Record<string, string | string[] | undefined>>;

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

// French adjectives agree with the noun, so a plural that is not the singular
// plus an "s" is passed in rather than built.
function count(n: number, word: string, plural?: string): string {
  return `${n} ${n === 1 ? word : (plural ?? `${word}s`)}`;
}

const ROLE_COPY: Record<TeamRole, { label: string; can: string; short: string }> = {
  owner: {
    label: "Propriétaire",
    can: "Voit tout dans l'espace de travail. Chaque conversation, chaque commande, les chiffres et la configuration des canaux. Seul le propriétaire peut ajouter une personne ou en retirer une.",
    short: "Voit tout, et reste la seule personne à pouvoir ajouter ou retirer quelqu'un.",
  },
  manager: {
    label: "Responsable",
    can: "Attribue le travail et lit les rapports. Voit chaque conversation et chaque commande, et peut en passer n'importe laquelle à quelqu'un d'autre. Ne voit pas la facturation, et ne peut pas modifier ce qui est connecté.",
    short: "Attribue le travail, et voit chaque conversation, chaque commande et les rapports.",
  },
  agent: {
    label: "Agent",
    can: "Traite les conversations qui lui sont attribuées, les clients derrière ces conversations, et les commandes dont il est responsable. Ne voit pas les chiffres de la boutique, et ne peut pas passer du travail à une autre personne.",
    short: "Traite les conversations qui lui sont attribuées et les commandes dont il est responsable.",
  },
};

const ROLE_ORDER: TeamRole[] = ["owner", "manager", "agent"];

interface Workload {
  id: string;
  name: string;
  initials: string;
  role: TeamRole;
  conversations: Conversation[];
  tasks: Task[];
  orders: Order[];
  overdue: number;
  orderValue: number;
  mix: { channelId: ChannelId; count: number }[];
  next: Task | null;
  score: number;
}

function Metric({
  label,
  value,
  note,
  alert = false,
}: {
  label: string;
  value: string;
  note: string;
  alert?: boolean;
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-line bg-surface-2 px-2.5 py-2">
      <dt className="os-label">{label}</dt>
      <dd className={`os-num mt-1.5 text-[20px] font-bold leading-none ${alert ? "text-danger" : ""}`}>
        {value}
      </dd>
      <dd className="mt-1.5 text-[11px] text-muted">{note}</dd>
    </div>
  );
}

export default async function TeamPage({ searchParams }: { searchParams: Params }) {
  const params = await searchParams;
  // A source that is not one of the six is ignored rather than trusted, so a
  // hand-typed address cannot ask the screen for a channel that does not exist.
  const requested = one(params.source) as ChannelId | undefined;
  const source = requested && CHANNEL_ORDER.includes(requested) ? requested : undefined;

  // Only a real signed in account may write a call. A demonstration visit gets
  // the same screen, and the database refuses its writes anyway.
  const session = await currentSession();
  const canWrite = session?.canWrite === true;

  const repos = getRepositories();
  const [team, conversionMetrics, conversations, tasks, liveOrders, contacts, connections, attributions] =
    await Promise.all([
      repos.workspace.team(),
      repos.workspace.conversionMetrics(),
      repos.conversations.list(),
      repos.workspace.tasks(),
      repos.orders.list({ deliveryStatuses: ["preparing", "dispatched"] }),
      repos.contacts.list(),
      repos.integrations.list(),
      repos.workspace.attributions(),
    ]);

  const index = buildAttributionIndex(attributions, connections);
  const contactName = new Map(contacts.map((c) => [c.id, c.name]));

  // Workload is counted from the records themselves. The counters stored on a
  // member row are older and disagree, which is exactly why they are not used.
  const openConversations = conversations.filter((c) => c.status !== "resolved");
  const openTasks = tasks.filter((t) => !t.completedAt);
  const overdueTasks = openTasks.filter((t) => isOverdue(t.dueAt, DEMO_NOW));

  const rows: Workload[] = team
    .map((member) => {
      const mine = openConversations.filter((c) => c.assigneeId === member.id);
      const myTasks = openTasks
        .filter((t) => t.assigneeId === member.id)
        .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
      const myOrders = liveOrders.filter((o) => o.assigneeId === member.id);

      const counted = new Map<ChannelId, number>();
      for (const conversation of mine) {
        const id = resolveSource(conversation.attributionId, index).channelId;
        counted.set(id, (counted.get(id) ?? 0) + 1);
      }

      return {
        id: member.id,
        name: member.name,
        initials: member.initials,
        role: member.role,
        conversations: mine,
        tasks: myTasks,
        orders: myOrders,
        overdue: myTasks.filter((t) => isOverdue(t.dueAt, DEMO_NOW)).length,
        orderValue: myOrders.reduce((sum, o) => sum + o.total, 0),
        mix: CHANNEL_ORDER.filter((id) => counted.has(id)).map((id) => ({
          channelId: id,
          count: counted.get(id) ?? 0,
        })),
        next: myTasks[0] ?? null,
        score: mine.length + myTasks.length + myOrders.length,
      };
    })
    .sort((a, b) => b.score - a.score || b.overdue - a.overdue || a.name.localeCompare(b.name));

  const looseConversations = openConversations.filter((c) => !c.assigneeId);
  const looseOrders = liveOrders.filter((o) => !o.assigneeId);
  const looseValue = looseOrders.reduce((sum, o) => sum + o.total, 0);
  // Counted rather than written in as zero, so the last row stays true if a task
  // ever arrives without a name on it.
  const looseTasks = openTasks.filter((t) => !t.assigneeId);
  const looseOverdue = looseTasks.filter((t) => isOverdue(t.dueAt, DEMO_NOW));

  const conversationItem = (conversation: Conversation): ReassignItem => {
    const resolved = resolveSource(conversation.attributionId, index);
    return {
      id: conversation.id,
      label: conversation.subject,
      detail: `${contactName.get(conversation.contactId) ?? "Client"}, dernier message ${timeAgo(conversation.lastMessageAt, DEMO_NOW)}`,
      channelId: resolved.channelId,
      account: resolved.accountLabel,
    };
  };

  const orderItem = (order: Order): ReassignItem => {
    const resolved = resolveSource(order.attributionId, index);
    return {
      id: order.id,
      label: `${order.reference}, ${formatTND(order.total)}`,
      detail: `${contactName.get(order.contactId) ?? "Client"}, ${order.deliveryStatus === "preparing" ? "en préparation" : "en route"}`,
      channelId: resolved.channelId,
      account: resolved.accountLabel,
    };
  };

  const looseItems = [
    ...looseConversations.map(conversationItem),
    ...looseOrders.map(orderItem),
  ];
  const filteredLoose = looseItems.filter((item) => !source || item.channelId === source);
  const shownLoose = filteredLoose.slice(0, 10);

  const options = (exclude?: string) =>
    team
      .filter((m) => m.id !== exclude)
      .map((m) => ({ id: m.id, name: m.name, role: ROLE_COPY[m.role].label }));

  const keep = (next: ChannelId | undefined) => (next ? `/team?source=${next}` : "/team");

  // The pill only goes on a clear leader. Two people on the same load would both
  // be "carrying the most", which tells the owner nothing.
  const topScore = rows[0]?.score ?? 0;
  const clearLeader = topScore > 0 && rows.filter((r) => r.score === topScore).length === 1;
  const callRows = team
    .map((member) => {
      const metric = conversionMetrics.find((entry) => entry.teamMemberId === member.id);
      return metric ? { memberId: member.id, name: member.name, metric } : null;
    })
    .filter((row): row is { memberId: string; name: string; metric: (typeof conversionMetrics)[number] } => row !== null);



  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Équipe"
        subtitle={`${team.length} personnes, et ce que chacune porte en ce moment. Compté à partir des conversations, des tâches et des commandes elles-mêmes.`}
        actions={<DemoChip />}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Personnes dans l'espace de travail"
          value={String(team.length)}
          detail={ROLE_ORDER.map((role) =>
            count(team.filter((m) => m.role === role).length, ROLE_COPY[role].label.toLowerCase()),
          ).join(", ")}
        />
        <Stat
          label="Conversations ouvertes"
          value={String(openConversations.length)}
          detail={`${looseConversations.length} sans responsable`}
        />
        <Stat
          label="Tâches non terminées"
          value={String(openTasks.length)}
          detail={`${count(overdueTasks.length, "tâche")} en retard`}
        />
        <Stat
          label="Commandes en cours"
          value={String(liveOrders.length)}
          detail={`${formatTNDCompact(liveOrders.reduce((sum, o) => sum + o.total, 0))} en préparation ou en route`}
        />
      </div>

      <Card>
        <CardHead
          title="La charge en ce moment"
          hint="La personne la plus chargée en premier. Le travail sans personne dessus se trouve dans la dernière ligne."
        />
        <div className="os-scroll">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="os-label pb-2.5 pr-3 text-left font-normal">Personne</th>
                <th className="os-label pb-2.5 pr-3 text-left font-normal">Rôle</th>
                <th className="os-label pb-2.5 pr-3 text-right font-normal">Conversations</th>
                <th className="os-label pb-2.5 pr-3 text-right font-normal">Tâches</th>
                <th className="os-label pb-2.5 pr-3 text-right font-normal">En retard</th>
                <th className="os-label pb-2.5 pr-3 text-right font-normal">Commandes</th>
                <th className="os-label pb-2.5 text-right font-normal">En cours, TND</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-line hover:bg-surface-2">
                  <td className="py-2.5 pr-3 text-[13px] font-semibold">{row.name}</td>
                  <td className="py-2.5 pr-3 text-[13px] text-muted">{ROLE_COPY[row.role].label}</td>
                  <td className="os-num py-2.5 pr-3 text-right text-[12.5px]">{row.conversations.length}</td>
                  <td className="os-num py-2.5 pr-3 text-right text-[12.5px]">{row.tasks.length}</td>
                  <td
                    className={`os-num py-2.5 pr-3 text-right text-[12.5px] ${row.overdue > 0 ? "font-semibold text-danger" : "text-faint"}`}
                  >
                    {row.overdue}
                  </td>
                  <td className="os-num py-2.5 pr-3 text-right text-[12.5px]">{row.orders.length}</td>
                  <td className="os-num py-2.5 text-right text-[12.5px]">
                    {formatTND(row.orderValue, { withCurrency: false })}
                  </td>
                </tr>
              ))}
              <tr className="border-t border-accent-line bg-accent-soft">
                <td className="py-2.5 pr-3 text-[13px] font-semibold text-accent-ink">Personne pour l&apos;instant</td>
                <td className="py-2.5 pr-3 text-[13px] text-accent-ink">Non attribué</td>
                <td className="os-num py-2.5 pr-3 text-right text-[12.5px] text-accent-ink">
                  {looseConversations.length}
                </td>
                <td className="os-num py-2.5 pr-3 text-right text-[12.5px] text-accent-ink">
                  {looseTasks.length}
                </td>
                <td className="os-num py-2.5 pr-3 text-right text-[12.5px] text-accent-ink">
                  {looseOverdue.length}
                </td>
                <td className="os-num py-2.5 pr-3 text-right text-[12.5px] text-accent-ink">
                  {looseOrders.length}
                </td>
                <td className="os-num py-2.5 text-right text-[12.5px] text-accent-ink">
                  {formatTND(looseValue, { withCurrency: false })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 max-w-[80ch] text-xs text-muted">
          Chaque tâche des données d&apos;exemple porte un nom, donc la dernière ligne n&apos;en
          affiche aucune. Ces chiffres sont comptés à partir des enregistrements que vous avez sous
          les yeux, pas à partir des compteurs enregistrés sur chaque membre, qui ont été écrits
          plus tôt et ne concordent plus.
        </p>
      </Card>

      <CallPerformance rows={callRows} canWrite={canWrite} />

      <section className="rounded-[var(--radius-card)] border border-accent-line bg-accent-soft p-4 sm:p-5">
        <CardHead
          title="En attente d'un nom"
          hint={`${count(looseConversations.length, "conversation ouverte", "conversations ouvertes")} et ${count(looseOrders.length, "commande")} en cours n'ont personne dessus. C'est la partie de la pile que personne d'autre que vous ne peut distribuer.`}
        />

        <div className="flex flex-wrap gap-1.5">
          <Link
            href={keep(undefined)}
            aria-current={source ? undefined : "true"}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
              source ? "border-accent-line bg-surface text-muted" : "border-primary bg-primary text-white"
            }`}
          >
            Toutes les sources
          </Link>
          {CHANNEL_ORDER.map((id) => {
            const active = source === id;
            return (
              <Link
                key={id}
                href={keep(active ? undefined : id)}
                aria-current={active ? "true" : undefined}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  active ? "border-primary bg-primary text-white" : "border-accent-line bg-surface text-muted"
                }`}
              >
                <ChannelDot channelId={id} size={7} />
                {channel(id).label}
              </Link>
            );
          })}
        </div>

        <div className="mt-3">
          {shownLoose.length === 0 ? (
            <EmptyState
              title={source ? `Rien n'attend du côté de ${channel(source).label}` : "Chaque demande porte un nom"}
              body={
                source
                  ? "Rien de ce qui est arrivé par cette source n'est sans responsable. Retirez le filtre pour voir le reste de la pile."
                  : "Chaque conversation ouverte et chaque commande en cours appartient à quelqu'un. Il n'y a rien à distribuer en ce moment."
              }
              action={source ? { label: "Afficher toutes les sources", href: "/team" } : undefined}
            />
          ) : (
            <ul className="flex flex-col gap-1.5">
              {shownLoose.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-md)] border border-line bg-surface px-3 py-2"
                >
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold">{item.label}</span>
                    <span className="block text-[11.5px] text-muted">{item.detail}</span>
                  </span>
                  <SourceBadge channelId={item.channelId} account={item.account} size="sm" />
                </li>
              ))}
            </ul>
          )}
        </div>

        {filteredLoose.length > shownLoose.length ? (
          <p className="mt-2 text-xs text-accent-ink">
            <span className="os-num">{filteredLoose.length - shownLoose.length}</span> autres
            attendent derrière celles-ci, dans la boîte de réception et dans la liste des commandes.
          </p>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold">
          <Link href="/inbox?assignee=none" className="text-primary hover:underline">
            Voir les conversations non attribuées dans la boîte de réception
          </Link>
          <Link href="/orders?assignee=none" className="text-primary hover:underline">
            Ouvrir toutes les commandes non attribuées, y compris celles qui sont terminées
          </Link>
        </div>

        <div className="mt-3">
          <ReassignControl
            items={shownLoose}
            options={options()}
            emptyLine={
              source
                ? `Rien n'attend du côté de ${channel(source).label}, il n'y a donc rien à distribuer depuis ce filtre.`
                : "Rien n'attend un nom, il n'y a donc rien à distribuer."
            }
          />
        </div>
      </section>

      <Card>
        <CardHead
          title="Ce que chaque rôle voit et peut faire"
          hint="Trois rôles, et aucun moyen d'en créer un quatrième. Ce qu'une personne peut atteindre découle du rôle indiqué à côté de son nom."
        />
        <div className="grid gap-3 md:grid-cols-3">
          {ROLE_ORDER.map((role) => {
            const held = team.filter((m) => m.role === role);
            return (
              <div key={role} className="rounded-[var(--radius-md)] border border-line bg-surface-2 p-3">
                <div className="flex items-center gap-2">
                  <Pill tone={role === "owner" ? "primary" : "muted"}>{ROLE_COPY[role].label}</Pill>
                  <span className="text-[11px] text-muted">
                    <span className="os-num">{held.length}</span>{" "}
                    {held.length === 1 ? "personne" : "personnes"}
                  </span>
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-muted">{ROLE_COPY[role].can}</p>
                <p className="mt-2 text-[12px] font-semibold">
                  {held.map((m) => m.name).join(", ")}
                </p>
              </div>
            );
          })}
        </div>
      </Card>

      <section className="flex flex-col gap-3">
        <h2 className="os-label">Personne par personne, la plus chargée en premier</h2>
        <div className="grid gap-3 lg:grid-cols-2">
          {rows.map((row) => {
            const late = row.next ? isOverdue(row.next.dueAt, DEMO_NOW) : false;
            return (
              <Card key={row.id} className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      aria-hidden
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-primary-soft font-display text-[13px] font-bold text-primary"
                    >
                      {row.initials}
                    </span>
                    <span>
                      <span className="block text-[15px] font-semibold leading-tight">{row.name}</span>
                      <span className="block text-[11.5px] text-muted">{ROLE_COPY[row.role].label}</span>
                    </span>
                  </div>
                  {clearLeader && row.score === topScore ? (
                    <Pill tone="accent">Charge la plus lourde</Pill>
                  ) : null}
                </div>

                <p className="text-[12.5px] leading-relaxed text-muted">{ROLE_COPY[row.role].short}</p>

                <dl className="grid grid-cols-3 gap-2">
                  <Metric
                    label="Conversations"
                    value={String(row.conversations.length)}
                    note="encore ouvertes"
                  />
                  <Metric
                    label="Tâches"
                    value={String(row.tasks.length)}
                    note={row.overdue > 0 ? `${row.overdue} en retard` : "aucune en retard"}
                    alert={row.overdue > 0}
                  />
                  <Metric
                    label="Commandes"
                    value={String(row.orders.length)}
                    note={formatTND(row.orderValue)}
                  />
                </dl>

                <div>
                  <p className="os-label">D&apos;où viennent les conversations ouvertes</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {row.mix.length === 0 ? (
                      <span className="text-[12px] text-muted">Aucune conversation ouverte en ce moment.</span>
                    ) : (
                      row.mix.map((entry) => (
                        <span
                          key={entry.channelId}
                          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-2 py-0.5 text-[11.5px] font-semibold"
                        >
                          <ChannelDot channelId={entry.channelId} size={7} />
                          {channel(entry.channelId).label}
                          <span className="os-num text-muted">{entry.count}</span>
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <p className="text-[12.5px]">
                  <span className="text-muted">Prochaine échéance : </span>
                  {row.next ? (
                    <>
                      {row.next.title}
                      <span className={late ? "font-semibold text-danger" : "text-muted"}>
                        {late
                          ? `, était due ${timeAgo(row.next.dueAt, DEMO_NOW)}`
                          : `, échéance ${timeAgo(row.next.dueAt, DEMO_NOW)}`}
                      </span>
                    </>
                  ) : (
                    <span className="text-muted">rien en attente.</span>
                  )}
                </p>

                <ReassignControl
                  items={row.conversations.map(conversationItem)}
                  options={options(row.id)}
                  emptyLine={`${row.name} n'a aucune conversation ouverte à transmettre.`}
                />
              </Card>
            );
          })}
        </div>
      </section>

      <p className="max-w-[80ch] text-xs text-muted">
        Ajouter une personne, en retirer une et enregistrer un transfert sont conçus mais pas encore
        construits. Les rôles sont fixés à propriétaire, responsable et agent, et rien sur cet écran
        n&apos;est envoyé à qui que ce soit. Ceci est le mode démonstration.
      </p>
    </div>
  );
}
