import { Pill } from "@/components/ui/badges";
import { formatPercent } from "@/lib/format";

/**
 * A budget or a line counts as close to its limit at 95 percent of the plan.
 * The threshold lives here so the tiles, the summary table and the line tables
 * cannot drift apart on what a warning means.
 */
export const LIMIT_SHARE = 95;

export type SpendTone = "ok" | "close" | "over";

export function shareUsed(used: number, planned: number): number {
  if (planned <= 0) return 0;
  return (used / planned) * 100;
}

/** One decimal, so a line at 99.7 percent is never rounded up to its limit. */
export function shareLabel(used: number, planned: number): string {
  return formatPercent(shareUsed(used, planned), 1);
}

export function spendTone(used: number, planned: number): SpendTone {
  if (used > planned) return "over";
  if (shareUsed(used, planned) >= LIMIT_SHARE) return "close";
  return "ok";
}

/** Wording, so a line that is exactly spent is not described as close to it. */
export function limitLabel(used: number, planned: number): string {
  if (used > planned) return "Depassement du plan";
  if (used === planned) return "Entierement utilisé";
  return "Proche de la limite";
}

/** Nothing is rendered while a line still has room, which keeps the yellow rare. */
export function LimitPill({
  used,
  planned,
  className = "",
}: {
  used: number;
  planned: number;
  className?: string;
}) {
  const tone = spendTone(used, planned);
  if (tone === "ok") return null;
  return (
    <span className={`block ${className}`}>
      <Pill tone={tone === "over" ? "danger" : "accent"}>{limitLabel(used, planned)}</Pill>
    </span>
  );
}

const BAR: Record<SpendTone, string> = {
  ok: "bg-primary",
  close: "bg-accent",
  over: "bg-danger",
};

const SHARE_TEXT: Record<SpendTone, string> = {
  ok: "text-muted",
  close: "text-accent-ink",
  over: "text-danger",
};

/** The bar is capped at full width, while the figure beside it tells the truth. */
export function Meter({
  used,
  planned,
  showShare = true,
  className = "",
}: {
  used: number;
  planned: number;
  showShare?: boolean;
  className?: string;
}) {
  const share = shareUsed(used, planned);
  const tone = spendTone(used, planned);
  // When the figure is printed underneath, the bar is decoration and is hidden
  // from a screen reader, so the share is not announced twice in a row.
  const labelled = !showShare;
  return (
    <span className={`block ${className}`}>
      <span
        role={labelled ? "img" : undefined}
        aria-label={labelled ? `${formatPercent(share, 1)} du plan utilisé` : undefined}
        aria-hidden={labelled ? undefined : true}
        className="block h-1.5 w-full min-w-[70px] overflow-hidden rounded-full bg-surface-2 ring-1 ring-line"
      >
        <span
          className={`block h-full rounded-full ${BAR[tone]}`}
          style={{ width: `${Math.min(share, 100)}%` }}
        />
      </span>
      {showShare ? (
        <span className={`os-num mt-1 block text-[11px] ${SHARE_TEXT[tone]}`}>
          {formatPercent(share, 1)}
        </span>
      ) : null}
    </span>
  );
}
