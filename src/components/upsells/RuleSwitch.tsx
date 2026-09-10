"use client";

import { useState } from "react";

/**
 * The on and off switch for one rule. It moves local state and nothing else:
 * no rule is really started or stopped. The line under the switch says so
 * before it is touched as well as after, so nobody flips it believing the shop
 * changed.
 */
export function RuleSwitch({
  ruleName,
  startsActive,
}: {
  ruleName: string;
  startsActive: boolean;
}) {
  const [on, setOn] = useState(startsActive);
  const changed = on !== startsActive;

  return (
    <div className="mt-auto flex flex-col gap-1.5 border-t border-line pt-3">
      <div className="flex items-center justify-between gap-3">
        <span className={`text-[12.5px] font-semibold ${on ? "text-primary" : "text-muted"}`}>
          {on ? "Running" : "Switched off"}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label={`Turn ${ruleName} ${on ? "off" : "on"}`}
          onClick={() => setOn(!on)}
          className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${
            on ? "border-primary bg-primary" : "border-line-strong bg-surface-2"
          }`}
        >
          <span
            aria-hidden
            className={`absolute top-[2px] h-[18px] w-[18px] rounded-full bg-surface transition-all ${
              on ? "left-[22px]" : "left-[2px]"
            }`}
          />
        </button>
      </div>
      <p role="status" className="text-[11.5px] text-muted">
        {changed
          ? "Changed on this screen only, nothing is saved yet."
          : "Moving this switch changes this screen only, nothing is saved yet."}
      </p>
    </div>
  );
}
