import Link from "next/link";
import { ChannelDot, DeliveryPill, PaymentPill, SourceBadge } from "@/components/ui/badges";
import { EmptyState } from "@/components/ui/surfaces";
import type { ChannelId, DeliveryStatus, PaymentStatus } from "@/lib/domain/types";

/**
 * One customer, one list, whichever platform the thing arrived on.
 *
 * Every timestamp is formatted on the server and handed down as a string, the
 * same way the inbox does it, so this component never touches a clock. An entry
 * that has a channel always shows it; an entry that has none, a task or an
 * internal note, says so in words rather than borrowing a channel it never had.
 */

interface Base {
  id: string;
  /** ISO timestamp. The page sorts on it; the row hands it to <time dateTime>. */
  at: string;
  /** "5h ago", "yesterday", or a date once that stops being useful. */
  stamp: string;
  /** The full date and time, shown on hover. */
  exact: string;
}

export type TimelineEntry =
  | (Base & {
      kind: "order";
      channelId: ChannelId;
      account: string | null;
      reference: string;
      href: string;
      totalLabel: string;
      payment: PaymentStatus;
      delivery: DeliveryStatus;
      contents: string;
    })
  | (Base & {
      kind: "conversation";
      channelId: ChannelId;
      account: string | null;
      subject: string;
      href: string;
      state: string;
      lastLine: string | null;
    })
  | (Base & {
      kind: "task";
      title: string;
      state: string;
      overdue: boolean;
      done: boolean;
      owner: string;
    })
  | (Base & { kind: "note"; body: string; author: string });

export function ActivityTimeline({
  entries,
  name,
  visible = 18,
}: {
  entries: TimelineEntry[];
  name: string;
  visible?: number;
}) {
  if (entries.length === 0) {
    return (
      <EmptyState
        title="Rien ne s'est encore passé sur cette fiche"
        body={`Aucun message, commande, tâche ou note n'est rattaché à ${name}. Tout ce qui arrive sur WhatsApp, Instagram, Facebook, Google, le site web ou au comptoir apparaît ici.`}
        action={{ label: "Ouvrir la boîte de réception", href: "/inbox" }}
      />
    );
  }

  const recent = entries.slice(0, visible);
  const older = entries.slice(visible);

  return (
    <>
      <ol className="flex flex-col">
        {recent.map((entry, position) => (
          <Row
            key={entry.id}
            entry={entry}
            rail={position < recent.length - 1 || older.length > 0}
          />
        ))}
      </ol>

      {older.length > 0 ? (
        <details className="mt-1 border-t border-line pt-3">
          <summary className="cursor-pointer text-[13px] font-semibold text-primary">
            Afficher les <span className="os-num">{older.length}</span> entrées plus anciennes
          </summary>
          <ol className="mt-3 flex flex-col">
            {older.map((entry, position) => (
              <Row key={entry.id} entry={entry} rail={position < older.length - 1} />
            ))}
          </ol>
        </details>
      ) : null}
    </>
  );
}

function Row({ entry, rail }: { entry: TimelineEntry; rail: boolean }) {
  return (
    <li className="relative pl-6">
      {rail ? (
        <span aria-hidden className="absolute left-[3px] top-4 h-full w-px bg-line" />
      ) : null}
      <span className="absolute left-0 top-[7px]">
        {entry.kind === "order" || entry.kind === "conversation" ? (
          <ChannelDot channelId={entry.channelId} size={7} />
        ) : (
          <span aria-hidden className="block h-[7px] w-[7px] rounded-full bg-line-strong" />
        )}
      </span>

      <div className="pb-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <p className="text-[13.5px] font-semibold leading-snug">
            {entry.kind === "order" ? (
              <>
                <Link href={entry.href} className="text-primary hover:underline">
                  {entry.reference}
                </Link>
                <span className="os-num ml-2">{entry.totalLabel}</span>
              </>
            ) : null}
            {/* Coloured like the order référence above it: a task title and a
                conversation subject sit at the same size and weight, so the one
                you can click has to say so without waiting for a hover. */}
            {entry.kind === "conversation" ? (
              <Link href={entry.href} className="text-primary hover:underline">
                {entry.subject}
              </Link>
            ) : null}
            {entry.kind === "task" ? entry.title : null}
            {entry.kind === "note" ? `Note de ${entry.author}` : null}
          </p>
          <time
            dateTime={entry.at}
            className="os-num shrink-0 text-[11px] text-muted"
            title={entry.exact}
          >
            {entry.stamp}
          </time>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {entry.kind === "order" ? (
            <>
              <SourceBadge channelId={entry.channelId} account={entry.account} size="sm" />
              <PaymentPill status={entry.payment} />
              <DeliveryPill status={entry.delivery} />
            </>
          ) : null}
          {entry.kind === "conversation" ? (
            <>
              <SourceBadge channelId={entry.channelId} account={entry.account} size="sm" />
              <span className="text-[11.5px] text-muted">{entry.state}</span>
            </>
          ) : null}
          {entry.kind === "task" ? (
            <>
              <Marker label="Tâche" />
              <span
                className={`text-[11.5px] ${entry.overdue ? "font-semibold text-danger" : "text-muted"}`}
              >
                {entry.state}
              </span>
              <span className="text-[11.5px] text-muted">pour {entry.owner}</span>
            </>
          ) : null}
          {entry.kind === "note" ? <Marker label="Note" /> : null}
        </div>

        {entry.kind === "order" ? (
          <p className="mt-1 text-[12.5px] text-muted">{entry.contents}</p>
        ) : null}
        {entry.kind === "conversation" && entry.lastLine ? (
          <p className="mt-1 text-[12.5px] text-muted">{entry.lastLine}</p>
        ) : null}
        {entry.kind === "note" ? (
          <p className="mt-1 text-[12.5px] text-muted">{entry.body}</p>
        ) : null}
      </div>
    </li>
  );
}

/** Stands where a source badge stands, so rows line up, and never names a channel. */
function Marker({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-line bg-surface-2 px-2 py-0.5 text-[11px] font-semibold text-muted">
      {label}
    </span>
  );
}
