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
        title="D'où viennent vos commandes"
        hint={`${periodLabel}, selon le canal sur lequel la demande est arrivée`}
        action={
          <Link href="/statistics" className="text-xs font-semibold text-primary hover:underline">
            Comparer les canaux
          </Link>
        }
      />
      <div className="os-scroll">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="os-label pb-2 text-left font-normal">Canal</th>
              <th className="os-label pb-2 text-left font-normal">Part</th>
              <th className="os-label pb-2 text-right font-normal">Commandes</th>
              <th className="os-label pb-2 text-right font-normal">Chiffre d'affaires</th>
              <th className="os-label pb-2 text-right font-normal">Évolution</th>
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
                    <span className="text-faint">nouveau</span>
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
        Le chiffre d'affaires exclut les commandes refusées et remboursées. Le nombre de commandes
        les garde, ce qui explique que les deux colonnes ne varient pas ensemble.
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
      <CardHead title="À surveiller" hint={`${items.length} éléments que personne n'a pris en charge`} />
      {items.length === 0 ? (
        <p className="rounded-[var(--radius-md)] border border-dashed border-line-strong bg-surface-2 px-4 py-6 text-center text-sm text-muted">
          Rien n'attend. Chaque demande a un responsable et aucun suivi n'est en retard.
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
      <CardHead title="Commandes par jour" hint="Confirmées par rapport aux abandons, sur les 7 derniers jours" />
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
          Confirmées {((confirmed / total) * 100).toFixed(0)} %
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-[3px] bg-primary-mute" />
          Abandonnées {((abandoned / total) * 100).toFixed(0)} %
        </span>
      </div>
    </Card>
  );
}

export function DeliveryPanel({ split, worstReturns }: { split: DeliverySplit; worstReturns: { channelId: ChannelId; rate: number } | null }) {
  const rows = [
    { label: "Livrées", value: split.delivered, color: "var(--color-success)" },
    { label: "En route", value: split.dispatched, color: "var(--color-primary)" },
    { label: "En préparation", value: split.preparing, color: "var(--color-line-strong)" },
    { label: "Retournées", value: split.returned, color: "var(--color-danger)" },
  ];
  return (
    <Card>
      <CardHead title="Livraison" hint={`${split.total} commandes sur les 30 derniers jours`} />
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
          Le taux de retour est le plus élevé sur les commandes {channel(worstReturns.channelId).label}, à{" "}
          {worstReturns.rate.toFixed(0)} %.
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
        title="Commandes par canal aujourd'hui"
        hint="Commandes reçues aujourd'hui et sur les sept derniers jours, avec les demandes encore en attente de réponse"
        action={
          <Link href="/orders" className="text-xs font-semibold text-primary hover:underline">
            Ouvrir les commandes
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
                  ? `${row.waiting} en attente de réponse`
                  : row.connected
                    ? "rien en attente"
                    : "non connecté"}
              </span>
            </span>
            <span className="shrink-0 text-right">
              <span className="os-num block text-[17px] font-semibold leading-none">
                {row.ordersToday}
              </span>
              <span className="os-num block text-[11px] text-muted">
                {row.ordersThisWeek} cette semaine
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
  connected: { label: "Connecté", className: "bg-success-soft text-success" },
  setup_required: { label: "Configuration à terminer", className: "bg-accent-soft text-accent-ink" },
  not_connected: { label: "Non connecté", className: "bg-surface-2 text-muted" },
  warning: { label: "À vérifier", className: "bg-accent-soft text-accent-ink" },
  error: { label: "Ne reçoit plus", className: "bg-danger-soft text-danger" },
};

export function ChannelHubPanel({ rows }: { rows: ChannelHubRow[] }) {
  const receiving = rows.filter((row) => row.status === "connected").length;
  const ordersThisWeek = rows.reduce((sum, row) => sum + row.ordersThisWeek, 0);
  const waiting = rows.reduce((sum, row) => sum + row.waiting, 0);

  return (
    <Card>
      <CardHead
        title="Un seul espace pour tous les canaux"
        hint="Les commandes et les conversations gardent leur source tout en arrivant dans un espace partagé"
        action={
          <Link href="/integrations" className="text-xs font-semibold text-primary hover:underline">
            Gérer les connexions
          </Link>
        }
      />
      <div className="mb-4 flex flex-wrap gap-x-5 gap-y-2 border-b border-line pb-4 text-xs text-muted">
        <span><strong className="os-num text-ink">{receiving}/6</strong> canaux qui reçoivent</span>
        <span><strong className="os-num text-ink">{ordersThisWeek}</strong> commandes cette semaine</span>
        <span><strong className="os-num text-ink">{waiting}</strong> en attente de réponse</span>
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
                  <p className="os-label">Aujourd'hui</p>
                  <p className="os-num mt-1 text-[15px] font-semibold">{row.ordersToday}</p>
                </div>
                <div>
                  <p className="os-label">Cette semaine</p>
                  <p className="os-num mt-1 text-[15px] font-semibold">{row.ordersThisWeek}</p>
                </div>
                <div>
                  <p className="os-label">En attente</p>
                  <p className={`os-num mt-1 text-[15px] font-semibold ${row.waiting ? "text-accent-ink" : ""}`}>
                    {row.waiting}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-[10.5px] text-faint">{row.eventsThisWeek} événements reçus cette semaine</p>
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
        title="Conversion des appels en commandes"
        hint="30 derniers jours, des appels reçus aux clients gagnés et aux commandes passées"
        action={
          <Link href={href} className="text-xs font-semibold text-primary hover:underline">
            Voir la performance de l'équipe
          </Link>
        }
      />
      <div className="grid gap-2 sm:grid-cols-4">
        {[
          { label: "Appels reçus", value: summary.callsReceived, note: "attribués à l'équipe" },
          { label: "Clients joints", value: summary.customersReached, note: `taux de contact de ${summary.reachRate.toFixed(0)} %` },
          { label: "Clients gagnés", value: summary.customersWon, note: `taux de conversion de ${summary.conversionRate.toFixed(0)} %` },
          { label: "Commandes passées", value: summary.ordersPlaced, note: `${summary.orderRate.toFixed(0)} % des appels` },
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
          <p className="os-label">Entonnoir de l'équipe</p>
          <div className="mt-3 flex flex-col gap-2.5">
            {[
              { label: "Appels reçus", value: summary.callsReceived, color: "var(--color-primary)" },
              { label: "Clients joints", value: summary.customersReached, color: "var(--color-accent)" },
              { label: "Clients gagnés", value: summary.customersWon, color: "var(--color-success)" },
              { label: "Commandes passées", value: summary.ordersPlaced, color: "var(--color-primary-hi)" },
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
            {summary.customersRejected} clients ont été refusés ou n'étaient pas qualifiés.
          </p>
        </div>

        <div className="os-scroll">
          <table className="w-full min-w-[500px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="os-label pb-2 text-left font-normal">Membre</th>
                <th className="os-label pb-2 text-right font-normal">Appels</th>
                <th className="os-label pb-2 text-right font-normal">Gagnés</th>
                <th className="os-label pb-2 text-right font-normal">Non qualifiés</th>
                <th className="os-label pb-2 text-right font-normal">Commandes</th>
                <th className="os-label pb-2 text-right font-normal">Taux</th>
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
