import Link from "next/link";
import { ChannelDot } from "@/components/ui/badges";
import { Card, CardHead } from "@/components/ui/surfaces";
import { channel } from "@/lib/domain/channels";
import { formatTND, formatTNDCompact } from "@/lib/format";
import type { DayBar, DeliverySplit, SourceRow } from "@/lib/metrics";
import type { ChannelId } from "@/lib/domain/types";
import type { ConnectionStatus } from "@/lib/domain/types";
import type { ConversionSummary } from "@/lib/metrics";

export function SourcePanel({ rows, periodLabel }: { rows: SourceRow[]; periodLabel: string }) {
  const max = Math.max(...rows.map((r) => r.orders), 1);
  return (
    <Card>
      <CardHead
        title="Where your orders come from"
        hint={`${periodLabel}, by the channel the request arrived on`}
        action={
          <Link href="/statistics" className="text-xs font-semibold text-primary hover:underline">
            Compare channels
          </Link>
        }
      />
      <div className="os-scroll">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="os-label pb-2 text-left font-normal">Channel</th>
              <th className="os-label pb-2 text-left font-normal">Share</th>
              <th className="os-label pb-2 text-right font-normal">Orders</th>
              <th className="os-label pb-2 text-right font-normal">Revenue</th>
              <th className="os-label pb-2 text-right font-normal">Trend</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.channelId} className="border-t border-line">
                <td className="py-2.5 pr-3">
                  <span className="flex items-center gap-2 font-semibold">
                    <ChannelDot channelId={row.channelId} size={9} />
                    {row.label}
                  </span>
                </td>
                <td className="py-2.5 pr-3">
                  <span className="block h-1.5 w-full min-w-[70px] overflow-hidden rounded-full bg-surface-2 ring-1 ring-line">
                    <span
                      className="block h-full rounded-full"
                      style={{
                        width: `${(row.orders / max) * 100}%`,
                        background: channel(row.channelId).colorVar,
                      }}
                    />
                  </span>
                  <span className="os-num mt-1 block text-[11px] text-muted">
                    {row.share.toFixed(0)}%
                  </span>
                </td>
                <td className="os-num py-2.5 pr-3 text-right text-[13px]">{row.orders}</td>
                <td className="os-num py-2.5 pr-3 text-right text-[13px]">
                  {formatTND(row.revenue, { withCurrency: false })}
                </td>
                <td className="os-num py-2.5 text-right text-[12px]">
                  {row.trend === null ? (
                    <span className="text-faint">new</span>
                  ) : (
                    <span className={row.trend >= 0 ? "text-success" : "text-danger"}>
                      {row.trend >= 0 ? "+" : ""}
                      {row.trend.toFixed(0)}%
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted">
        Revenue leaves out refused and refunded orders. The order count keeps them, which is why
        the two columns do not move together.
      </p>
    </Card>
  );
}

export interface AttentionItem {
  id: string;
  title: string;
  detail: string;
  href: string;
  severity: "warning" | "error";
}

export function AttentionPanel({ items }: { items: AttentionItem[] }) {
  return (
    <Card>
      <CardHead title="Needs attention" hint={`${items.length} things nobody has picked up`} />
      {items.length === 0 ? (
        <p className="rounded-[var(--radius-md)] border border-dashed border-line-strong bg-surface-2 px-4 py-6 text-center text-sm text-muted">
          Nothing is waiting. Every request has an owner and no follow up is late.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="flex items-start gap-2.5 rounded-[var(--radius-md)] border border-line bg-surface-2 px-3 py-2.5 hover:border-line-strong"
              >
                <span
                  className={`w-[3px] shrink-0 self-stretch rounded ${
                    item.severity === "error" ? "bg-danger" : "bg-accent"
                  }`}
                />
                <span>
                  <span className="block text-[13px] font-semibold leading-snug">{item.title}</span>
                  <span className="block text-xs text-muted">{item.detail}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function DayChart({ bars }: { bars: DayBar[] }) {
  const max = Math.max(...bars.map((b) => b.confirmed + b.abandoned), 1);
  const confirmed = bars.reduce((s, b) => s + b.confirmed, 0);
  const abandoned = bars.reduce((s, b) => s + b.abandoned, 0);
  const total = confirmed + abandoned || 1;

  return (
    <Card>
      <CardHead title="Orders per day" hint="Confirmed against abandoned, last 7 days" />
      <div className="flex h-[132px] items-end gap-2.5">
        {bars.map((bar, i) => (
          <div key={`${bar.label}-${i}`} className="flex flex-1 flex-col items-center gap-1.5">
            <span className="os-num text-[10px] text-muted">{bar.confirmed + bar.abandoned}</span>
            <span className="flex h-[92px] w-full flex-col justify-end gap-0.5">
              <span
                className="w-full rounded-t-[5px] bg-primary"
                style={{ height: `${(bar.confirmed / max) * 92}px` }}
              />
              <span
                className="w-full rounded-b-[5px] bg-primary-mute"
                style={{ height: `${(bar.abandoned / max) * 92}px` }}
              />
            </span>
            <span className="os-num text-[10px] text-muted">{bar.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted">
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-[3px] bg-primary" />
          Confirmed {((confirmed / total) * 100).toFixed(0)} percent
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-[3px] bg-primary-mute" />
          Abandoned {((abandoned / total) * 100).toFixed(0)} percent
        </span>
      </div>
    </Card>
  );
}

export function DeliveryPanel({ split, worstReturns }: { split: DeliverySplit; worstReturns: { channelId: ChannelId; rate: number } | null }) {
  const rows = [
    { label: "Delivered", value: split.delivered, color: "var(--color-success)" },
    { label: "On the way", value: split.dispatched, color: "var(--color-primary)" },
    { label: "Preparing", value: split.preparing, color: "var(--color-line-strong)" },
    { label: "Returned", value: split.returned, color: "var(--color-danger)" },
  ];
  return (
    <Card>
      <CardHead title="Delivery" hint={`${split.total} orders in the last 30 days`} />
      <ul className="flex flex-col gap-2.5">
        {rows.map((row) => (
          <li key={row.label} className="grid grid-cols-[92px_1fr_44px] items-center gap-3">
            <span className="text-[13px] font-medium">{row.label}</span>
            <span className="block h-1.5 overflow-hidden rounded-full bg-surface-2 ring-1 ring-line">
              <span
                className="block h-full rounded-full"
                style={{ width: `${(row.value / (split.total || 1)) * 100}%`, background: row.color }}
              />
            </span>
            <span className="os-num text-right text-[13px]">{row.value}</span>
          </li>
        ))}
      </ul>
      {worstReturns ? (
        <p className="mt-3 text-xs text-muted">
          Returns run highest on {channel(worstReturns.channelId).label} orders, at{" "}
          {worstReturns.rate.toFixed(0)} percent.
        </p>
      ) : null}
    </Card>
  );
}

export function DemandPanel({
  rows,
}: {
  rows: {
    channelId: ChannelId;
    ordersToday: number;
    ordersThisWeek: number;
    waiting: number;
    connected: boolean;
  }[];
}) {
  return (
    <Card>
      <CardHead
        title="Orders by platform today"
        hint="Orders that arrived today and over the last seven days, with anything still waiting for an answer"
        action={
          <Link href="/orders" className="text-xs font-semibold text-primary hover:underline">
            Open orders
          </Link>
        }
      />
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((row) => (
          <li
            key={row.channelId}
            className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-line bg-surface-2 px-3 py-2.5"
          >
            <span className="min-w-0">
              <span className="flex items-center gap-2 text-[13px] font-semibold">
                <ChannelDot channelId={row.channelId} size={9} />
                {channel(row.channelId).label}
              </span>
              <span className="mt-0.5 block text-[11px] text-muted">
                {row.waiting > 0
                  ? `${row.waiting} waiting for an answer`
                  : row.connected
                    ? "nothing waiting"
                    : "not connected"}
              </span>
            </span>
            <span className="shrink-0 text-right">
              <span className="os-num block text-[17px] font-semibold leading-none">
                {row.ordersToday}
              </span>
              <span className="os-num block text-[11px] text-muted">
                {row.ordersThisWeek} this week
              </span>
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export interface ChannelHubRow {
  channelId: ChannelId;
  ordersToday: number;
  ordersThisWeek: number;
  waiting: number;
  connected: boolean;
  status: ConnectionStatus;
  accountLabel: string;
  eventsThisWeek: number;
}

const connectionStatusCopy: Record<ConnectionStatus, { label: string; className: string }> = {
  connected: { label: "Receiving", className: "bg-success-soft text-success" },
  setup_required: { label: "Setup needed", className: "bg-accent-soft text-accent-ink" },
  not_connected: { label: "Not connected", className: "bg-surface-2 text-muted" },
  warning: { label: "Check setup", className: "bg-accent-soft text-accent-ink" },
  error: { label: "Action needed", className: "bg-danger-soft text-danger" },
};

export function ChannelHubPanel({ rows }: { rows: ChannelHubRow[] }) {
  const receiving = rows.filter((row) => row.status === "connected").length;
  const ordersThisWeek = rows.reduce((sum, row) => sum + row.ordersThisWeek, 0);
  const waiting = rows.reduce((sum, row) => sum + row.waiting, 0);

  return (
    <Card>
      <CardHead
        title="One order desk, every channel"
        hint="Orders and conversations keep their original source while arriving in one shared workspace"
        action={
          <Link href="/integrations" className="text-xs font-semibold text-primary hover:underline">
            Manage connections
          </Link>
        }
      />
      <div className="mb-4 flex flex-wrap gap-x-5 gap-y-2 border-b border-line pb-4 text-xs text-muted">
        <span><strong className="os-num text-ink">{receiving}/6</strong> channels receiving</span>
        <span><strong className="os-num text-ink">{ordersThisWeek}</strong> orders this week</span>
        <span><strong className="os-num text-ink">{waiting}</strong> waiting for a reply</span>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => {
          const status = connectionStatusCopy[row.status];
          return (
            <li key={row.channelId} className="os-channel-tile p-3">
              <div className="flex items-start justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2 text-[13px] font-semibold">
                  <ChannelDot channelId={row.channelId} size={10} />
                  <span className="truncate">{channel(row.channelId).label}</span>
                </span>
                <span className={`os-channel-status shrink-0 ${status.className}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {status.label}
                </span>
              </div>
              <p className="mt-2 truncate text-[11px] text-muted" title={row.accountLabel}>
                {row.accountLabel}
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-2.5">
                <div>
                  <p className="os-label">Today</p>
                  <p className="os-num mt-1 text-[15px] font-semibold">{row.ordersToday}</p>
                </div>
                <div>
                  <p className="os-label">This week</p>
                  <p className="os-num mt-1 text-[15px] font-semibold">{row.ordersThisWeek}</p>
                </div>
                <div>
                  <p className="os-label">Waiting</p>
                  <p className={`os-num mt-1 text-[15px] font-semibold ${row.waiting ? "text-accent-ink" : ""}`}>
                    {row.waiting}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-[10.5px] text-faint">{row.eventsThisWeek} incoming events this week</p>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export function MoneyLine({ amount }: { amount: number }) {
  return <span className="os-num">{formatTNDCompact(amount)}</span>;
}

export interface ConversionRow {
  id: string;
  name: string;
  initials: string;
  callsReceived: number;
  customersReached: number;
  customersWon: number;
  customersRejected: number;
  ordersPlaced: number;
  revenue: number;
  conversionRate: number;
}

export function ConversionPanel({
  summary,
  rows,
  href = "/team",
}: {
  summary: ConversionSummary;
  rows: ConversionRow[];
  href?: string;
}) {
  return (
    <Card>
      <CardHead
        title="Call-to-order conversion"
        hint="Last 30 days, from calls received to customers won and orders placed"
        action={
          <Link href={href} className="text-xs font-semibold text-primary hover:underline">
            Open team performance
          </Link>
        }
      />
      <div className="grid gap-2 sm:grid-cols-4">
        {[
          { label: "Calls received", value: summary.callsReceived, note: "assigned to the team" },
          { label: "Customers reached", value: summary.customersReached, note: `${summary.reachRate.toFixed(0)}% reach rate` },
          { label: "Customers won", value: summary.customersWon, note: `${summary.conversionRate.toFixed(0)}% conversion` },
          { label: "Orders placed", value: summary.ordersPlaced, note: `${summary.orderRate.toFixed(0)}% of calls` },
        ].map((item) => (
          <div key={item.label} className="rounded-[var(--radius-md)] border border-line bg-surface-2 px-3 py-2.5">
            <p className="os-label">{item.label}</p>
            <p className="os-num mt-1.5 text-[21px] font-bold leading-none">{item.value}</p>
            <p className="mt-1 text-[11px] text-muted">{item.note}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1.35fr]">
        <div className="rounded-[var(--radius-md)] border border-line bg-surface-2 p-3">
          <p className="os-label">Team funnel</p>
          <div className="mt-3 flex flex-col gap-2.5">
            {[
              { label: "Calls received", value: summary.callsReceived, color: "var(--color-primary)" },
              { label: "Customers reached", value: summary.customersReached, color: "var(--color-accent)" },
              { label: "Customers won", value: summary.customersWon, color: "var(--color-success)" },
              { label: "Orders placed", value: summary.ordersPlaced, color: "var(--color-primary-hi)" },
            ].map((stage) => (
              <div key={stage.label} className="grid grid-cols-[112px_1fr_34px] items-center gap-2">
                <span className="text-[12px] font-medium">{stage.label}</span>
                <span className="block h-1.5 overflow-hidden rounded-full bg-surface ring-1 ring-line">
                  <span
                    className="block h-full rounded-full"
                    style={{ width: `${(stage.value / (summary.callsReceived || 1)) * 100}%`, background: stage.color }}
                  />
                </span>
                <span className="os-num text-right text-[12px]">{stage.value}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11.5px] text-muted">
            {summary.customersRejected} customers were rejected or did not qualify.
          </p>
        </div>

        <div className="os-scroll">
          <table className="w-full min-w-[500px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="os-label pb-2 text-left font-normal">Team member</th>
                <th className="os-label pb-2 text-right font-normal">Calls</th>
                <th className="os-label pb-2 text-right font-normal">Won</th>
                <th className="os-label pb-2 text-right font-normal">Rejected</th>
                <th className="os-label pb-2 text-right font-normal">Orders</th>
                <th className="os-label pb-2 text-right font-normal">Rate</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-line">
                  <td className="py-2.5 pr-3">
                    <span className="flex items-center gap-2 font-semibold">
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-primary-soft text-[10px] font-bold text-primary">
                        {row.initials}
                      </span>
                      {row.name}
                    </span>
                  </td>
                  <td className="os-num py-2.5 text-right text-[12.5px]">{row.callsReceived}</td>
                  <td className="os-num py-2.5 text-right text-[12.5px] text-success">{row.customersWon}</td>
                  <td className="os-num py-2.5 text-right text-[12.5px] text-danger">{row.customersRejected}</td>
                  <td className="os-num py-2.5 text-right text-[12.5px]">{row.ordersPlaced}</td>
                  <td className="os-num py-2.5 text-right text-[12.5px] font-semibold">{row.conversionRate.toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}
