"use client";

import { useState } from "react";
import Link from "next/link";
import { Pill, SourceBadge } from "@/components/ui/badges";
import { Card, EmptyState } from "@/components/ui/surfaces";
import { TypeMarker } from "./TypeMarker";
import { PRIORITY_LABEL, PRIORITY_TONE, type TaskRow } from "./model";

/**
 * Four sections, overdue first, because that is the part of the list the owner
 * loses money on. Ticking a box moves a row into completed in the browser only;
 * nothing is written back, and the screen says so rather than implying a save.
 */
export function TaskBoard({
  rows,
  filtered,
}: {
  rows: TaskRow[];
  filtered: boolean;
}) {
  const [tickedHere, setTickedHere] = useState<string[]>([]);

  function toggle(id: string) {
    setTickedHere((current) =>
      current.includes(id) ? current.filter((other) => other !== id) : [...current, id],
    );
  }

  if (rows.length === 0) {
    return filtered ? (
      <EmptyState
        title="No follow-up matches these filters"
        body="Follow-ups are not typed in here. You make one from a conversation: open the request in the inbox and use the new task action, and it arrives on this screen with the customer, the channel and the date already attached. Clear a filter to see the ones you have."
        action={{ label: "Clear the filters", href: "/tasks" }}
      />
    ) : (
      <EmptyState
        title="Nothing to follow up"
        body="Every follow-up starts as a message. Open a request in the inbox and use the new task action, and it appears here with the customer, the channel it came in on and the date you promised."
        action={{ label: "Open the inbox", href: "/inbox" }}
      />
    );
  }

  const ticked = new Set(tickedHere);
  const open = rows.filter((row) => !row.doneLabel && !ticked.has(row.id));
  const overdue = open.filter((row) => row.bucket === "overdue");
  const today = open.filter((row) => row.bucket === "today");
  const upcoming = open.filter((row) => row.bucket === "upcoming");

  const justTicked = [...tickedHere]
    .reverse()
    .map((id) => rows.find((row) => row.id === id))
    .filter((row): row is TaskRow => Boolean(row));
  const completed = [...justTicked, ...rows.filter((row) => row.doneLabel)];

  return (
    <div className="flex flex-col gap-4">
      {/* The numbers change when a box is ticked, so they are announced rather
          than only redrawn. Wording matches the section headings below, word for
          word, so the strip and the list never look like two different counts. */}
      <div className="flex flex-wrap items-center gap-2" aria-live="polite">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-danger/20 bg-danger-soft px-3 py-1 text-[12.5px] font-semibold text-danger">
          <span className="os-num">{overdue.length}</span> overdue
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-[12.5px] font-semibold text-ink">
          <span className="os-num">{today.length}</span> due today
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-[12.5px] text-muted">
          <span className="os-num">{upcoming.length}</span> upcoming
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-[12.5px] text-muted">
          <span className="os-num">{completed.length}</span> completed
        </span>
      </div>

      <p className="text-xs text-muted">
        Ticking a box moves a follow-up into completed for this visit only. Nothing is saved yet, so
        the list comes back as it was on your next refresh.
      </p>

      <Section
        label="Overdue"
        rows={overdue}
        empty="Nothing is late. Every follow-up still has time on it."
        alarming
        ticked={ticked}
        onToggle={toggle}
      />
      <Section
        label="Due today"
        rows={today}
        empty="Nothing else is due before tonight."
        ticked={ticked}
        onToggle={toggle}
      />
      <Section
        label="Upcoming"
        rows={upcoming}
        empty="Nothing is booked after today."
        ticked={ticked}
        onToggle={toggle}
      />
      <Section
        label="Completed"
        rows={completed}
        empty="Nothing has been ticked off yet."
        ticked={ticked}
        onToggle={toggle}
      />
    </div>
  );
}

function Section({
  label,
  rows,
  empty,
  alarming = false,
  ticked,
  onToggle,
}: {
  label: string;
  rows: TaskRow[];
  empty: string;
  alarming?: boolean;
  ticked: Set<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="os-label">
        {label}, <span className="os-num">{rows.length}</span>
      </h2>
      <Card padded={false} className={alarming && rows.length > 0 ? "border-danger/25" : ""}>
        {rows.length === 0 ? (
          <p className="px-4 py-3.5 text-[13px] text-muted">{empty}</p>
        ) : (
          <ol>
            {rows.map((row) => (
              <TaskLine
                key={row.id}
                row={row}
                done={Boolean(row.doneLabel) || ticked.has(row.id)}
                onToggle={onToggle}
              />
            ))}
          </ol>
        )}
      </Card>
    </section>
  );
}

function TaskLine({
  row,
  done,
  onToggle,
}: {
  row: TaskRow;
  done: boolean;
  onToggle: (id: string) => void;
}) {
  const alreadyDone = Boolean(row.doneLabel);

  return (
    <li className="flex gap-3 border-t border-line px-4 py-3 first:border-t-0 hover:bg-surface-2">
      <input
        type="checkbox"
        checked={done}
        disabled={alreadyDone}
        onChange={() => onToggle(row.id)}
        aria-label={alreadyDone ? `${row.title}, already done` : `Mark done: ${row.title}`}
        className="mt-1 h-4 w-4 shrink-0 accent-primary disabled:cursor-not-allowed"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <TypeMarker type={row.type} />
            <p
              className={`text-[13.5px] font-semibold leading-snug ${
                done ? "text-muted line-through" : "text-ink"
              }`}
            >
              {row.title}
            </p>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px] text-muted">
            {row.contactId && row.customerName ? (
              <Link
                href={`/contacts/${row.contactId}`}
                className="font-semibold text-ink hover:underline"
              >
                {row.customerName}
              </Link>
            ) : (
              <span>Shop work, no customer attached</span>
            )}
            {row.channelId ? (
              <SourceBadge channelId={row.channelId} account={row.account} size="sm" />
            ) : null}
            {row.conversationHref ? (
              <Link href={row.conversationHref} className="font-semibold text-primary hover:underline">
                Open the conversation
              </Link>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
          {done ? (
            alreadyDone ? (
              <p className="os-num text-[12px] text-muted">{row.doneLabel}</p>
            ) : (
              <p className="text-[12px] text-muted">Ticked on this visit</p>
            )
          ) : row.lateLabel ? (
            <>
              <p className="os-num text-[12px] font-semibold text-danger">{row.lateLabel}</p>
              <p className="os-num text-[11px] text-muted">{row.dueLabel}</p>
            </>
          ) : (
            <p className="os-num text-[12px] text-ink">{row.dueLabel}</p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Pill tone={PRIORITY_TONE[row.priority]}>{PRIORITY_LABEL[row.priority]}</Pill>
            <span className="text-[12px] text-muted">{row.ownerName}</span>
          </div>
        </div>
      </div>
    </li>
  );
}
