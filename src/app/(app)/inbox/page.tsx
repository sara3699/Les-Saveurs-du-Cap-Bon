import Link from "next/link";
import { ChannelDot } from "@/components/ui/badges";
import { ContextPanel } from "@/components/inbox/ContextPanel";
import { Thread, type ThreadMessage } from "@/components/inbox/Thread";
import { DemoChip, EmptyState } from "@/components/ui/surfaces";
import { buildAttributionIndex, resolveSource } from "@/lib/domain/attribution";
import { CHANNEL_ORDER, channel } from "@/lib/domain/channels";
import type { ChannelId, ConversationStatus } from "@/lib/domain/types";
import { formatDate, formatStamp, formatTND, isOverdue, relativeTime } from "@/lib/format";
import { DEMO_NOW } from "@/lib/mock/time";
import { getRepositories } from "@/lib/repositories";

export const metadata = { title: "Inbox, Les Saveurs du Cap Bon" };

type Params = Promise<Record<string, string | string[] | undefined>>;

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

const STATUSES: { value: ConversationStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "open", label: "Open" },
  { value: "waiting", label: "Waiting" },
  { value: "resolved", label: "Resolved" },
  { value: "snoozed", label: "Snoozed" },
];

export default async function InboxPage({ searchParams }: { searchParams: Params }) {
  const params = await searchParams;
  const channelFilter = one(params.channel) as ChannelId | undefined;
  const statusFilter = one(params.status) as ConversationStatus | undefined;
  const assigneeFilter = one(params.assignee);
  const unreadOnly = one(params.unread) === "1";
  const query = one(params.q) ?? "";
  const selectedId = one(params.c);

  const repos = getRepositories();
  const [conversations, contacts, team, connections, attributions, tasks, orders] =
    await Promise.all([
      repos.conversations.list({
        channels: channelFilter ? [channelFilter] : undefined,
        statuses: statusFilter ? [statusFilter] : undefined,
        assigneeId: assigneeFilter ? (assigneeFilter === "none" ? null : assigneeFilter) : undefined,
        unreadOnly,
        search: query || undefined,
      }),
      repos.contacts.list(),
      repos.workspace.team(),
      repos.integrations.list(),
      repos.workspace.attributions(),
      repos.workspace.tasks(),
      repos.orders.list(),
    ]);

  const index = buildAttributionIndex(attributions, connections);
  const contactById = new Map(contacts.map((c) => [c.id, c]));
  const teamById = new Map(team.map((m) => [m.id, m]));

  const selected =
    conversations.find((c) => c.id === selectedId) ?? conversations[0] ?? null;

  const href = (extra: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const merged: Record<string, string | undefined> = {
      channel: channelFilter,
      status: statusFilter,
      assignee: assigneeFilter,
      unread: unreadOnly ? "1" : undefined,
      q: query || undefined,
      c: selected?.id,
      ...extra,
    };
    for (const [key, value] of Object.entries(merged)) if (value) next.set(key, value);
    const qs = next.toString();
    return qs ? `/inbox?${qs}` : "/inbox";
  };

  const listRows = conversations.map((conversation) => {
    const contact = contactById.get(conversation.contactId);
    const source = resolveSource(conversation.attributionId, index);
    return {
      id: conversation.id,
      name: contact?.name ?? "Unknown",
      subject: conversation.subject,
      channelId: source.channelId,
      stamp: relativeTime(conversation.lastMessageAt, DEMO_NOW),
      unread: conversation.unreadCount,
      priority: conversation.priority,
      status: conversation.status,
      assignee: conversation.assigneeId ? teamById.get(conversation.assigneeId)?.name ?? null : null,
    };
  });

  let threadProps = null;
  let contextProps = null;

  if (selected) {
    const contact = contactById.get(selected.contactId)!;
    const source = resolveSource(selected.attributionId, index);
    const connection = connections.find((c) => c.id === source.connectionId) ?? null;
    const canSend = connection?.status === "connected" && source.channelId !== "manual";
    const messages = await repos.conversations.messages(selected.id);

    const threadMessages: ThreadMessage[] = messages.map((message) => ({
      id: message.id,
      direction: message.direction,
      body: message.body,
      stamp: formatStamp(message.sentAt, DEMO_NOW),
      author: message.authorId ? teamById.get(message.authorId)?.name ?? null : null,
      attachments: message.attachments.map((a) => ({
        id: a.id,
        filename: a.filename,
        sizeLabel: a.sizeLabel,
        kind: a.kind,
      })),
    }));

    threadProps = {
      conversationId: selected.id,
      customerName: contact.name,
      channelId: source.channelId,
      channelLabel: channel(source.channelId).label,
      account: source.accountLabel,
      firstContactLabel: formatDate(contact.firstContactAt),
      composerPlaceholder: channel(source.channelId).composerPlaceholder(contact.name.split(" ")[0]),
      canSend,
      cannotSendReason:
        connection && connection.status !== "connected"
          ? `${channel(source.channelId).cannotSendReason} Open Integrations to finish the setup.`
          : channel(source.channelId).cannotSendReason,
      messages: threadMessages,
      team: team.map((m) => ({ id: m.id, name: m.name })),
      assigneeId: selected.assigneeId,
      status: selected.status,
      tags: selected.tags,
    };

    const contactConversations = conversations.filter((c) => c.contactId === contact.id);
    const contactOrders = orders.filter((o) => o.contactId === contact.id).slice(0, 4);

    contextProps = {
      contactId: contact.id,
      name: contact.name,
      initials: contact.name.split(" ").map((p) => p[0]).join("").slice(0, 2),
      phone: contact.phone,
      email: contact.email,
      city: contact.city,
      language: contact.language,
      firstTouch: contact.firstTouchChannel,
      latestTouch: contact.latestTouchChannel,
      firstContactLabel: formatDate(contact.firstContactAt),
      stage: contact.stage.charAt(0).toUpperCase() + contact.stage.slice(1),
      tags: contact.tags,
      leadScore: contact.leadScore,
      leadScoreReasons: contact.leadScoreReasons,
      lifetimeLabel: formatTND(contact.lifetimeValue),
      tasks: tasks
        .filter((t) => t.contactId === contact.id && !t.completedAt)
        .map((t) => ({
          id: t.id,
          title: t.title,
          dueLabel: relativeTime(t.dueAt, DEMO_NOW),
          overdue: isOverdue(t.dueAt, DEMO_NOW),
        })),
      notes: contact.notes.map((n) => ({
        id: n.id,
        author: teamById.get(n.authorId)?.name ?? "Your team",
        stamp: relativeTime(n.createdAt, DEMO_NOW),
        body: n.body,
      })),
      timeline: [
        ...contactConversations.map((c) => ({
          id: `tl_${c.id}`,
          label: c.subject,
          stamp: relativeTime(c.lastMessageAt, DEMO_NOW),
          channelId: resolveSource(c.attributionId, index).channelId as ChannelId | null,
        })),
        ...contactOrders.map((o) => ({
          id: `tl_${o.id}`,
          label: `${o.reference}, ${formatTND(o.total)}`,
          stamp: relativeTime(o.placedAt, DEMO_NOW),
          channelId: resolveSource(o.attributionId, index).channelId as ChannelId | null,
        })),
      ].slice(0, 8),
    };
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl leading-tight">Inbox</h1>
          <p className="mt-1 text-sm text-muted">
            {conversations.length} questions and order requests from six platforms, in one list. Orders themselves live in Orders.
          </p>
        </div>
        <DemoChip />
      </div>

      <div className="os-card grid overflow-hidden lg:grid-cols-[286px_1fr_284px]">
        <div className={`flex flex-col border-line lg:border-r ${selectedId ? "hidden lg:flex" : "flex"}`}>
          <div className="flex flex-col gap-2 border-b border-line p-3">
            <form>
              {channelFilter ? <input type="hidden" name="channel" value={channelFilter} /> : null}
              {statusFilter ? <input type="hidden" name="status" value={statusFilter} /> : null}
              <input
                name="q"
                defaultValue={query}
                placeholder="Search conversations"
                aria-label="Search conversations"
                className="w-full rounded-[var(--radius-sm)] border border-line bg-surface-2 px-2.5 py-1.5 text-[13px]"
              />
            </form>
            <div className="flex flex-wrap gap-1">
              <Link
                href={href({ channel: undefined, status: undefined, unread: undefined, assignee: undefined })}
                className={`rounded-full border px-2.5 py-1 text-[11px] ${
                  !channelFilter && !statusFilter && !unreadOnly && !assigneeFilter
                    ? "border-primary bg-primary text-white"
                    : "border-line bg-surface-2 text-muted"
                }`}
              >
                All
              </Link>
              <Link
                href={href({ unread: unreadOnly ? undefined : "1" })}
                className={`rounded-full border px-2.5 py-1 text-[11px] ${
                  unreadOnly ? "border-primary bg-primary text-white" : "border-line bg-surface-2 text-muted"
                }`}
              >
                Unread
              </Link>
              {CHANNEL_ORDER.map((id) => (
                <Link
                  key={id}
                  href={href({ channel: channelFilter === id ? undefined : id })}
                  className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] ${
                    channelFilter === id ? "border-primary bg-primary text-white" : "border-line bg-surface-2 text-muted"
                  }`}
                >
                  <ChannelDot channelId={id} size={7} />
                  {channel(id).label}
                </Link>
              ))}
              {STATUSES.map((s) => (
                <Link
                  key={s.value}
                  href={href({ status: statusFilter === s.value ? undefined : s.value })}
                  className={`rounded-full border px-2.5 py-1 text-[11px] ${
                    statusFilter === s.value ? "border-primary bg-primary text-white" : "border-line bg-surface-2 text-muted"
                  }`}
                >
                  {s.label}
                </Link>
              ))}
              <Link
                href={href({ assignee: assigneeFilter === "none" ? undefined : "none" })}
                className={`rounded-full border px-2.5 py-1 text-[11px] ${
                  assigneeFilter === "none" ? "border-primary bg-primary text-white" : "border-line bg-surface-2 text-muted"
                }`}
              >
                Unassigned
              </Link>
            </div>
          </div>

          <ol className="flex-1 overflow-y-auto">
            {listRows.length === 0 ? (
              <li className="p-4">
                <p className="text-[13px] text-muted">
                  No conversation matches these filters. Clear one to widen the list.
                </p>
              </li>
            ) : (
              listRows.map((row) => (
                <li key={row.id}>
                  <Link
                    href={href({ c: row.id })}
                    className={`block border-b border-line px-3 py-2.5 ${
                      selected?.id === row.id ? "bg-primary-soft" : "hover:bg-surface-2"
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-2 text-[13px] font-semibold">
                        <ChannelDot channelId={row.channelId} />
                        <span className="truncate">{row.name}</span>
                      </span>
                      <span className="os-num shrink-0 text-[10.5px] text-muted">{row.stamp}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-[12px] text-muted">{row.subject}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-1.5">
                      {row.unread > 0 ? (
                        <span className="os-num rounded-full bg-primary px-1.5 text-[10px] text-white">
                          {row.unread}
                        </span>
                      ) : null}
                      {row.priority ? (
                        <span className="rounded-full border border-accent-line bg-accent-soft px-1.5 text-[10.5px] font-semibold text-accent-ink">
                          Priority
                        </span>
                      ) : null}
                      {!row.assignee && row.status !== "resolved" ? (
                        <span className="rounded-full border border-line bg-surface-2 px-1.5 text-[10.5px] text-muted">
                          Nobody assigned
                        </span>
                      ) : null}
                      {row.status === "waiting" ? (
                        <span className="rounded-full border border-line bg-surface-2 px-1.5 text-[10.5px] text-muted">
                          Waiting on customer
                        </span>
                      ) : null}
                      {row.status === "resolved" ? (
                        <span className="rounded-full border border-line bg-surface-2 px-1.5 text-[10.5px] text-muted">
                          Resolved
                        </span>
                      ) : null}
                    </span>
                  </Link>
                </li>
              ))
            )}
          </ol>
        </div>

        {threadProps && contextProps ? (
          <>
            <div className={selectedId ? "block" : "hidden lg:block"}>
              <div className="border-b border-line px-4 py-2 lg:hidden">
                <Link href={href({ c: undefined })} className="text-xs font-semibold text-primary">
                  Back to the list
                </Link>
              </div>
              <Thread {...threadProps} />
            </div>
            <div className="hidden border-t border-line lg:block lg:border-l lg:border-t-0">
              <ContextPanel {...contextProps} />
            </div>
          </>
        ) : (
          <div className="col-span-2 p-6">
            <EmptyState
              title="Nothing matches these filters"
              body="Every request in the demo data belongs to one of the six sources. Clear a filter to bring the list back."
              action={{ label: "Clear the filters", href: "/inbox" }}
            />
          </div>
        )}
      </div>

      <p className="text-xs text-muted">
        Sending is switched off for any channel that is not connected, and the reason is shown in
        the reply box rather than hidden behind a failed send.{" "}
        <Link href="/integrations" className="font-semibold text-primary hover:underline">
          See what is connected
        </Link>
        .
      </p>
    </div>
  );
}
