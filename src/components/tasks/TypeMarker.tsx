import type { TaskType } from "@/lib/domain/types";
import { TYPE_LABEL, TYPE_SWATCH } from "./model";

/**
 * The kind of follow-up, said in a word. A square swatch on purpose: a round dot
 * already means a channel everywhere else in the product, and the two must not
 * be read as the same thing.
 */
export function TypeMarker({ type }: { type: TaskType }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface-2 px-2 py-[3px] text-[11px] font-semibold text-ink">
      <span aria-hidden className={`h-2.5 w-2.5 rounded-[3px] ${TYPE_SWATCH[type]}`} />
      {TYPE_LABEL[type]}
    </span>
  );
}
