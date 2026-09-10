import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivityTimeline, type TimelineEntry } from "@/components/contact-detail/ActivityTimeline";
import { DuplicateBanner, type DuplicateMatch } from "@/components/contact-detail/DuplicateBanner";
// The stage pill reads the same wording and the same tone the contacts list
// reads, so one record cannot be "Won" on the list and something else here.
import { STAGE_COPY } from "@/components/contacts/ContactsTable";
import { ChannelDot, Pill, SourceBadge, TagChip } from "@/components/ui/badges";
import { Card, CardHead, DemoChip, PageHeader, Stat } from "@/components/ui/surfaces";
import {
  buildAttributionIndex,
  orderSource,
  resolveSource,
  totalsByChannel,
  touchSummary,
} from "@/lib/domain/attribution";
import { channel } from "@/lib/domain/channels";
import type { ChannelId, ConversationStatus, Message, Order } from "@/lib/domain/types";
import {
  formatDate,
  formatDateTime,
  formatTND,
  formatTNDCompact,
  isOverdue,
  relativeTime,
  timeAgo,
} from "@/lib/format";
import { DEMO_NOW } from "@/lib/mock/time";
import { getRepositories } from "@/lib/repositories";

type Params = Promise<{ id: string }>;

// The demo clock moves with the visit, so this page is rendered per request
// rather than frozen into the build.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Params }) {
  const { id } = await params;
  const contact = await getRepositories().contacts.byId(decodeURIComponent(id));
  return { title: contact ? `${contact.name}, Les Saveurs du Cap Bon` : "Customer, Les Saveurs du Cap Bon" };
}

const CONVERSATION_STATE: Record<ConversationStatus, string> = {
  new: "New, nobody has replied",
  open: "Open",
  waiting: "Waiting on the customer",
  resolved: "Resolved",
  snoozed: "Snoozed",
};

