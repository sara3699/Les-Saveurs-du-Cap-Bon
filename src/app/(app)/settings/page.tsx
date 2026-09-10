import Link from "next/link";
import { ChannelDot, ConnectionPill, Pill, SourceBadge } from "@/components/ui/badges";
import { Card, CardHead, DemoChip, EmptyState, PageHeader } from "@/components/ui/surfaces";
import { CHANNEL_ORDER, channel } from "@/lib/domain/channels";
import type {
  ChannelConnection,
  ChannelId,
  ConnectionStatus,
  Order,
  TeamRole,
} from "@/lib/domain/types";
import { formatDateTime, formatTND, isOverdue, timeAgo } from "@/lib/format";
import { STORE } from "@/lib/mock/core";
import { DEMO_NOW } from "@/lib/mock/time";
import { getRepositories } from "@/lib/repositories";

export const metadata = { title: "Settings, Les Saveurs du Cap Bon" };

// The demo clock moves with the visit, so what is waiting right now is counted
// per request rather than frozen into the build.
export const dynamic = "force-dynamic";

const SECTIONS = [
  { id: "workspace", label: "Workspace" },
  { id: "regional", label: "Regional" },
  { id: "notifications", label: "Notifications" },
  { id: "data", label: "Data and privacy" },
  { id: "accounts", label: "Connected accounts" },
];

const ROLE_COPY: Record<TeamRole, { label: string; can: string; settings: string }> = {
  owner: {
    label: "Owner",
    can: "Sees the whole shop, the money figures included, and is the only person who can add someone or take them off.",
    settings: "Changes them, on the day they can be changed",
  },
  manager: {
    label: "Manager",
    can: "Assigns work and reads the reports. Sees every conversation and every order, but not the billing.",
    settings: "Reads them",
  },
  agent: {
    label: "Agent",
    can: "Works on the conversations and the orders given to them, and sees nothing outside that.",
    settings: "No access",
  },
};

const NOTIFY_EVENTS = [
  {
    id: "silent",
    title: "A channel stops bringing anything in",
    body: "WhatsApp, Instagram, Facebook, Google or the form on your site goes quiet when it should not. This is the one worth interrupting your day for, because nothing queues up while it is broken.",
    reaches: "You, as soon as it is noticed",
  },
  {
    id: "waiting",
    title: "A request has sat two hours with nobody on it",
    body: "Someone wrote in, nobody took it, and two hours have gone by. Counted from the last message on the request, not from when one of you first opened the list.",
    reaches: "You and your manager",
  },
  {
    id: "overdue",
    title: "A follow up goes past its time",
    body: "A call or a price to send that was promised for today is still not done.",
    reaches: "The person who owns it, then you the next morning",
  },
  {
    id: "stock",
    title: "A product falls to its low stock level",
    body: "The level is set on each product, so something that sells thirty a month can warn earlier than something that sells twelve a year.",
    reaches: "You",
  },
];

const STORED = [
  { label: "Name", why: "So a reply can open with the right name." },
  { label: "Phone number", why: "The delivery company asks for it, and most customers here answer faster on the phone than by email." },
  { label: "Email", why: "Kept only when the customer gave one, and used for the order confirmation." },
  { label: "City", why: "Sets the delivery fee and how many days the delivery takes." },
  { label: "Messages, in and out", why: "So whoever answers next can read what was already promised." },
  { label: "Orders and what was in them", why: "Your record of the sale, and the base for every figure on Statistics." },
  { label: "Notes your team writes", why: "What was agreed on the phone, kept where the next person will look." },
  { label: "The channel the customer arrived on", why: "So a WhatsApp customer stays a WhatsApp customer, and you can see which channel pays for itself." },
];

