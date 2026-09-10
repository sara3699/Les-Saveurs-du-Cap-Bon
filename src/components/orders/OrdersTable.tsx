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
        title="Aucune commande ne correspond à ces filtres"
        body="Retirez un filtre pour élargir la recherche. Chaque commande des données d'exemple appartient à l'une des six sources, donc un résultat vide veut dire que les filtres se contredisent."
        action={{ label: "Effacer les filtres", href: "/orders" }}
      />
    );
  }

  return (
    <div className="os-scroll">
      <table className="w-full min-w-[820px] border-collapse text-sm">
        <thead>
          <tr>
            <th className="os-label pb-2.5 pr-3 text-left font-normal">Commande</th>
            <th className="os-label pb-2.5 pr-3 text-left font-normal">Client</th>
            <th className="os-label pb-2.5 pr-3 text-left font-normal">Source</th>
            <th className="os-label pb-2.5 pr-3 text-left font-normal">Paiement</th>
            <th className="os-label pb-2.5 pr-3 text-left font-normal">Livraison</th>
            {showAssignee ? (
              <th className="os-label pb-2.5 pr-3 text-left font-normal">Responsable</th>
            ) : null}
            <th className="os-label pb-2.5 pr-3 text-right font-normal">Total, TND</th>
            <th className="os-label pb-2.5 text-right font-normal">Passée</th>
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
                  {row.assignee ?? <span className="text-danger">Personne</span>}
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
