import { ChannelDot, SourceBadge } from "@/components/ui/badges";
import { Card, CardHead } from "@/components/ui/surfaces";
import { channel } from "@/lib/domain/channels";
import type { ChannelId } from "@/lib/domain/types";
import { formatTND } from "@/lib/format";

/**
 * format.ts puts a moment in time into words. These panels need the length of a
 * gap, which is a different question, so it is answered here rather than pushed
 * into the shared formatter.
 */
export function durationLabel(ms: number): string {
  const minutes = Math.round(ms / 60_000);
  if (minutes < 1) return "Under a minute";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  if (hours < 24) return restMinutes === 0 ? `${hours} h` : `${hours} h ${restMinutes} min`;
  const days = Math.floor(hours / 24);
  const restHours = hours % 24;
  return restHours === 0 ? `${days} d` : `${days} d ${restHours} h`;
}

export interface ComparisonRow {
  channelId: ChannelId;
  label: string;
  orders: number;
  revenue: number;
  /** Share of the period's revenue, 0 to 100. */
  revenueShare: number;
  /** null when the channel took no order that counts towards revenue. */
  averageOrder: number | null;
  conversations: number;
  converted: number;
  /** null when no conversation arrived on this channel in the period. */
  conversionRate: number | null;
  /** null when no conversation on this channel was answered in the period. */
  replyMs: number | null;
  replySamples: number;
}

const HEAD = "os-label pb-2 font-normal";

/**
 * The centre of the screen. Six sources, the same questions asked of each of
 * them, sorted by revenue so the biggest earner is read first.
 */
