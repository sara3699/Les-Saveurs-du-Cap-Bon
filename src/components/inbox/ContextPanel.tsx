import Link from "next/link";
import { SourceBadge, TagChip } from "@/components/ui/badges";
import { channel } from "@/lib/domain/channels";
import type { ChannelId } from "@/lib/domain/types";

export interface ContextPanelProps {
  contactId: string;
  name: string;
  initials: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  language: string;
  firstTouch: ChannelId;
  latestTouch: ChannelId;
  firstContactLabel: string;
  stage: string;
  tags: string[];
  leadScore: number;
  leadScoreReasons: string[];
  lifetimeLabel: string;
  tasks: { id: string; title: string; dueLabel: string; overdue: boolean }[];
  notes: { id: string; author: string; stamp: string; body: string }[];
  timeline: { id: string; label: string; stamp: string; channelId: ChannelId | null }[];
}

export function ContextPanel(props: ContextPanelProps) {
  const moved = props.firstTouch !== props.latestTouch;
  return (
    <aside className="flex flex-col gap-3.5 overflow-y-auto p-4">
      <div className="flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-primary-soft font-display text-[13px] font-bold text-primary">
          {props.initials}
        </span>
        <span>
          <Link href={`/contacts/${props.contactId}`} className="block text-sm font-semibold leading-tight hover:underline">
            {props.name}
          </Link>
          <span className="block text-[11.5px] text-muted">
            {[props.city, `speaks ${props.language}`].filter(Boolean).join(", ")}
          </span>
        </span>
      </div>

      <dl className="flex flex-col gap-1.5 text-[12px]">
        <Row label="Phone" value={props.phone ?? "Not given"} mono />
        <Row label="Email" value={props.email ?? "Not given"} />
        <Row label="First came from" value={channel(props.firstTouch).label} />
        <Row label="Most recent" value={channel(props.latestTouch).label} />
        <Row label="First contact" value={props.firstContactLabel} />
        <Row label="Stage" value={props.stage} />
        <Row label="Spent so far" value={props.lifetimeLabel} mono />
      </dl>

      {moved ? (
        <p className="rounded-[var(--radius-sm)] border border-line bg-surface-2 px-3 py-2 text-[11.5px] text-muted">
          She arrived through {channel(props.firstTouch).label} and now writes on{" "}
          {channel(props.latestTouch).label}. The first channel stays on the record.
        </p>
      ) : null}

      <div className="rounded-[var(--radius-md)] border border-accent-line bg-accent-soft px-3 py-2.5">
        <div className="flex items-baseline justify-between">
          <span className="os-label text-accent-ink">Lead score</span>
          <span className="os-num font-display text-[22px] font-bold text-accent-ink">{props.leadScore}</span>
        </div>
        <ul className="mt-1.5 flex flex-col gap-1 text-[11.5px] text-accent-ink">
          {props.leadScoreReasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      </div>

      {props.tags.length > 0 ? (
        <div>
          <p className="os-label mb-1.5">Tags</p>
          <div className="flex flex-wrap gap-1.5">
            {props.tags.map((tag) => (
              <TagChip key={tag} label={tag} />
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <p className="os-label mb-1.5">Open tasks</p>
        {props.tasks.length === 0 ? (
          <p className="text-[12px] text-muted">No follow up is booked for this customer.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {props.tasks.map((task) => (
              <li key={task.id} className="flex items-start gap-2 text-[12px]">
                <span className="mt-0.5 h-3 w-3 shrink-0 rounded-[4px] border-[1.5px] border-line-strong" />
                <span>
                  {task.title}
                  <span className={`block text-[11px] ${task.overdue ? "text-danger" : "text-muted"}`}>
                    {task.overdue ? `Overdue by ${task.dueLabel}` : `Due ${task.dueLabel}`}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {props.notes.length > 0 ? (
        <div>
          <p className="os-label mb-1.5">Notes</p>
          <ul className="flex flex-col gap-2">
            {props.notes.map((note) => (
              <li key={note.id} className="rounded-[var(--radius-sm)] border border-line bg-surface-2 px-2.5 py-2 text-[12px]">
                {note.body}
                <span className="mt-1 block text-[11px] text-muted">
                  {note.author}, {note.stamp}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div>
        <p className="os-label mb-1.5">Across every channel</p>
        <ul className="flex flex-col gap-2">
          {props.timeline.map((entry) => (
            <li key={entry.id} className="flex items-start gap-2 text-[12px]">
              {entry.channelId ? (
                <SourceBadge channelId={entry.channelId} size="sm" />
              ) : (
                <span className="os-label pt-1">Team</span>
              )}
              <span className="min-w-0">
                <span className="block">{entry.label}</span>
                <span className="block text-[11px] text-muted">{entry.stamp}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className={`text-right font-medium ${mono ? "os-num" : ""}`}>{value}</dd>
    </div>
  );
}
