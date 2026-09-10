import Link from "next/link";
import { DeliveryPill, PaymentPill, SourceBadge } from "@/components/ui/badges";
import { EmptyState } from "@/components/ui/surfaces";
import type { OrderRow } from "@/lib/views";

export function OrdersTable({
  rows,
  showAssignee = true,
}: {
  rows: OrderRow[];
  showAssignee?: boolean;
}) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="No orders match these filters"
        body="Clear a filter to widen the search. Every order in the demo data belongs to one of the six sources, so an empty result means the filters disagree with each other."
        action={{ label: "Clear the filters", href: "/orders" }}
      />
    );
  }

  return (
    <div className="os-scroll">
      <table className="w-full min-w-[820px] border-collapse text-sm">
        <thead>
          <tr>
            <th className="os-label pb-2.5 pr-3 text-left font-normal">Order</th>
            <th className="os-label pb-2.5 pr-3 text-left font-normal">Customer</th>
            <th className="os-label pb-2.5 pr-3 text-left font-normal">Source</th>
            <th className="os-label pb-2.5 pr-3 text-left font-normal">Payment</th>
            <th className="os-label pb-2.5 pr-3 text-left font-normal">Delivery</th>
            {showAssignee ? (
              <th className="os-label pb-2.5 pr-3 text-left font-normal">Owner</th>
            ) : null}
            <th className="os-label pb-2.5 pr-3 text-right font-normal">Total, TND</th>
            <th className="os-label pb-2.5 text-right font-normal">Placed</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-line hover:bg-surface-2">
              <td className="py-2.5 pr-3">
                <Link href={row.href} className="os-num text-[12.5px] font-semibold text-primary hover:underline">
                  {row.reference}
                </Link>
              </td>
              <td className="py-2.5 pr-3 text-[13px]">{row.customer}</td>
              <td className="py-2.5 pr-3">
                <SourceBadge channelId={row.channelId} account={row.account} size="sm" />
              </td>
              <td className="py-2.5 pr-3">
                <PaymentPill status={row.payment} />
              </td>
              <td className="py-2.5 pr-3">
                <DeliveryPill status={row.delivery} />
              </td>
              {showAssignee ? (
                <td className="py-2.5 pr-3 text-[13px] text-muted">
                  {row.assignee ?? <span className="text-danger">Nobody</span>}
                </td>
              ) : null}
              <td className="os-num py-2.5 pr-3 text-right text-[12.5px]">{row.totalLabel}</td>
              <td className="os-num py-2.5 text-right text-[12px] text-muted">{row.placedLabel}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
