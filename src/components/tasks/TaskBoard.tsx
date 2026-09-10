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
        title="Aucune relance ne correspond a ces filtres"
        body="Les relances ne se saisissent pas ici. Vous en creez une depuis une conversation. Ouvrez la demande dans la boîte de réception et utilisez l'action nouvelle tache, et elle arrive sur cet écran avec le client, le canal et la date déjà attaches. Retirez un filtre pour voir celles que vous avez."
        action={{ label: "Retirer les filtres", href: "/tasks" }}
      />
    ) : (
      <EmptyState
        title="Aucune relance en cours"
        body="Chaque relance commence par un message. Ouvrez une demande dans la boîte de réception et utilisez l'action nouvelle tache, et elle apparait ici avec le client, le canal par lequel elle est arrivée et la date que vous avez promise."
        action={{ label: "Ouvrir la boîte de réception", href: "/inbox" }}
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
          <span className="os-num">{overdue.length}</span> en retard
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-[12.5px] font-semibold text-ink">
          <span className="os-num">{today.length}</span> {"a faire aujourd'hui"}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-[12.5px] text-muted">
          <span className="os-num">{upcoming.length}</span> a venir
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-[12.5px] text-muted">
          <span className="os-num">{completed.length}</span> terminées
        </span>
      </div>

      <p className="text-xs text-muted">
        {"Cocher une case deplace une relance dans les terminées pour cette visite seulement. "}
        {"Rien n'est enregistré pour l'instant, la liste revient telle qu'elle était a votre "}
        {"prochain rafraichissement."}
      </p>

      <Section
        label="En retard"
        rows={overdue}
        empty="Rien n'est en retard. Chaque relance a encore du temps devant elle."
        alarming
        ticked={ticked}
        onToggle={toggle}
      />
      <Section
        label="A faire aujourd'hui"
        rows={today}
        empty="Rien d'autre n'est a faire avant ce soir."
        ticked={ticked}
        onToggle={toggle}
      />
      <Section
        label="A venir"
        rows={upcoming}
        empty="Rien n'est prévu après aujourd'hui."
        ticked={ticked}
        onToggle={toggle}
      />
      <Section
        label="Terminées"
        rows={completed}
        empty="Rien n'a encore été coche."
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
        aria-label={
          alreadyDone ? `${row.title}, déjà terminee` : `Marquer comme terminee, ${row.title}`
        }
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
              <span>Travail de boutique, aucun client attache</span>
            )}
            {row.channelId ? (
              <SourceBadge channelId={row.channelId} account={row.account} size="sm" />
            ) : null}
            {row.conversationHref ? (
              <Link href={row.conversationHref} className="font-semibold text-primary hover:underline">
                Ouvrir la conversation
              </Link>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
          {done ? (
            alreadyDone ? (
              <p className="os-num text-[12px] text-muted">{row.doneLabel}</p>
            ) : (
              <p className="text-[12px] text-muted">Cochee pendant cette visite</p>
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