function joinWords(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function shorten(body: string, limit = 120): string {
  if (body.length <= limit) return body;
  return `${body.slice(0, limit).trimEnd()}...`;
}

function speaker(message: Message, firstName: string, team: Map<string, string>): string {
  const author = message.authorId ? team.get(message.authorId) ?? "Your team" : "Your team";
  if (message.direction === "inbound") return `${firstName} wrote`;
  if (message.direction === "note") return `${author} left a note`;
  return `${author} replied`;
}

export default async function ContactDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const repos = getRepositories();
  const contact = await repos.contacts.byId(decodeURIComponent(id));
  if (!contact) notFound();

  const [contacts, conversations, orders, tasks, team, connections, attributions, duplicates] =
    await Promise.all([
      repos.contacts.list(),
      repos.conversations.list(),
      repos.orders.list(),
      repos.workspace.tasks(),
      repos.workspace.team(),
      repos.integrations.list(),
      repos.workspace.attributions(),
      repos.contacts.duplicates(),
    ]);

  const index = buildAttributionIndex(attributions, connections);
  const teamById = new Map(team.map((member) => [member.id, member.name]));
  const nameById = new Map(contacts.map((other) => [other.id, other.name]));
  const firstName = contact.name.split(" ")[0];

  const theirConversations = conversations.filter((c) => c.contactId === contact.id);
  const theirOrders = orders.filter((o) => o.contactId === contact.id);
  const theirTasks = tasks.filter((t) => t.contactId === contact.id);
  const openTasks = theirTasks.filter((t) => !t.completedAt);
  const overdueTasks = openTasks.filter((t) => isOverdue(t.dueAt, DEMO_NOW));

  const threads = await Promise.all(
    theirConversations.map(async (conversation) => ({
      id: conversation.id,
      messages: await repos.conversations.messages(conversation.id),
    })),
  );
  const lastMessageOf = new Map(
    threads.map((thread) => [thread.id, thread.messages[thread.messages.length - 1] ?? null]),
  );

  const entries: TimelineEntry[] = [];

  for (const conversation of theirConversations) {
    const source = resolveSource(conversation.attributionId, index);
    const message = lastMessageOf.get(conversation.id) ?? null;
    entries.push({
      kind: "conversation",
      id: `thread_${conversation.id}`,
      at: conversation.lastMessageAt,
      stamp: relativeTime(conversation.lastMessageAt, DEMO_NOW),
      exact: formatDateTime(conversation.lastMessageAt),
      channelId: source.channelId,
      account: source.accountLabel,
      subject: conversation.subject,
      href: `/inbox?c=${conversation.id}`,
      state: CONVERSATION_STATE[conversation.status],
      lastLine: message
        ? `${speaker(message, firstName, teamById)}: ${shorten(message.body)}`
        : null,
    });
  }

  for (const order of theirOrders) {
    const source = orderSource(order, index);
    entries.push({
      kind: "order",
      id: `order_${order.id}`,
      at: order.placedAt,
      stamp: relativeTime(order.placedAt, DEMO_NOW),
      exact: formatDateTime(order.placedAt),
      channelId: source.channelId,
      account: source.accountLabel,
      reference: order.reference,
      href: `/orders/${order.reference}`,
      totalLabel: formatTND(order.total),
      payment: order.paymentStatus,
      delivery: order.deliveryStatus,
      contents: order.items.map((item) => `${item.quantity} x ${item.name}`).join(", "),
    });
  }

  for (const task of theirTasks) {
    const done = task.completedAt !== null;
    const at = task.completedAt ?? task.dueAt;
    const overdue = !done && isOverdue(task.dueAt, DEMO_NOW);
    entries.push({
      kind: "task",
      id: `task_${task.id}`,
      at,
      stamp: relativeTime(at, DEMO_NOW),
      exact: formatDateTime(at),
      title: task.title,
      state: done
        ? `Done ${timeAgo(at, DEMO_NOW)}`
        : overdue
          ? `Overdue, was due ${timeAgo(task.dueAt, DEMO_NOW)}`
          : `Due ${relativeTime(task.dueAt, DEMO_NOW)}`,
      overdue,
      done,
      owner: teamById.get(task.assigneeId) ?? "Nobody yet",
    });
  }

  for (const note of contact.notes) {
    entries.push({
      kind: "note",
      id: `note_${note.id}`,
      at: note.createdAt,
      stamp: relativeTime(note.createdAt, DEMO_NOW),
      exact: formatDateTime(note.createdAt),
      body: note.body,
      author: teamById.get(note.authorId) ?? "Your team",
    });
  }

  entries.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  const touches = touchSummary(contact.firstTouchChannel, contact.latestTouchChannel);
  const stage = STAGE_COPY[contact.stage];
  const owner = contact.ownerId ? teamById.get(contact.ownerId) ?? null : null;
  // The repository makes no promise about the order it returns rows in, so the
  // newest order is worked out here rather than assumed to be the first one.
  // Otherwise the tile could say "last one 4h ago" while the timeline above it
  // shows a newer order.
  const lastOrder = theirOrders.reduce<Order | null>(
    (newest, order) =>
      newest === null || new Date(order.placedAt).getTime() > new Date(newest.placedAt).getTime()
        ? order
        : newest,
    null,
  );
  const unresolvedThreads = theirConversations.filter((c) => c.status !== "resolved").length;

  const channelsUsed: ChannelId[] = [];
  for (const entry of entries) {
    if (entry.kind !== "order" && entry.kind !== "conversation") continue;
    if (!channelsUsed.includes(entry.channelId)) channelsUsed.push(entry.channelId);
  }

  const bySource = totalsByChannel(theirOrders, index).filter((row) => row.orders > 0);
  const offFirstTouch = theirOrders.filter(
    (order) => orderSource(order, index).channelId !== contact.firstTouchChannel,
  ).length;

  const mixLine =
    channelsUsed.length === 0
      ? "Nothing has arrived on this record yet, so there is no source to report."
      : channelsUsed.length === 1
        ? `Everything on this record arrived on ${channel(channelsUsed[0]).label}.`
        : `Messages and orders on this record arrived on ${joinWords(
            channelsUsed.map((channelId) => channel(channelId).label),
          )}. Each one keeps the source it came in on.`;

  // A record typed in at the counter or over the phone did not arrive on a
  // channel, so it gets its own sentence instead of being told it found the
  // shop on something called Manual.
  const addedByHand = contact.firstTouchChannel === "manual";

  const arrivalLine = addedByHand
    ? touches.changed
      ? `${firstName} was typed in by hand rather than arriving on a channel, and writes on ${touches.latest} now. The record keeps both, so it stays clear that no connected channel brought this customer in.`
      : `${firstName} was typed in by hand rather than arriving on a channel, and nothing has come in on a connected channel since.`
    : touches.changed
      ? `${firstName} found the shop on ${touches.first} and writes on ${touches.latest} now. Both are kept on the record, so ${touches.first} still gets the credit for bringing this customer in.`
      : `${firstName} found the shop on ${touches.first}, and that is still the most recent channel on this record.`;

  const matches: DuplicateMatch[] = duplicates
    .filter((entry) => entry.contactIds.includes(contact.id))
    .map((entry) => {
      const isEmail = entry.value.includes("@");
      return {
        id: entry.value,
        field: isEmail ? "email address" : "phone number",
        value: (isEmail ? contact.email : contact.phone) ?? entry.value,
        others: entry.contactIds
          .filter((other) => other !== contact.id)
          .map((other) => ({ id: other, name: nameById.get(other) ?? "The other record" })),
      };
    });

  const facts: { label: string; value: React.ReactNode; mono?: boolean }[] = [
    { label: "Phone", value: contact.phone ?? <Missing />, mono: contact.phone !== null },
    { label: "Email", value: contact.email ?? <Missing /> },
    { label: "First contact", value: formatDate(contact.firstContactAt) },
    {
      label: "Owner",
      value: owner ?? <span className="text-danger">Nobody yet</span>,
    },
    // Written the same way as the tile above. One figure, one label, two places
    // on the page: it has to read identically in both.
    { label: "Lifetime value", value: formatTNDCompact(contact.lifetimeValue), mono: true },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href="/contacts" className="text-xs font-semibold text-primary hover:underline">
          Back to contacts
        </Link>
      </div>

      <PageHeader
        title={contact.name}
        subtitle={`${[contact.city, `speaks ${contact.language}`]
          .filter(Boolean)
          .join(", ")}. On your list since ${formatDate(contact.firstContactAt)}.`}
        actions={
          <>
            <Pill tone={stage.tone}>{stage.label}</Pill>
            <DemoChip />
          </>
        }
      />

      <DuplicateBanner matches={matches} />

      <Card>
        <CardHead
          title="Where this customer came from"
          hint="The first channel is written once and never changed. The most recent one moves with them."
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[1fr_1fr_1.2fr]">
          <div>
            <p className="os-label">First came in on</p>
            <p className="mt-1.5">
              <SourceBadge channelId={contact.firstTouchChannel} />
            </p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
              {addedByHand
                ? `Typed in by hand on ${formatDate(contact.firstContactAt)}, not through a connected channel. It stays on the record whatever they use later.`
                : `Where ${firstName} reached you first, on ${formatDate(contact.firstContactAt)}. It stays on the record whatever they use later.`}
            </p>
          </div>

          <div>
            <p className="os-label">Most recent contact</p>
            <p className="mt-1.5">
              <SourceBadge channelId={contact.latestTouchChannel} />
            </p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
              The channel this record points at now. It moves when the customer moves, and it never
              overwrites the first one.
            </p>
          </div>

          <div className="rounded-[var(--radius-md)] border border-line bg-surface-2 px-3.5 py-3">
            <div className="flex items-baseline justify-between gap-3">
              <span className="os-label">Lead score</span>
              <span className="os-num font-display text-[24px] font-bold leading-none">
                {contact.leadScore}
              </span>
            </div>
            <p className="mt-1 text-[11.5px] text-muted">Out of 100, and here is why:</p>
            <ul className="mt-2 flex flex-col gap-1 text-[12.5px]">
              {contact.leadScoreReasons.map((reason) => (
                <li key={reason} className="flex gap-2">
                  <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-3 rounded-[var(--radius-sm)] border border-line bg-surface-2 px-3 py-2 text-[12.5px] leading-relaxed text-muted">
          {arrivalLine} {mixLine}
        </p>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Lifetime value"
          value={formatTNDCompact(contact.lifetimeValue)}
          detail="Kept on the record, not a sum of the orders"
          tone="money"
        />
        <Stat
          label="Orders"
          value={String(theirOrders.length)}
          detail={
            lastOrder
              ? `Last one ${timeAgo(lastOrder.placedAt, DEMO_NOW)}`
              : "No order on this record yet"
          }
        />
        <Stat
          label="Message threads"
          value={String(theirConversations.length)}
          detail={
            theirConversations.length === 0
              ? "No conversation yet"
              : unresolvedThreads === 0
                ? "All resolved"
                : `${unresolvedThreads} not resolved yet`
          }
        />
        <Stat
          label="Open tasks"
          value={String(openTasks.length)}
          detail={
            overdueTasks.length > 0
              ? `${overdueTasks.length} overdue`
              : openTasks.length === 0
                ? "Nothing booked"
                : "None overdue"
          }
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHead
            title="Activity, newest first"
            hint="Every thread, order, task and note on this customer, whichever source it arrived on."
          />
          <ActivityTimeline entries={entries} name={contact.name} />
        </Card>

        <div className="flex flex-col gap-3">
          <Card>
            <CardHead title="Details" />
            <dl className="flex flex-col gap-2 text-[13px]">
              {facts.map((fact) => (
                <div
                  key={fact.label}
                  className="flex items-start justify-between gap-3 border-b border-line pb-2 last:border-b-0 last:pb-0"
                >
                  <dt className="shrink-0 text-muted">{fact.label}</dt>
                  {/* An email address is one long unbreakable word, so the value
                      is allowed to break rather than push the page sideways. */}
                  <dd className={`min-w-0 break-words text-right ${fact.mono ? "os-num" : ""}`}>
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-3 border-t border-line pt-3">
              <p className="os-label mb-1.5">Tags</p>
              {contact.tags.length === 0 ? (
                <p className="text-[12.5px] text-muted">
                  No tag on this record. Tags come from the inbox as your team reads the messages.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {contact.tags.map((tag) => (
                    <TagChip key={tag} label={tag} />
                  ))}
                </div>
              )}
            </div>
          </Card>

          <Card>
            <CardHead
              title="Orders by source"
              hint={
                theirOrders.length === 1
                  ? "1 order on this record"
                  : `${theirOrders.length} orders on this record`
              }
            />
            {theirOrders.length === 0 ? (
              <p className="text-[13px] text-muted">
                No order has been placed on this record yet, so there is nothing to split by source.
              </p>
            ) : (
              <>
                <ul className="flex flex-col gap-2.5">
                  {bySource.map((row) => (
                    <li key={row.channelId}>
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-1.5 text-[13px]">
                          <ChannelDot channelId={row.channelId} />
                          {row.label}
                        </span>
                        <span className="os-num text-[12.5px] text-muted">
                          {row.orders} {row.orders === 1 ? "order" : "orders"}
                        </span>
                      </div>
                      <span className="mt-1 block h-1.5 rounded-full bg-surface-2">
                        <span
                          className="block h-1.5 rounded-full bg-primary-mute"
                          style={{ width: `${Math.max(row.share, 4)}%` }}
                        />
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 border-t border-line pt-3 text-[12.5px] leading-relaxed text-muted">
                  {offFirstTouch > 0
                    ? `${offFirstTouch} of these orders arrived on a channel other than ${
                        channel(contact.firstTouchChannel).label
                      }, which is where this customer first came in. Each order keeps its own source.`
                    : `Every order on this record arrived on ${
                        channel(contact.firstTouchChannel).label
                      }, the same channel this customer first came in on.`}
                </p>
                <p className="mt-2">
                  <Link
                    href={`/orders?q=${encodeURIComponent(contact.name)}&period=90`}
                    className="text-[13px] font-semibold text-primary hover:underline"
                  >
                    See every order from {firstName}
                  </Link>
                </p>
              </>
            )}
          </Card>

          <p className="text-xs leading-relaxed text-muted">
            Editing this customer, merging two records into one and exporting their history are
            designed but not built. Nothing on this page changes your data, and no message leaves
            Les Saveurs du Cap Bon from here.
          </p>
        </div>
      </div>
    </div>
  );
}

function Missing() {
  return <span className="text-muted">Not given</span>;
}