const RETENTION = [
  {
    label: "Messages",
    value: "24 months",
    why: "Long enough to look up what was promised last season, short enough that old chatter does not sit here for good.",
  },
  {
    label: "Orders and invoices",
    value: "10 years",
    why: "Your books have to be kept, so an order stays even after the customer behind it is removed.",
  },
  {
    label: "Photos and files sent in a message",
    value: "12 months",
    why: "These are the heaviest thing stored and the least often opened again.",
  },
  {
    label: "Contacts",
    value: "Until the customer asks to be removed",
    why: "A customer who has not written for a year is still a customer, so nothing is deleted on a timer.",
  },
];

const DELETION_REMOVES = [
  "Name, phone number, email and city",
  "Every message in every conversation with them, on every channel",
  "The notes your team wrote about them",
  "Their place in the pipeline, their tags and their lead score",
];

const DELETION_KEEPS = [
  "The order itself, its date, its amount and what was in it, with the customer replaced by a reference number, because your books have to add up",
  "The count of orders on each channel, which is a number and no longer a person",
];

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

function Avatar({ initials }: { initials: string }) {
  return (
    <span
      aria-hidden
      className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary-soft text-[11px] font-bold text-primary"
    >
      {initials}
    </span>
  );
}

function SettingRow({
  label,
  value,
  note,
  state,
  mono = false,
}: {
  label: string;
  value: string;
  note: string;
  state?: string;
  mono?: boolean;
}) {
  return (
    <div className="grid gap-1.5 border-t border-line py-3 first:border-t-0 first:pt-0 last:pb-0 sm:grid-cols-[150px_1fr] sm:gap-4">
      <dt className="os-label sm:pt-1">{label}</dt>
      <dd className="flex flex-col gap-1.5">
        <span className="flex flex-wrap items-center gap-2">
          <span className={`text-[14px] font-semibold ${mono ? "os-num" : ""}`}>{value}</span>
          {state ? <Pill tone="muted">{state}</Pill> : null}
        </span>
        <span className="max-w-[62ch] text-[12.5px] leading-relaxed text-muted">{note}</span>
      </dd>
    </div>
  );
}

function Placeholder({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-auto rounded-[var(--radius-sm)] border border-line bg-surface-2 px-3 py-2 text-[12px] leading-relaxed text-muted">
      <span className="font-semibold text-ink">Written down, not enforced yet. </span>
      {children}
    </p>
  );
}

interface ChannelSummary {
  channelId: ChannelId;
  accounts: number;
  statuses: ConnectionStatus[];
  lastEventAt: string | null;
  thisWeek: number;
  planned: number;
}

function summarise(connections: ChannelConnection[]): ChannelSummary[] {
  return CHANNEL_ORDER.map((channelId) => {
    const mine = connections.filter((c) => c.channelId === channelId);
    const stamps = mine
      .map((c) => c.lastEventAt)
      .filter((s): s is string => Boolean(s))
      .sort();
    return {
      channelId,
      accounts: mine.length,
      statuses: [...new Set(mine.map((c) => c.status))],
      lastEventAt: stamps.length ? stamps[stamps.length - 1] : null,
      thisWeek: mine.reduce((sum, c) => sum + c.eventsThisWeek, 0),
      planned: mine.filter((c) => c.planned).length,
    };
  }).filter((row) => row.accounts > 0);
}

