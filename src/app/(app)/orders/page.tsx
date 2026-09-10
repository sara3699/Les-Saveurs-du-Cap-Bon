import Link from "next/link";
import { OrdersTable } from "@/components/orders/OrdersTable";
import { Card, DemoChip, PageHeader } from "@/components/ui/surfaces";
import { ChannelDot } from "@/components/ui/badges";
import { buildAttributionIndex } from "@/lib/domain/attribution";
import { CHANNEL_ORDER, channel } from "@/lib/domain/channels";
import type { ChannelId } from "@/lib/domain/types";
import { formatTND } from "@/lib/format";
import { revenueOf } from "@/lib/metrics";
import { DEMO_NOW } from "@/lib/mock/time";
import { getRepositories } from "@/lib/repositories";
import { toOrderRow } from "@/lib/views";

export const metadata = { title: "Commandes, Les Saveurs du Cap Bon" };

type Params = Promise<Record<string, string | string[] | undefined>>;

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

const PAYMENTS = [
  { value: "paid", label: "Payée" },
  { value: "cash_on_delivery", label: "À la livraison" },
  { value: "pending", label: "En attente de paiement" },
  { value: "refused", label: "Refusée" },
  { value: "refunded", label: "Remboursée" },
];

const DELIVERIES = [
  { value: "preparing", label: "En préparation" },
  { value: "dispatched", label: "En route" },
  { value: "delivered", label: "Livrée" },
  { value: "returned", label: "Retournée" },
  { value: "cancelled", label: "Annulée" },
];

const PERIODS = [
  { value: "7", label: "Les 7 derniers jours" },
  { value: "30", label: "Les 30 derniers jours" },
  { value: "90", label: "Les 90 derniers jours" },
];

export default async function OrdersPage({ searchParams }: { searchParams: Params }) {
  const params = await searchParams;
  const source = one(params.source) as ChannelId | undefined;
  const payment = one(params.payment);
  const delivery = one(params.delivery);
  const assignee = one(params.assignee);
  const period = one(params.period) ?? "30";
  const minTotal = one(params.min);
  const query = one(params.q) ?? "";

  const repos = getRepositories();
  const [orders, contacts, team, connections, attributions] = await Promise.all([
    repos.orders.list({
      channels: source ? [source] : undefined,
      paymentStatuses: payment ? [payment] : undefined,
      deliveryStatuses: delivery ? [delivery] : undefined,
      assigneeId: assignee ? (assignee === "none" ? null : assignee) : undefined,
      minTotal: minTotal ? Number(minTotal) : undefined,
      sinceDays: Number(period),
      search: query || undefined,
    }),
    repos.contacts.list(),
    repos.workspace.team(),
    repos.integrations.list(),
    repos.workspace.attributions(),
  ]);

  const index = buildAttributionIndex(attributions, connections);
  const rows = orders.map((o) =>
    toOrderRow(
      o,
      index,
      { contacts: new Map(contacts.map((c) => [c.id, c.name])), team: new Map(team.map((m) => [m.id, m.name])) },
      DEMO_NOW,
    ),
  );
  const periodLabel = PERIODS.find((item) => item.value === period)?.label.toLowerCase() ?? "la période sélectionnée";

  const keep = (extra: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const merged = { source, payment, delivery, assignee, period, min: minTotal, q: query, ...extra };
    for (const [key, value] of Object.entries(merged)) {
      if (value) next.set(key, String(value));
    }
    const qs = next.toString();
    return qs ? `/orders?${qs}` : "/orders";
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Commandes"
        subtitle={`${rows.length} commandes d'exemple dans cette vue sur ${periodLabel}. ${formatTND(revenueOf(orders))} de chiffre d'affaires confirmé après les refus et les remboursements.`}
        actions={
          <>
            <Link
              href="/orders/nouvelle"
              className="rounded-[var(--radius-md)] bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hi"
            >
              Nouvelle commande
            </Link>
            <DemoChip />
          </>
        }
      />

      <Card>
        <div className="flex flex-wrap gap-1.5">
          <Link
            href={keep({ source: undefined })}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
              source ? "border-line bg-surface-2 text-muted" : "border-primary bg-primary text-white"
            }`}
          >
            Toutes les sources
          </Link>
          {CHANNEL_ORDER.map((id) => {
            const active = source === id;
            return (
              <Link
                key={id}
                href={keep({ source: active ? undefined : id })}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  active ? "border-primary bg-primary text-white" : "border-line bg-surface-2 text-muted"
                }`}
              >
                <ChannelDot channelId={id} size={7} />
                {channel(id).label}
              </Link>
            );
          })}
        </div>

        <form className="mt-3 grid gap-2 border-t border-line pt-3 sm:grid-cols-2 lg:grid-cols-6">
          {source ? <input type="hidden" name="source" value={source} /> : null}
          <label className="flex flex-col gap-1">
            <span className="os-label">Recherche</span>
            <input
              name="q"
              defaultValue={query}
              placeholder="Numéro de commande ou client"
              className="rounded-[var(--radius-sm)] border border-line bg-surface-2 px-2.5 py-1.5 text-[13px]"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="os-label">Période</span>
            <select name="period" defaultValue={period} className="rounded-[var(--radius-sm)] border border-line bg-surface-2 px-2.5 py-1.5 text-[13px]">
              {PERIODS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="os-label">Paiement</span>
            <select name="payment" defaultValue={payment ?? ""} className="rounded-[var(--radius-sm)] border border-line bg-surface-2 px-2.5 py-1.5 text-[13px]">
              <option value="">Tous les statuts</option>
              {PAYMENTS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="os-label">Livraison</span>
            <select name="delivery" defaultValue={delivery ?? ""} className="rounded-[var(--radius-sm)] border border-line bg-surface-2 px-2.5 py-1.5 text-[13px]">
              <option value="">Tous les statuts</option>
              {DELIVERIES.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="os-label">Responsable</span>
            <select name="assignee" defaultValue={assignee ?? ""} className="rounded-[var(--radius-sm)] border border-line bg-surface-2 px-2.5 py-1.5 text-[13px]">
              <option value="">Tout le monde</option>
              <option value="none">Personne pour l'instant</option>
              {team.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="os-label">Montant à partir de, TND</span>
            <span className="flex gap-1.5">
              <input
                name="min"
                type="number"
                min="0"
                step="10"
                defaultValue={minTotal ?? ""}
                className="w-full rounded-[var(--radius-sm)] border border-line bg-surface-2 px-2.5 py-1.5 text-[13px]"
              />
              <button
                type="submit"
                className="rounded-[var(--radius-sm)] bg-primary px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-primary-hi"
              >
                Appliquer
              </button>
            </span>
          </label>
        </form>
      </Card>

      <Card>
        <OrdersTable rows={rows} />
      </Card>
    </div>
  );
}
