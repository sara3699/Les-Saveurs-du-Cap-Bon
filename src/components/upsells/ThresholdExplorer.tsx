"use client";

import { useId, useState } from "react";

export interface ThresholdOption {
  value: number;
  /** "200 TND" */
  label: string;
  /** Share of orders in the demo set that reach this basket value, 0 to 100. */
  share: number;
  shareLabel: string;
  reachedLabel: string;
  justShortLabel: string;
}

/**
 * Every number here was worked out on the server from the same orders, so
 * picking a threshold only swaps which answer is shown. Nothing is recomputed
 * in the browser and nothing is saved.
 */
export function ThresholdExplorer({
  options,
  currentValue,
}: {
  options: ThresholdOption[];
  currentValue: number;
}) {
  const [value, setValue] = useState(currentValue);
  const labelId = useId();
  const chosen = options.find((option) => option.value === value) ?? options[0];

  return (
    <div className="rounded-[var(--radius-md)] border border-line bg-surface-2 p-3">
      <p className="os-label" id={labelId}>
        Try another number
      </p>

      <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-labelledby={labelId}>
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => setValue(option.value)}
              className={`os-num rounded-full border px-3 py-1.5 text-[12px] font-semibold ${
                active
                  ? "border-primary bg-primary text-white"
                  : "border-line bg-surface text-muted hover:border-line-strong"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div aria-hidden className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-primary" style={{ width: `${chosen.share}%` }} />
      </div>

      <div role="status" className="mt-2 flex flex-col gap-1">
        <p className="text-[13px] leading-relaxed text-muted">
          At <span className="os-num">{chosen.label}</span>, {chosen.shareLabel} of orders would
          reach free delivery, <span className="os-num">{chosen.reachedLabel}</span>.{" "}
          {chosen.justShortLabel}
        </p>
        <p className="text-[11.5px] text-muted">
          {value === currentValue
            ? "This is the number your shop uses now. Trying another one changes this screen only."
            : "Trying a number here changes this screen only, nothing is saved yet."}
        </p>
      </div>
    </div>
  );
}
