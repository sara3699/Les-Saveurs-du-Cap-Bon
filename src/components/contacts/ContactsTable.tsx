import Link from "next/link";
import { Pill, SourceBadge } from "@/components/ui/badges";
import { EmptyState } from "@/components/ui/surfaces";
import { channel } from "@/lib/domain/channels";
import type { ChannelId, PipelineStage } from "@/lib/domain/types";

/** The tones Pill accepts. badges.tsx keeps its own union private, so this
 *  repeats it the way the customer detail page does. */
type PillTone = "success" | "danger" | "accent" | "muted" | "primary";

/**
 * The stage wording the owner uses out loud. "Proposal" is a quote she has
 * already sent, so it is marked as money waiting to land rather than as
 * another neutral step.
 */
export const STAGE_COPY: Record<PipelineStage, { label: string; tone: PillTone }> = {
  new: { label: "New", tone: "muted" },
  contacted: { label: "Contacted", tone: "muted" },
  qualified: { label: "Qualified", tone: "primary" },
  proposal: { label: "Quote sent", tone: "accent" },
  won: { label: "Won", tone: "success" },
  lost: { label: "Lost", tone: "danger" },
};

export interface ContactRow {
  id: string;
  name: string;
  href: string;
  firstTouch: ChannelId;
  firstAccount: string | null;
  latestTouch: ChannelId;
  latestAccount: string | null;
  /** True when the customer arrived on one channel and now writes on another. */
  moved: boolean;
  city: string | null;
  phone: string | null;
  stage: PipelineStage;
  lifetimeLabel: string;
  spent: boolean;
  owner: string | null;
  /** Set when another record holds the same phone number or email address. */
  duplicateNote: string | null;
}

export function ContactsTable({ rows }: { rows: ContactRow[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="No customer matches these filters"
        body="Clear a filter to widen the list. Searching runs over the name, the phone number and the email address, so a partial number finds the record too."
        action={{ label: "Clear the filters", href: "/contacts" }}
      />
    );
  }

  return (
    <div className="os-scroll">
      <table className="w-full min-w-[1040px] border-collapse text-sm">
        <thead>
          <tr>
            <th className="os-label pb-2.5 pr-3 text-left font-normal">Customer</th>
            <th className="os-label pb-2.5 pr-3 text-left font-normal">First touch</th>
            <th className="os-label pb-2.5 pr-3 text-left font-normal">Most recent</th>
            <th className="os-label pb-2.5 pr-3 text-left font-normal">City</th>
            <th className="os-label pb-2.5 pr-3 text-left font-normal">Phone</th>
            <th className="os-label pb-2.5 pr-3 text-left font-normal">Stage</th>
            <th className="os-label pb-2.5 pr-3 text-right font-normal">Lifetime value, TND</th>
            <th className="os-label pb-2.5 text-left font-normal">Owner</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-line align-top hover:bg-surface-2">
              <td className="py-2.5 pr-3">
                <Link href={row.href} className="text-[13px] font-semibold text-primary hover:underline">
                  {row.name}
                </Link>
                {row.duplicateNote ? (
                  <span className="mt-1 flex items-center gap-1.5 text-[10.5px] font-semibold text-accent-ink">
                    <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    {row.duplicateNote}
                  </span>
                ) : null}
              </td>
              <td className="py-2.5 pr-3">
                <SourceBadge channelId={row.firstTouch} account={row.firstAccount} size="sm" />
              </td>
              <td className="py-2.5 pr-3">
                <SourceBadge channelId={row.latestTouch} account={row.latestAccount} size="sm" />
                {row.moved ? (
                  <span className="mt-1 block text-[10.5px] font-semibold text-primary">
                    Arrived on {channel(row.firstTouch).label}
                  </span>
                ) : null}
              </td>
              <td className="py-2.5 pr-3 text-[13px]">
                {row.city ?? <span className="text-faint">Not given</span>}
              </td>
              <td className="py-2.5 pr-3">
                {row.phone ? (
                  <span className="os-num text-[12.5px]">{row.phone}</span>
                ) : (
                  <span className="text-[12.5px] text-faint">No number yet</span>
                )}
              </td>
              <td className="py-2.5 pr-3">
                <Pill tone={STAGE_COPY[row.stage].tone}>{STAGE_COPY[row.stage].label}</Pill>
              </td>
              <td className="py-2.5 pr-3 text-right">
                <span className={`os-num text-[12.5px] ${row.spent ? "" : "text-faint"}`}>
                  {row.lifetimeLabel}
                </span>
              </td>
              <td className="py-2.5 text-[13px] text-muted">
                {row.owner ?? <span className="text-faint">Nobody yet</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
