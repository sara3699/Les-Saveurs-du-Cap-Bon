import { channel } from "@/lib/domain/channels";
import type { ChannelId, ConnectionStatus, DeliveryStatus, PaymentStatus } from "@/lib/domain/types";

export function ChannelDot({ channelId, size = 8 }: { channelId: ChannelId; size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-block shrink-0 rounded-full"
      style={{ width: size, height: size, background: channel(channelId).colorVar }}
    />
  );
}

/**
 * The badge every screen uses to say where something came from. It always names
 * a channel; there is no fallback wording, because a record without a source
 * never gets this far.
 */
export function SourceBadge({
  channelId,
  account,
  size = "md",
}: {
  channelId: ChannelId;
  account?: string | null;
  size?: "sm" | "md";
}) {
  const def = channel(channelId);
  const pad = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 font-semibold text-ink ${pad}`}
      title={account ? `${def.longLabel}, ${account}` : def.longLabel}
    >
      <ChannelDot channelId={channelId} size={size === "sm" ? 7 : 8} />
      {def.label}
    </span>
  );
}

const PAYMENT_COPY: Record<PaymentStatus, { label: string; tone: Tone }> = {
  paid: { label: "Paid", tone: "success" },
  cash_on_delivery: { label: "On delivery", tone: "accent" },
  pending: { label: "Awaiting payment", tone: "muted" },
  refused: { label: "Refused", tone: "danger" },
  refunded: { label: "Refunded", tone: "danger" },
};

const DELIVERY_COPY: Record<DeliveryStatus, { label: string; tone: Tone }> = {
  preparing: { label: "Preparing", tone: "muted" },
  dispatched: { label: "On the way", tone: "primary" },
  delivered: { label: "Delivered", tone: "success" },
  returned: { label: "Returned", tone: "danger" },
  cancelled: { label: "Cancelled", tone: "muted" },
};

export const CONNECTION_COPY: Record<ConnectionStatus, { label: string; tone: Tone }> = {
  connected: { label: "Connected", tone: "success" },
  setup_required: { label: "Setup required", tone: "accent" },
  not_connected: { label: "Not connected", tone: "muted" },
  warning: { label: "Needs a look", tone: "accent" },
  error: { label: "Not receiving", tone: "danger" },
};

type Tone = "success" | "danger" | "accent" | "muted" | "primary";

const TONES: Record<Tone, string> = {
  success: "bg-success-soft text-success border-success/20",
  danger: "bg-danger-soft text-danger border-danger/20",
  accent: "bg-accent-soft text-accent-ink border-accent-line",
  muted: "bg-surface-2 text-muted border-line",
  primary: "bg-primary-soft text-primary border-primary/15",
};

export function Pill({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-semibold ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

export function PaymentPill({ status }: { status: PaymentStatus }) {
  const copy = PAYMENT_COPY[status];
  return <Pill tone={copy.tone}>{copy.label}</Pill>;
}

export function DeliveryPill({ status }: { status: DeliveryStatus }) {
  const copy = DELIVERY_COPY[status];
  return <Pill tone={copy.tone}>{copy.label}</Pill>;
}

export function ConnectionPill({ status }: { status: ConnectionStatus }) {
  const copy = CONNECTION_COPY[status];
  return <Pill tone={copy.tone}>{copy.label}</Pill>;
}

export function TagChip({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary">
      {label}
    </span>
  );
}
