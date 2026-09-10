import Link from "next/link";
import { Pill, SourceBadge } from "@/components/ui/badges";
import { stageIndex, stageLabel, type PipelineCard } from "./types";

const STAGE_TONE = {
  new: "primary",
  contacted: "muted",
  qualified: "muted",
  proposal: "accent",
  won: "success",
  lost: "danger",
} as const;

/**
 * The same leads as the board, as rows. It exists for a phone and for anyone
 * working down the page with a keyboard, so it repeats every field a card shows.
 */
export function PipelineList({ cards }: { cards: PipelineCard[] }) {
  const rows = [...cards].sort(
    (a, b) => stageIndex(a.stage) - stageIndex(b.stage) || b.value - a.value,
  );

  return (
    <div className="os-scroll">
      <table className="w-full min-w-[960px] border-collapse text-sm">
        <thead>
          <tr>
            <th className="os-label pb-2.5 pr-3 text-left font-normal">Customer</th>
            <th className="os-label pb-2.5 pr-3 text-left font-normal">Source</th>
            <th className="os-label pb-2.5 pr-3 text-left font-normal">Stage</th>
            <th className="os-label pb-2.5 pr-3 text-left font-normal">Owner</th>
            <th className="os-label pb-2.5 pr-3 text-left font-normal">Next step</th>
            <th className="os-label pb-2.5 pr-3 text-left font-normal">Age</th>
            <th className="os-label pb-2.5 text-right font-normal">Value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((card) => (
            <tr key={card.id} className="border-t border-line align-top hover:bg-surface-2">
              <td className="py-2.5 pr-3">
                <Link
                  href={card.contactHref}
                  className="text-[13px] font-semibold text-primary hover:underline"
                >
                  {card.contactName}
                </Link>
              </td>
              <td className="py-2.5 pr-3">
                <SourceBadge channelId={card.channelId} account={card.account} size="sm" />
              </td>
              <td className="py-2.5 pr-3">
                <Pill tone={STAGE_TONE[card.stage]}>{stageLabel(card.stage)}</Pill>
                {card.stage === "lost" && card.lostReason ? (
                  <span className="mt-1 block text-[11px] text-muted">{card.lostReason}</span>
                ) : null}
              </td>
              <td className="py-2.5 pr-3 text-[13px] text-muted">
                {card.owner ?? <span className="font-semibold text-danger">Nobody yet</span>}
              </td>
              <td className="py-2.5 pr-3 text-[12.5px]">
                {card.nextStep ? (
                  <>
                    <span className="block leading-snug">{card.nextStep.title}</span>
                    <span
                      className={`os-num block text-[11px] ${
                        card.nextStep.overdue ? "font-semibold text-danger" : "text-muted"
                      }`}
                    >
                      {card.nextStep.overdue
                        ? `Late, was due ${card.nextStep.dueLabel}`
                        : `Due ${card.nextStep.dueLabel}`}
                    </span>
                  </>
                ) : (
                  <span className="text-faint">Nothing written down</span>
                )}
              </td>
              <td className="py-2.5 pr-3 text-[12.5px] text-muted">
                <span className="os-num">{card.ageLabel}</span>
                <span className="block text-[11px]">Opened {card.openedLabel}</span>
              </td>
              <td className="os-num py-2.5 text-right text-[12.5px] font-semibold">
                {card.valueLabel}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