export function ChannelComparison({
  rows,
  periodLabel,
}: {
  rows: ComparisonRow[];
  periodLabel: string;
}) {
  return (
    <Card>
      <CardHead
        title="How the six sources compare"
        hint={`${periodLabel}, by the channel each request arrived on, highest revenue first`}
      />
      <div className="os-scroll">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr>
              <th className={`${HEAD} text-left`}>Source</th>
              <th className={`${HEAD} text-right`}>Revenue, TND</th>
              <th className={`${HEAD} text-left`}>Share of revenue</th>
              <th className={`${HEAD} text-right`}>Orders</th>
              <th className={`${HEAD} text-right`}>Average order, TND</th>
              <th className={`${HEAD} text-right`}>Conversion</th>
              <th className={`${HEAD} text-right`}>First reply</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.channelId} className="border-t border-line align-top">
                <td className="py-3 pr-3">
                  <SourceBadge channelId={row.channelId} />
                </td>
                <td className="os-num py-3 pr-3 text-right text-[13px] font-semibold">
                  {row.orders === 0 ? (
                    <span className="text-faint">No orders</span>
                  ) : (
                    formatTND(row.revenue, { withCurrency: false })
                  )}
                </td>
                <td className="py-3 pr-3">
                  <span className="block h-1.5 w-full min-w-[70px] overflow-hidden rounded-full bg-surface-2 ring-1 ring-line">
                    <span
                      className="block h-full rounded-full"
                      style={{
                        width: `${row.revenueShare}%`,
                        background: channel(row.channelId).colorVar,
                      }}
                    />
                  </span>
                  <span className="os-num mt-1 block text-[11px] text-muted">
                    {row.revenueShare.toFixed(0)}%
                  </span>
                </td>
                <td className="os-num py-3 pr-3 text-right text-[13px]">{row.orders}</td>
                <td className="os-num py-3 pr-3 text-right text-[13px]">
                  {row.averageOrder === null ? (
                    <span className="text-[12px] text-faint">Nothing to average</span>
                  ) : (
                    formatTND(row.averageOrder, { withCurrency: false })
                  )}
                </td>
                <td className="py-3 pr-3 text-right">
                  {row.conversionRate === null ? (
                    <span className="text-[12px] text-faint">No conversation</span>
                  ) : (
                    <>
                      <span className="os-num block text-[13px] font-semibold">
                        {row.conversionRate.toFixed(0)}%
                      </span>
                      <span className="os-num block text-[11px] text-muted">
                        {row.converted} of {row.conversations}
                      </span>
                    </>
                  )}
                </td>
                <td className="py-3 text-right">
                  {row.replyMs === null ? (
                    <span className="text-[12px] text-faint">No answered conversation</span>
                  ) : (
                    <>
                      <span className="os-num block text-[13px] font-semibold">
                        {durationLabel(row.replyMs)}
                      </span>
                      <span className="os-num block text-[11px] text-muted">
                        {row.replySamples === 1
                          ? "1 conversation"
                          : `${row.replySamples} conversations`}
                      </span>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-col gap-2 border-t border-line pt-3 text-xs leading-relaxed text-muted">
        <p>
          <span className="font-semibold text-ink">Conversion</span> is the conversations that
          arrived on a channel in this period where the same customer then placed an order, on or
          after the day that conversation arrived, divided by every conversation on that channel in
          the period. The count is printed next to it because the numbers behind it are small, and
          a conversation that arrived this morning has had almost no time to become an order.
        </p>
        <p>
          <span className="font-semibold text-ink">First reply</span> is the gap between the first
          message a customer sent and the first answer sent back after it, averaged over the
          conversations on that channel that were answered. A conversation nobody has replied to
          yet is left out of the average rather than counted as instant.
        </p>
        <p>
          <span className="font-semibold text-ink">Revenue</span> leaves out refused and refunded
          orders. The order count keeps them, which is why the two columns do not move together.
        </p>
      </div>
    </Card>
  );
}

export interface PeriodBar {
  key: string;
  /** Day of the month the bucket starts on. */
  label: string;
  /** The full date, or date range, spelled out for the hover title. */
  title: string;
  value: number;
  valueLabel: string;
}

export function PeriodBars({
  title,
  hint,
  bars,
  tone,
  showValues,
  footer,
}: {
  title: string;
  hint: string;
  bars: PeriodBar[];
  tone: "money" | "orders";
  showValues: boolean;
  footer: string;
}) {
  const max = Math.max(...bars.map((b) => b.value), 1);
  const color = tone === "money" ? "var(--color-accent)" : "var(--color-primary)";
  return (
    <Card>
      <CardHead title={title} hint={hint} />
      <div className="os-scroll">
        {/* Wide enough that a bar is still readable when the period is cut into
            many buckets, and the card scrolls inside itself rather than pushing
            the page sideways on a phone. */}
        <div style={{ minWidth: `${Math.max(400, bars.length * 26)}px` }}>
          <ul className="flex items-end gap-1.5 border-b border-line-strong">
            {bars.map((bar) => (
              <li
                key={bar.key}
                className="flex flex-1 flex-col items-center gap-1"
                title={`${bar.title}, ${bar.valueLabel}`}
              >
                {/* The bar is a picture of the figure. Read out, it has to be
                    the figure itself, so the number is never mouse-only. */}
                <span className="sr-only">{`${bar.title}, ${bar.valueLabel}`}</span>
                {showValues ? (
                  <span aria-hidden className="os-num text-[10px] text-muted">
                    {bar.valueLabel}
                  </span>
                ) : null}
                <span aria-hidden className="flex h-[112px] w-full items-end">
                  <span
                    className="w-full rounded-t-[5px]"
                    style={{
                      height: bar.value === 0 ? 0 : `${Math.max((bar.value / max) * 112, 3)}px`,
                      background: color,
                    }}
                  />
                </span>
              </li>
            ))}
          </ul>
          <ul aria-hidden className="flex gap-1.5 pt-1.5">
            {bars.map((bar) => (
              <li
                key={`${bar.key}_label`}
                className="os-num flex-1 text-center text-[10px] text-muted"
              >
                {bar.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted">{footer}</p>
    </Card>
  );
}

export interface DeliveryRow {
  channelId: ChannelId;
  label: string;
  orders: number;
  delivered: number;
  dispatched: number;
  preparing: number;
  cancelled: number;
  returned: number;
  /** null when the channel took no order in the period. */
  returnRate: number | null;
}

export function DeliveryByChannel({
  rows,
  worst,
  minimumOrders,
}: {
  rows: DeliveryRow[];
  worst: DeliveryRow | null;
  minimumOrders: number;
}) {
  // The bars are scaled against the channels the sentence underneath actually
  // compares. Letting a channel with three orders and one return set the scale
  // would draw the longest bar next to a sentence naming somebody else as worst.
  const comparable = rows.filter((r) => r.returnRate !== null && r.orders >= minimumOrders);
  const scale = Math.max(...comparable.map((r) => r.returnRate ?? 0), 1);
  return (
    <Card>
      <CardHead
        title="Delivery and returns by channel"
        hint="What happened to the orders after they were taken, in the same order as the table above"
      />
      <div className="os-scroll">
        <table className="w-full min-w-[820px] border-collapse text-sm">
          <thead>
            <tr>
              <th className={`${HEAD} text-left`}>Source</th>
              <th className={`${HEAD} text-right`}>Orders</th>
              <th className={`${HEAD} text-right`}>Delivered</th>
              <th className={`${HEAD} text-right`}>On the way</th>
              <th className={`${HEAD} text-right`}>Preparing</th>
              <th className={`${HEAD} text-right`}>Cancelled</th>
              <th className={`${HEAD} text-right`}>Returned</th>
              <th className={`${HEAD} text-left`}>Return rate</th>
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
                <td className="os-num py-2.5 pr-3 text-right text-[13px]">{row.orders}</td>
                <td className="os-num py-2.5 pr-3 text-right text-[13px]">{row.delivered}</td>
                <td className="os-num py-2.5 pr-3 text-right text-[13px]">{row.dispatched}</td>
                <td className="os-num py-2.5 pr-3 text-right text-[13px]">{row.preparing}</td>
                <td className="os-num py-2.5 pr-3 text-right text-[13px]">{row.cancelled}</td>
                <td className="os-num py-2.5 pr-3 text-right text-[13px] font-semibold">
                  {row.returned}
                </td>
                <td className="py-2.5">
                  {row.returnRate === null ? (
                    <span className="text-[12px] text-faint">No orders</span>
                  ) : row.orders < minimumOrders ? (
                    <>
                      <span className="os-num block text-[12px] text-muted">
                        {row.returnRate.toFixed(1)}%
                      </span>
                      <span className="block text-[11px] text-faint">
                        Too few orders to compare
                      </span>
                    </>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span className="block h-1.5 w-full min-w-[64px] overflow-hidden rounded-full bg-surface-2 ring-1 ring-line">
                        <span
                          className="block h-full rounded-full bg-danger"
                          style={{ width: `${Math.min((row.returnRate / scale) * 100, 100)}%` }}
                        />
                      </span>
                      <span className="os-num w-[46px] shrink-0 text-right text-[12px]">
                        {row.returnRate.toFixed(1)}%
                      </span>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted">
        {worst
          ? `Returns run highest on ${worst.label}, at ${worst.returnRate!.toFixed(1)} percent of its orders, ${worst.returned} of ${worst.orders}. Channels with fewer than ${minimumOrders} orders in this period are left out of that comparison, because a single return would swing the figure.`
          : `No channel took ${minimumOrders} orders in this period, so there is no return rate worth comparing yet.`}
      </p>
    </Card>
  );
}
