import { Pill } from "@/components/ui/badges";
import {
  EXPENSE_CATEGORY_SHORT,
  LOW_CONFIDENCE,
  RECEIPT_STATUS_COPY,
  RECEIPT_SOURCE_LABEL,
  confidenceLabel,
  type ExpenseCategory,
  type ReceiptSourceType,
  type ReceiptStatus,
} from "@/lib/domain/receipts";

export function ReceiptStatusPill({ status }: { status: ReceiptStatus }) {
  const copy = RECEIPT_STATUS_COPY[status];
  return (
    <span title={copy.hint}>
      <Pill tone={copy.tone}>{copy.label}</Pill>
    </span>
  );
}

export function CategoryPill({ category }: { category: ExpenseCategory }) {
  return (
    <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary">
      {EXPENSE_CATEGORY_SHORT[category]}
    </span>
  );
}

export function SourcePill({ source }: { source: ReceiptSourceType }) {
  return <span className="text-xs text-muted">{RECEIPT_SOURCE_LABEL[source]}</span>;
}

/**
 * How sure the reader was, next to the field it was unsure about.
 *
 * A number typed by a person carries no confidence at all, and says so. That difference
 * is the point of the review screen, so it is shown rather than averaged away.
 */
export function ConfidenceMark({
  confidence,
  corrected = false,
}: {
  confidence: number | null;
  corrected?: boolean;
}) {
  if (corrected) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
        <span aria-hidden>✎</span> Corrigé à la main
      </span>
    );
  }
  if (confidence === null) {
    return <span className="text-[11px] text-faint">Saisi à la main</span>;
  }

  const low = confidence < LOW_CONFIDENCE;
  const percent = Math.round(confidence * 100);
  return (
    <span
      title={`${confidenceLabel(confidence)}, ${percent} pour cent`}
      className={`inline-flex items-center gap-1 text-[11px] font-semibold ${low ? "text-danger" : "text-muted"}`}
    >
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${low ? "bg-danger" : "bg-success"}`} />
      {low ? "À relire" : "Lu"} · {percent} %
    </span>
  );
}

/**
 * The label that must never move into a tooltip. When no reading service is
 * configured, the figures on a receipt were invented from its file, and every screen
 * that shows them says so in words a person reads without hovering over anything.
 */
export function DemoReaderNotice({ className = "" }: { className?: string }) {
  return (
    <p
      className={`rounded-[var(--radius-md)] border border-accent-line bg-accent-soft px-3 py-2 text-xs font-semibold text-accent-ink ${className}`}
    >
      Mode démonstration : aucun service de lecture n&apos;est connecté. Les montants proposés sont
      inventés à partir du fichier, ils ne sont pas lus dessus. Corrigez-les avant d&apos;enregistrer.
    </p>
  );
}
