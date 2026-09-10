import Link from "next/link";
import { TaskBoard } from "@/components/tasks/TaskBoard";
import { TypeMarker } from "@/components/tasks/TypeMarker";
import {
  TASK_TYPES,
  TYPE_LABEL,
  TYPE_MEANING,
  bucketFor,
  dueInWords,
  lateInWords,
  type TaskRow,
} from "@/components/tasks/model";
import { Card, CardHead, DemoChip, PageHeader } from "@/components/ui/surfaces";
import { buildAttributionIndex, resolveSource } from "@/lib/domain/attribution";
import { isOverdue, timeAgo } from "@/lib/format";
import { DEMO_NOW } from "@/lib/mock/time";
import { getRepositories } from "@/lib/repositories";

export const metadata = { title: "Tasks, Les Saveurs du Cap Bon" };

// The demo clock moves with the visit, so due dates are worked out per request
// rather than frozen into the build.
export const dynamic = "force-dynamic";

type Params = Promise<Record<string, string | string[] | undefined>>;

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TasksPage({ searchParams }: { searchParams: Params }) {
  const params = await searchParams;
  const requestedOwner = one(params.owner);
  const requestedType = one(params.type);

  const repos = getRepositories();
  const [tasks, contacts, team, conversations, connections, attributions] = await Promise.all([
    repos.workspace.tasks(),
    repos.contacts.list(),
    repos.workspace.team(),
    repos.conversations.list(),
    repos.integrations.list(),
    repos.workspace.attributions(),
  ]);

  // A filter value no chip on this screen can produce is ignored rather than
  // obeyed. A hand typed or stale link then shows the whole list, instead of an
  // empty screen with no chip lit to explain why.
  const type = TASK_TYPES.find((id) => id === requestedType);
  const owner = team.some((member) => member.id === requestedOwner) ? requestedOwner : undefined;

  const index = buildAttributionIndex(attributions, connections);
  const contactById = new Map(contacts.map((c) => [c.id, c]));
  const teamById = new Map(team.map((m) => [m.id, m]));
  const conversationById = new Map(conversations.map((c) => [c.id, c]));

  const visible = tasks.filter(
    (task) => (!owner || task.assigneeId === owner) && (!type || task.type === type),
  );

  // Open follow-ups by the date they were promised, completed ones newest first.
  const ordered = [
    ...visible.filter((t) => !t.completedAt).sort((a, b) => a.dueAt.localeCompare(b.dueAt)),
    ...visible
      .filter((t) => t.completedAt)
      .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? "")),
  ];

  const rows: TaskRow[] = ordered.map((task) => {
    const contact = task.contactId ? contactById.get(task.contactId) ?? null : null;
    const conversation = task.conversationId ? conversationById.get(task.conversationId) ?? null : null;
    // The channel comes from the conversation's attribution record. A follow-up
    // that has only a customer falls back to the channel that customer last
    // arrived on, which is still a stored channel and never a guess.
    const source = conversation ? resolveSource(conversation.attributionId, index) : null;
    const late = !task.completedAt && isOverdue(task.dueAt, DEMO_NOW);

    return {
      id: task.id,
      title: task.title,
      type: task.type,
      bucket: bucketFor(task.dueAt, DEMO_NOW),
      contactId: contact?.id ?? null,
      customerName: contact?.name ?? null,
      conversationHref: conversation ? `/inbox?c=${conversation.id}` : null,
      channelId: source?.channelId ?? contact?.latestTouchChannel ?? null,
      account: source?.accountLabel ?? null,
      dueLabel: dueInWords(task.dueAt, DEMO_NOW),
      lateLabel: late ? lateInWords(task.dueAt, DEMO_NOW) : null,
      // Every follow-up carries an owner, so a miss here means the person has
      // left the team list, not that the work is unclaimed. Say that, rather
      // than inventing an unassigned state the data does not have.
      ownerName: teamById.get(task.assigneeId)?.name ?? "Owner not on the team list",
      priority: task.priority,
      doneLabel: task.completedAt ? `Done ${timeAgo(task.completedAt, DEMO_NOW)}` : null,
    };
  });

  const keep = (extra: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const merged: Record<string, string | undefined> = { owner, type, ...extra };
    for (const [key, value] of Object.entries(merged)) if (value) next.set(key, value);
    const qs = next.toString();
    return qs ? `/tasks?${qs}` : "/tasks";
  };

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-xs font-semibold ${
      active ? "border-primary bg-primary text-white" : "border-line bg-surface-2 text-muted"
    }`;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Tasks"
        subtitle="The follow-ups your team owes a customer, overdue at the top. Each one keeps the conversation it came from, so you can read the promise before you keep it."
        actions={<DemoChip />}
      />

      <Card>
        <div className="flex flex-col gap-3">
          <div role="group" aria-labelledby="tasks-owner-filter">
            <p id="tasks-owner-filter" className="os-label mb-1.5">
              Owner
            </p>
            <div className="flex flex-wrap gap-1.5">
              <Link
                href={keep({ owner: undefined })}
                aria-current={owner ? undefined : "true"}
                className={chip(!owner)}
              >
                Anyone
              </Link>
              {team.map((member) => (
                <Link
                  key={member.id}
                  href={keep({ owner: owner === member.id ? undefined : member.id })}
                  aria-current={owner === member.id ? "true" : undefined}
                  className={chip(owner === member.id)}
                >
                  {member.name}
                </Link>
              ))}
            </div>
          </div>

          <div
            role="group"
            aria-labelledby="tasks-kind-filter"
            className="border-t border-line pt-3"
          >
            <p id="tasks-kind-filter" className="os-label mb-1.5">
              Kind of follow-up
            </p>
            <div className="flex flex-wrap gap-1.5">
              <Link
                href={keep({ type: undefined })}
                aria-current={type ? undefined : "true"}
                className={chip(!type)}
              >
                Every kind
              </Link>
              {TASK_TYPES.map((id) => (
                <Link
                  key={id}
                  href={keep({ type: type === id ? undefined : id })}
                  aria-current={type === id ? "true" : undefined}
                  className={chip(type === id)}
                >
                  {TYPE_LABEL[id]}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <TaskBoard rows={rows} filtered={Boolean(owner || type)} />

        <aside className="flex flex-col gap-4">
          <Card>
            <CardHead title="Where a follow-up comes from" />
            <p className="text-[13px] leading-relaxed text-muted">
              Every line on this screen started as a message. Open the request in the inbox, use the
              new task action on that conversation, and the follow-up lands here carrying the
              customer, the channel it arrived on and the date you promised.
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">
              There is no add button here. Creating a follow-up from this screen is designed but not
              built, and a form that saved nothing would waste your morning.
            </p>
            <Link
              href="/inbox"
              className="mt-3 inline-block rounded-[var(--radius-md)] bg-primary px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-primary-hi"
            >
              Open the inbox
            </Link>
          </Card>

          <Card>
            <CardHead
              title="What the markers mean"
              hint="Yellow marks the ones with a price attached."
            />
            <ul className="flex flex-col gap-2.5">
              {TASK_TYPES.map((id) => (
                // items-start, or the column stretches the marker pill across
                // the whole card instead of letting it hug its label.
                <li key={id} className="flex flex-col items-start gap-1">
                  <TypeMarker type={id} />
                  <p className="text-[12px] leading-relaxed text-muted">{TYPE_MEANING[id]}</p>
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  );
}
