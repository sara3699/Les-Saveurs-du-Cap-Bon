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

export const metadata = { title: "Team, Les Saveurs du Cap Bon" };

// The demo clock moves with the visit, so the workload is counted per request
// rather than frozen into the build.
export const dynamic = "force-dynamic";

type Params = Promise<Record<string, string | string[] | undefined>>;

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function count(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

const ROLE_COPY: Record<TeamRole, { label: string; can: string; short: string }> = {
  owner: {
    label: "Owner",
    can: "Sees everything in the workspace. Every conversation, every order, the money figures and the channel setup. Only the owner can add a person or take one off.",
    short: "Sees everything, and is the only one who can add a person or take one off.",
  },
  manager: {
    label: "Manager",
    can: "Assigns work and reads the reports. Sees every conversation and every order, and can pass any of them to someone else. Does not see billing, and cannot change what is connected.",
    short: "Assigns work, and sees every conversation, every order and the reports.",
  },
  agent: {
    label: "Agent",
    can: "Handles the conversations assigned to them, the customers behind those conversations, and the orders they own. Does not see the shop figures, and cannot pass work to another person.",
    short: "Handles the conversations assigned to them and the orders they own.",
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
      detail: `${contactName.get(conversation.contactId) ?? "Customer"}, last message ${timeAgo(conversation.lastMessageAt, DEMO_NOW)}`,
      channelId: resolved.channelId,
      account: resolved.accountLabel,
    };
  };

  const orderItem = (order: Order): ReassignItem => {
    const resolved = resolveSource(order.attributionId, index);
    return {
      id: order.id,
      label: `${order.reference}, ${formatTND(order.total)}`,
      detail: `${contactName.get(order.contactId) ?? "Customer"}, ${order.deliveryStatus === "preparing" ? "being prepared" : "on the way"}`,
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
        title="Team"
        subtitle={`${team.length} people, and what each one is carrying right now. Counted from the conversations, tasks and orders themselves.`}
        actions={<DemoChip />}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="People in the workspace"
          value={String(team.length)}
          detail={ROLE_ORDER.map((role) =>
            count(team.filter((m) => m.role === role).length, ROLE_COPY[role].label.toLowerCase()),
          ).join(", ")}
        />
        <Stat
          label="Open conversations"
          value={String(openConversations.length)}
          detail={`${looseConversations.length} with nobody assigned`}
        />
        <Stat
          label="Tasks not done"
          value={String(openTasks.length)}
          detail={`${count(overdueTasks.length, "task")} late`}
        />
        <Stat
          label="Orders in progress"
          value={String(liveOrders.length)}
          detail={`${formatTNDCompact(liveOrders.reduce((sum, o) => sum + o.total, 0))} being prepared or on the way`}
        />
      </div>

      <Card>
        <CardHead
          title="Workload right now"
          hint="Busiest person first. Work with nobody on it sits in the last row."
        />
        <div className="os-scroll">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="os-label pb-2.5 pr-3 text-left font-normal">Person</th>
                <th className="os-label pb-2.5 pr-3 text-left font-normal">Role</th>
                <th className="os-label pb-2.5 pr-3 text-right font-normal">Conversations</th>
                <th className="os-label pb-2.5 pr-3 text-right font-normal">Tasks</th>
                <th className="os-label pb-2.5 pr-3 text-right font-normal">Overdue</th>
                <th className="os-label pb-2.5 pr-3 text-right font-normal">Orders</th>
                <th className="os-label pb-2.5 text-right font-normal">In progress, TND</th>
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
                <td className="py-2.5 pr-3 text-[13px] font-semibold text-accent-ink">Nobody yet</td>
                <td className="py-2.5 pr-3 text-[13px] text-accent-ink">Not assigned</td>
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
          Every task in the demo data has a name on it, so the last row shows none. These figures
          are counted from the records in front of you, not from the counters saved on each member,
          which were written earlier and no longer agree.
        </p>
      </Card>

      <CallPerformance rows={callRows} />

      <section className="rounded-[var(--radius-card)] border border-accent-line bg-accent-soft p-4 sm:p-5">
        <CardHead
          title="Waiting for a name"
          hint={`${count(looseConversations.length, "open conversation")} and ${count(looseOrders.length, "order")} in progress have nobody on them. This is the part of the pile only you can hand out.`}
        />

        <div className="flex flex-wrap gap-1.5">
          <Link
            href={keep(undefined)}
            aria-current={source ? undefined : "true"}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
              source ? "border-accent-line bg-surface text-muted" : "border-primary bg-primary text-white"
            }`}
          >
            All sources
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
              title={source ? `Nothing from ${channel(source).label} is waiting` : "Every request has a name on it"}
              body={
                source
                  ? "Nothing that arrived on this source is sitting without an owner. Clear the filter to see the rest of the pile."
                  : "Every open conversation and every order in progress belongs to someone. Nothing needs handing out right now."
              }
              action={source ? { label: "Show every source", href: "/team" } : undefined}
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
            <span className="os-num">{filteredLoose.length - shownLoose.length}</span> more are
            waiting behind these, in the inbox and in the order list.
          </p>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold">
          <Link href="/inbox?assignee=none" className="text-primary hover:underline">
            See the unassigned conversations in the inbox
          </Link>
          <Link href="/orders?assignee=none" className="text-primary hover:underline">
            Open every unassigned order, finished ones too
          </Link>
        </div>

        <div className="mt-3">
          <ReassignControl
            items={shownLoose}
            options={options()}
            emptyLine={
              source
                ? `Nothing from ${channel(source).label} is waiting, so there is nothing to hand out from this filter.`
                : "Nothing is waiting for a name, so there is nothing to hand out."
            }
          />
        </div>
      </section>

      <Card>
        <CardHead
          title="What each role can see and do"
          hint="Three roles, and no way to build a fourth. What a person can reach follows from the role beside their name."
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
                    {held.length === 1 ? "person" : "people"}
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
        <h2 className="os-label">Person by person, busiest first</h2>
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
                    <Pill tone="accent">Carrying the most</Pill>
                  ) : null}
                </div>

                <p className="text-[12.5px] leading-relaxed text-muted">{ROLE_COPY[row.role].short}</p>

                <dl className="grid grid-cols-3 gap-2">
                  <Metric
                    label="Conversations"
                    value={String(row.conversations.length)}
                    note="still open"
                  />
                  <Metric
                    label="Tasks"
                    value={String(row.tasks.length)}
                    note={row.overdue > 0 ? `${row.overdue} late` : "none late"}
                    alert={row.overdue > 0}
                  />
                  <Metric
                    label="Orders"
                    value={String(row.orders.length)}
                    note={formatTND(row.orderValue)}
                  />
                </dl>

                <div>
                  <p className="os-label">Where the open conversations came from</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {row.mix.length === 0 ? (
                      <span className="text-[12px] text-muted">No open conversation right now.</span>
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
                  <span className="text-muted">Next thing due: </span>
                  {row.next ? (
                    <>
                      {row.next.title}
                      <span className={late ? "font-semibold text-danger" : "text-muted"}>
                        {late
                          ? `, was due ${timeAgo(row.next.dueAt, DEMO_NOW)}`
                          : `, due ${timeAgo(row.next.dueAt, DEMO_NOW)}`}
                      </span>
                    </>
                  ) : (
                    <span className="text-muted">nothing waiting.</span>
                  )}
                </p>

                <ReassignControl
                  items={row.conversations.map(conversationItem)}
                  options={options(row.id)}
                  emptyLine={`${row.name} has no open conversation to hand over.`}
                />
              </Card>
            );
          })}
        </div>
      </section>

      <p className="max-w-[80ch] text-xs text-muted">
        Adding a person, taking one off, and saving a move are designed but not built yet. Roles are
        fixed at owner, manager and agent, and nothing on this screen is sent to anybody. This is
        demo mode.
      </p>
    </div>
  );
}