export default async function SettingsPage() {
  const repos = getRepositories();
  const [team, connections, conversations, tasks, products, orders] = await Promise.all([
    repos.workspace.team(),
    repos.integrations.list(),
    repos.conversations.list(),
    repos.workspace.tasks(),
    repos.workspace.products(),
    repos.orders.list(),
  ]);

  const roleCount = (role: TeamRole) => team.filter((m) => m.role === role).length;
  const teamShape = [
    plural(roleCount("owner"), "owner", "owners"),
    plural(roleCount("manager"), "manager", "managers"),
    plural(roleCount("agent"), "agent", "agents"),
  ].join(", ");

  const receiving = connections.filter((c) => c.status === "connected");
  const attention = connections.filter(
    (c) => !c.planned && (c.status === "setup_required" || c.status === "warning" || c.status === "error"),
  );
  const planned = connections.filter((c) => c.planned);
  const byChannel = summarise(connections);

  // The worked example is a real order rather than a written one, so the three
  // decimals shown here are the same three decimals the order list prints.
  const newestFirst = [...orders].sort(
    (a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime(),
  );
  const moneyExample: Order | undefined =
    newestFirst.find((o) => o.items.length === 1 && o.items[0].quantity === 1 && o.deliveryFee > 0) ??
    newestFirst.find((o) => o.items.length === 1) ??
    newestFirst[0];

  // The four events below are counted from the same records the rest of the
  // product reads, so the screen cannot promise a notice it could not send.
  const twoHours = 2 * 60 * 60 * 1000;
  const unattended = conversations
    .filter(
      (c) =>
        !c.assigneeId &&
        c.status !== "resolved" &&
        DEMO_NOW.getTime() - new Date(c.lastMessageAt).getTime() > twoHours,
    )
    .sort((a, b) => new Date(a.lastMessageAt).getTime() - new Date(b.lastMessageAt).getTime());
  const overdue = tasks.filter((t) => !t.completedAt && isOverdue(t.dueAt, DEMO_NOW));
  const lowStock = products.filter((p) => p.stock <= p.lowStockAt);
  const silent = connections.filter(
    (c) => !c.planned && (c.status === "error" || c.status === "warning"),
  );
  const silentChannels = [...new Set(silent.map((c) => c.channelId))];

  const live: {
    id: string;
    title: string;
    detail: string;
    href: string;
    linkLabel: string;
    channelIds: ChannelId[];
  }[] = [];

  if (silent.length > 0) {
    live.push({
      id: "silent",
      title: `${plural(silent.length, "channel is", "channels are")} not receiving properly`,
      detail:
        "While a channel is in this state, what a customer sends can be lost, and they get no sign that anything went wrong.",
      href: "/integrations",
      linkLabel: "See what broke",
      channelIds: silentChannels,
    });
  }
  if (unattended.length > 0) {
    live.push({
      id: "waiting",
      title: `${plural(unattended.length, "request", "requests")} waiting more than two hours with nobody assigned`,
      detail: `The oldest one last had a message ${timeAgo(unattended[0].lastMessageAt, DEMO_NOW)}, and still has nobody on it.`,
      href: "/inbox?assignee=none",
      linkLabel: "Open the inbox",
      channelIds: [],
    });
  }
  if (overdue.length > 0) {
    live.push({
      id: "overdue",
      title: `${plural(overdue.length, "follow up", "follow ups")} now overdue`,
      detail: "Each one has a person against it already, so this is a nudge rather than a new job.",
      href: "/tasks",
      linkLabel: "Open the tasks",
      channelIds: [],
    });
  }
  if (lowStock.length > 0) {
    live.push({
      id: "stock",
      title: `${plural(lowStock.length, "product is", "products are")} at or below the low stock level`,
      detail: `${lowStock
        .slice(0, 2)
        .map((p) => p.name)
        .join(", ")}${lowStock.length > 2 ? ", and others" : ""}.`,
      href: "/products",
      linkLabel: "Open the products",
      channelIds: [],
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Settings"
        subtitle="How this workspace behaves. Each section says what is set today, and what stays fixed until sign-in and the database arrive."
        actions={<DemoChip />}
      />

      <nav aria-label="Sections on this screen" className="flex flex-wrap gap-1.5">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-muted hover:border-line-strong hover:text-ink"
          >
            {s.label}
          </a>
        ))}
      </nav>

      {/* Workspace ------------------------------------------------------ */}
      <section id="workspace" aria-labelledby="workspace-heading" className="flex flex-col gap-3">
        <h2 id="workspace-heading" className="os-label">Workspace</h2>

        <Card>
          <CardHead
            title="Name and members"
            hint={`The shop this workspace belongs to, and the ${plural(team.length, "person", "people")} who can open it.`}
          />
          <dl className="flex flex-col">
            {/* The name comes from the shop record the shell reads, so this row
                and the name in the top corner can never drift apart. */}
            <SettingRow
              label="Workspace name"
              value={STORE.name}
              state="Not editable yet"
              note="The name of the shop this workspace holds the orders for. It is the same name the top corner of every screen shows. It becomes editable with the sign-in step, and you will be the only person able to change it."
            />
            <SettingRow
              label="People"
              value={plural(team.length, "person", "people")}
              note={`${teamShape}. Nobody outside this list can see the workspace, and there is no public link to it.`}
              mono
            />
          </dl>

          <div className="os-scroll mt-4">
            <table className="w-full min-w-[760px] border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-line">
                  <th className="os-label pb-2 font-normal">Person</th>
                  <th className="os-label pb-2 font-normal">Role</th>
                  <th className="os-label pb-2 font-normal">What this role can do</th>
                  <th className="os-label pb-2 font-normal">These settings</th>
                </tr>
              </thead>
              <tbody>
                {team.map((member) => {
                  const role = ROLE_COPY[member.role];
                  return (
                    <tr key={member.id} className="border-b border-line align-top last:border-b-0">
                      <td className="py-3 pr-4">
                        <span className="flex items-center gap-2 font-semibold">
                          <Avatar initials={member.initials} />
                          {member.name}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <Pill tone={member.role === "owner" ? "primary" : "muted"}>{role.label}</Pill>
                      </td>
                      <td className="max-w-[42ch] py-3 pr-4 text-muted">{role.can}</td>
                      <td className="py-3 text-muted">{role.settings}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="mt-3 max-w-[74ch] rounded-[var(--radius-sm)] border border-line bg-surface-2 px-3 py-2 text-[12.5px] leading-relaxed text-muted">
            <span className="font-semibold text-ink">Inviting someone comes with the sign-in step. </span>
            There is no way to sign in yet, so an invitation would be an email leading to a door that
            does not open. That is why there is no invite button here rather than one that fails.
          </p>
        </Card>
      </section>

      {/* Regional ------------------------------------------------------- */}
      <section id="regional" aria-labelledby="regional-heading" className="flex flex-col gap-3">
        <h2 id="regional-heading" className="os-label">Regional</h2>

        <div className="grid gap-3 lg:grid-cols-[1.35fr_1fr]">
          <Card>
            <CardHead title="Money, language and time" hint="Set for a shop trading in Tunis." />
            <dl className="flex flex-col">
              <SettingRow
                label="Currency"
                value="Tunisian dinar, three decimals"
                state="Not editable yet"
                note="Every amount in the product is written the same way, from an order line to the budget. A second currency is not planned, because the shop sells in dinars."
              />
              <SettingRow
                label="Language"
                value="English, on every screen"
                state="Not editable yet"
                note="The interface is in English. What your customers write stays in the language they wrote it, French, Arabic or English, and is never translated on the way in. A French interface is on the list, after the database."
              />
              <SettingRow
                label="Time zone"
                value="Tunis, GMT+1 all year"
                state="Not editable yet"
                note={`Tunisia does not move the clocks in summer, so an order stamped 14:20 was placed at 14:20 in the shop. The demo has no server in Tunis behind it: it reads the clock of the machine it runs on, which says ${formatDateTime(DEMO_NOW.toISOString())} right now.`}
              />
              <SettingRow
                label="Week starts on"
                value="Monday"
                state="Not editable yet"
                note="Used by every figure that says this week, on the dashboard and on Statistics."
              />
            </dl>
          </Card>

          <Card className="flex flex-col">
            <CardHead
              title="How money is written here"
              hint={
                moneyExample
                  ? `Order ${moneyExample.reference} from the demo data, written the way every screen writes it.`
                  : "The way every screen writes an amount."
              }
            />
            {moneyExample ? (
              <>
                <dl className="flex flex-col gap-2 rounded-[var(--radius-md)] border border-accent-line bg-accent-soft px-3.5 py-3 text-[13px] text-accent-ink">
                  {moneyExample.items.map((line) => (
                    <div key={line.id} className="flex items-baseline justify-between gap-4">
                      <dt>
                        {line.name}
                        {line.quantity > 1 ? `, ${line.quantity} of them` : ""}
                      </dt>
                      <dd className="os-num font-semibold">
                        {formatTND(line.unitPrice * line.quantity)}
                      </dd>
                    </div>
                  ))}
                  <div className="flex items-baseline justify-between gap-4">
                    <dt>Delivery</dt>
                    <dd className="os-num font-semibold">{formatTND(moneyExample.deliveryFee)}</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4 border-t border-accent-line pt-2">
                    <dt className="font-semibold">What the customer pays</dt>
                    <dd className="os-num text-[15px] font-bold">{formatTND(moneyExample.total)}</dd>
                  </div>
                </dl>
                <Link
                  href={`/orders/${moneyExample.reference}`}
                  className="mt-2 inline-block text-[12.5px] font-semibold text-primary hover:underline"
                >
                  Open this order
                </Link>
              </>
            ) : null}
            <p className="mt-3 max-w-[52ch] text-[12.5px] leading-relaxed text-muted">
              The comma separates the dinars from the millimes, and a thousand millimes make one
              dinar, so an amount here is read as dinars and never as thousands. Amounts are held to
              the millime and never rounded up on the way to a total.
            </p>
          </Card>
        </div>
      </section>

      {/* Notifications -------------------------------------------------- */}
      <section id="notifications" aria-labelledby="notifications-heading" className="flex flex-col gap-3">
        <h2 id="notifications-heading" className="os-label">Notifications</h2>

        <div className="grid gap-3 lg:grid-cols-[1.35fr_1fr]">
          <Card>
            <CardHead
              title="What the shop will tell you about"
              hint="Four things that are worth taking you away from what you were doing. Everything else waits for you to look."
            />
            <ul className="flex flex-col">
              {NOTIFY_EVENTS.map((event) => (
                <li key={event.id} className="border-t border-line py-3 first:border-t-0 first:pt-0 last:pb-0">
                  <p className="text-[14px] font-semibold">{event.title}</p>
                  <p className="mt-1 max-w-[68ch] text-[12.5px] leading-relaxed text-muted">{event.body}</p>
                  <p className="mt-1.5 text-[12px] text-faint">Goes to: {event.reaches}</p>
                </li>
              ))}
            </ul>
            <p className="mt-3 max-w-[74ch] rounded-[var(--radius-sm)] border border-line bg-surface-2 px-3 py-2 text-[12.5px] leading-relaxed text-muted">
              <span className="font-semibold text-ink">These four are what the product will notify on. </span>
              Sending them to you, by email or on your phone, arrives after the sign-in step, because
              there is nowhere yet to keep an address that belongs to you. Nothing leaves the screen
              today: the first three show up in the Alerts button at the top, and the low stock one
              on Products and on the dashboard.
            </p>
          </Card>

          <Card className="flex flex-col">
            <CardHead
              title="What would be sent right now"
              hint="Counted from the demo data with the same rules, so you can see what the four events actually catch."
            />
            {live.length === 0 ? (
              <EmptyState
                title="Nothing would reach you right now"
                body="Every channel is receiving properly, no request has waited two hours without someone on it, no follow up is overdue and no product has fallen to its low stock level."
                action={{ label: "Open the inbox", href: "/inbox" }}
              />
            ) : (
              <ul className="flex flex-col">
                {live.map((item) => (
                  <li
                    key={item.id}
                    className="border-t border-line py-3 first:border-t-0 first:pt-0 last:pb-0"
                  >
                    <p className="text-[13.5px] font-semibold">{item.title}</p>
                    {item.channelIds.length > 0 ? (
                      <p className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {item.channelIds.map((id) => (
                          <span
                            key={id}
                            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-2 py-0.5 text-[11px] font-semibold"
                          >
                            <ChannelDot channelId={id} size={7} />
                            {channel(id).label}
                          </span>
                        ))}
                      </p>
                    ) : null}
                    <p className="mt-1.5 max-w-[52ch] text-[12.5px] leading-relaxed text-muted">
                      {item.detail}
                    </p>
                    <Link
                      href={item.href}
                      className="mt-1.5 inline-block text-[12.5px] font-semibold text-primary hover:underline"
                    >
                      {item.linkLabel}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </section>

      {/* Data and privacy ------------------------------------------------ */}
      <section id="data" aria-labelledby="data-heading" className="flex flex-col gap-3">
        <h2 id="data-heading" className="os-label">Data and privacy</h2>

        <div className="grid gap-3 xl:grid-cols-3">
          <Card className="flex flex-col">
            <CardHead
              title="What is kept about a customer"
              hint="Only what answering them and delivering to them needs."
            />
            <dl className="flex flex-col gap-2 text-[12.5px]">
              {STORED.map((row) => (
                <div key={row.label}>
                  <dt className="font-semibold">{row.label}</dt>
                  <dd className="leading-relaxed text-muted">{row.why}</dd>
                </div>
              ))}
            </dl>
            <p className="my-3 rounded-[var(--radius-sm)] border border-line bg-surface-2 px-3 py-2 text-[12px] leading-relaxed text-muted">
              No card number is ever held here. Payment is taken in cash on delivery or by the
              delivery company, so a card never passes through Les Saveurs du Cap Bon.
            </p>
            <Placeholder>
              This is the rule as it stands today, written before the data exists. It starts being
              applied on the day the database is switched on.
            </Placeholder>
          </Card>

          <Card className="flex flex-col">
            <CardHead
              title="How long things are kept"
              hint="A setting with a default, one line per kind of record."
            />
            <dl className="flex flex-col">
              {RETENTION.map((row) => (
                <div
                  key={row.label}
                  className="border-t border-line py-2.5 first:border-t-0 first:pt-0"
                >
                  <dt className="flex items-baseline justify-between gap-3 text-[13px] font-semibold">
                    <span>{row.label}</span>
                    <span className="os-num shrink-0 text-[12.5px] text-primary">{row.value}</span>
                  </dt>
                  <dd className="mt-0.5 text-[12px] leading-relaxed text-muted">{row.why}</dd>
                </div>
              ))}
            </dl>
            <p className="my-3 text-[12px] leading-relaxed text-muted">
              These are the defaults. Changing them becomes a setting you can move once the database
              is on, and a shorter setting will only ever delete going forward, never reach back and
              remove what you already have.
            </p>
            <Placeholder>
              Nothing is deleted on a schedule today, because the demo data lives in the app rather
              than in a database.
            </Placeholder>
          </Card>

          <Card className="flex flex-col">
            <CardHead
              title="If a customer asks to be removed"
              hint="What you would do, and what it would take away."
            />
            <ol className="flex flex-col gap-1.5 text-[12.5px] leading-relaxed">
              <li className="flex gap-2">
                <span className="os-num shrink-0 font-bold text-primary">1.</span>
                The customer asks, on any channel or by phone. Nobody has to prove who they are
                beyond the number or the address they wrote from.
              </li>
              <li className="flex gap-2">
                <span className="os-num shrink-0 font-bold text-primary">2.</span>
                You open their contact and record the request, with the date.
              </li>
              <li className="flex gap-2">
                <span className="os-num shrink-0 font-bold text-primary">3.</span>
                It is done within thirty days, and you write back once to say it is done.
              </li>
            </ol>

            <p className="os-label mt-3">Removed</p>
            <ul className="mt-1 flex flex-col gap-1 text-[12.5px] leading-relaxed text-muted">
              {DELETION_REMOVES.map((line) => (
                <li key={line} className="flex gap-2">
                  <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                  {line}
                </li>
              ))}
            </ul>

            <p className="os-label mt-3">Kept</p>
            <ul className="mt-1 mb-3 flex flex-col gap-1 text-[12.5px] leading-relaxed text-muted">
              {DELETION_KEEPS.map((line) => (
                <li key={line} className="flex gap-2">
                  <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-line-strong" />
                  {line}
                </li>
              ))}
            </ul>

            <Placeholder>
              A button on the contact that does all of this in one go is designed and not built. The
              request is written down by hand for now.
            </Placeholder>
          </Card>
        </div>
      </section>

      {/* Connected accounts ---------------------------------------------- */}
      <section id="accounts" aria-labelledby="accounts-heading" className="flex flex-col gap-3">
        <h2 id="accounts-heading" className="os-label">Connected accounts</h2>

        <Card>
          <CardHead
            title="Where your orders come in from"
            hint={`${plural(receiving.length, "source is", "sources are")} bringing orders in, ${plural(attention.length, "needs", "need")} something from you, and ${plural(planned.length, "is", "are")} planned.`}
            action={
              <Link
                href="/integrations"
                className="rounded-[var(--radius-md)] border border-line bg-surface px-3 py-1.5 text-xs font-semibold hover:border-line-strong"
              >
                Open Integrations
              </Link>
            }
          />

          {byChannel.length === 0 ? (
            <EmptyState
              title="No source is set up yet"
              body="Nothing is listed here because no connector has been added to this workspace."
              action={{ label: "Open Integrations", href: "/integrations" }}
            />
          ) : (
            <div className="os-scroll">
              <table className="w-full min-w-[620px] border-collapse text-left text-[13px]">
                <thead>
                  <tr className="border-b border-line">
                    <th className="os-label pb-2 font-normal">Source</th>
                    <th className="os-label pb-2 font-normal">Accounts</th>
                    <th className="os-label pb-2 font-normal">State</th>
                    <th className="os-label pb-2 font-normal">Last order in</th>
                    <th className="os-label pb-2 text-right font-normal">Orders this week</th>
                  </tr>
                </thead>
                <tbody>
                  {byChannel.map((row) => (
                    <tr key={row.channelId} className="border-b border-line align-middle last:border-b-0">
                      <td className="py-2.5 pr-4">
                        <SourceBadge channelId={row.channelId} size="sm" />
                      </td>
                      <td className="py-2.5 pr-4 text-muted">
                        <span className="os-num">{row.accounts}</span>
                        {row.planned > 0 ? (
                          <span className="ml-1.5 text-[11.5px]">
                            (<span className="os-num">{row.planned}</span> planned)
                          </span>
                        ) : null}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className="flex flex-wrap gap-1.5">
                          {row.statuses.map((status) => (
                            <ConnectionPill key={status} status={status} />
                          ))}
                        </span>
                      </td>
                      <td className="os-num py-2.5 pr-4 text-[12px] text-muted">
                        {row.lastEventAt ? timeAgo(row.lastEventAt, DEMO_NOW) : "Never"}
                      </td>
                      <td className="os-num py-2.5 text-right font-semibold">{row.thisWeek}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="mt-3 max-w-[76ch] text-[12.5px] leading-relaxed text-muted">
            What each account needs, what is still missing on it and what broke are all on
            Integrations, so they are not repeated here. Every state in this table is demo data: no
            real WhatsApp, Instagram, Facebook or Google account is joined to this workspace, and
            nothing you do in the product reaches a customer.
          </p>
        </Card>
      </section>
    </div>
  );
}
