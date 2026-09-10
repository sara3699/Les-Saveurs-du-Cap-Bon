"use client";

import { useState } from "react";
import { Card, CardHead } from "@/components/ui/surfaces";
import { formatTND, formatTNDCompact } from "@/lib/format";
import { conversionRate, summarizeConversions } from "@/lib/metrics";
import type { TeamConversionMetric } from "@/lib/domain/types";

export interface CallRow {
  memberId: string;
  name: string;
  metric: TeamConversionMetric;
}

interface Recorded {
  id: number;
  memberName: string;
  reached: boolean;
  outcome: "won" | "rejected" | "undecided";
  orderValue: number | null;
}

/**
 * Calls do not arrive through any connector, so this is where they come from:
 * somebody types them in after the call. The figures above the form move as
 * soon as one is recorded, and the strip underneath says plainly that nothing
 * has been saved anywhere yet.
 */
export function CallPerformance({ rows: initialRows }: { rows: CallRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [recorded, setRecorded] = useState<Recorded[]>([]);
  const [memberId, setMemberId] = useState(initialRows[0]?.memberId ?? "");
  const [reached, setReached] = useState(true);
  const [outcome, setOutcome] = useState<"won" | "rejected" | "undecided">("won");
  const [ordered, setOrdered] = useState(true);
  const [orderValue, setOrderValue] = useState("120");
  const [error, setError] = useState<string | null>(null);

  const summary = summarizeConversions(rows.map((r) => r.metric));
  const ranked = [...rows].sort(
    (a, b) => conversionRate(b.metric) - conversionRate(a.metric),
  );

  function record(event: React.FormEvent) {
    event.preventDefault();
    const member = rows.find((r) => r.memberId === memberId);
    if (!member) return;

    const won = reached && outcome === "won";
    const rejected = reached && outcome === "rejected";
    const placedOrder = won && ordered;
    const value = placedOrder ? Number(orderValue) : 0;

    if (placedOrder && (!Number.isFinite(value) || value <= 0)) {
      setError("Donnez un montant en dinars a la commande, ou indiquez qu'aucune commande n'a été passee.");
      return;
    }
    setError(null);

    setRows((current) =>
      current.map((row) =>
        row.memberId === memberId
          ? {
              ...row,
              metric: {
                ...row.metric,
                callsReceived: row.metric.callsReceived + 1,
                customersReached: row.metric.customersReached + (reached ? 1 : 0),
                customersWon: row.metric.customersWon + (won ? 1 : 0),
                customersRejected: row.metric.customersRejected + (rejected ? 1 : 0),
                ordersPlaced: row.metric.ordersPlaced + (placedOrder ? 1 : 0),
                revenue: row.metric.revenue + value,
              },
            }
          : row,
      ),
    );

    setRecorded((current) => [
      {
        id: current.length + 1,
        memberName: member.name,
        reached,
        outcome: reached ? outcome : "undecided",
        orderValue: placedOrder ? value : null,
      },
      ...current,
    ]);
  }

  function undoLast() {
    const last = recorded[0];
    if (!last) return;
    const member = rows.find((r) => r.name === last.memberName);
    if (!member) return;

    const won = last.reached && last.outcome === "won";
    const rejected = last.reached && last.outcome === "rejected";

    setRows((current) =>
      current.map((row) =>
        row.memberId === member.memberId
          ? {
              ...row,
              metric: {
                ...row.metric,
                callsReceived: row.metric.callsReceived - 1,
                customersReached: row.metric.customersReached - (last.reached ? 1 : 0),
                customersWon: row.metric.customersWon - (won ? 1 : 0),
                customersRejected: row.metric.customersRejected - (rejected ? 1 : 0),
                ordersPlaced: row.metric.ordersPlaced - (last.orderValue ? 1 : 0),
                revenue: row.metric.revenue - (last.orderValue ?? 0),
              },
            }
          : row,
      ),
    );
    setRecorded((current) => current.slice(1));
  }

  const tiles = [
    { label: "Appels reçus", value: summary.callsReceived, note: "total de l'equipe" },
    { label: "Joints", value: summary.customersReached, note: `${summary.reachRate.toFixed(0)}% de contact` },
    { label: "Gagnés", value: summary.customersWon, note: `${summary.conversionRate.toFixed(0)}% de conversion` },
    { label: "Non qualifiés", value: summary.customersRejected, note: "clients non retenus" },
    { label: "Commandes", value: summary.ordersPlaced, note: `${summary.orderRate.toFixed(0)}% des appels` },
  ];

  return (
    <Card>
      <CardHead
        title="Performance de conversion des appels"
        hint="Utilisez le même entonnoir chaque semaine : appels reçus, clients joints, clients gagnés, clients non qualifiés et commandes passées."
      />

      <div className="grid gap-2 sm:grid-cols-5">
        {tiles.map((item) => (
          <div
            key={item.label}
            className="rounded-[var(--radius-md)] border border-line bg-surface-2 px-3 py-2.5"
          >
            <p className="os-label">{item.label}</p>
            <p className="os-num mt-1.5 text-[20px] font-bold leading-none">{item.value}</p>
            <p className="mt-1 text-[11px] text-muted">{item.note}</p>
          </div>
        ))}
      </div>

      <div className="os-scroll mt-4">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="os-label pb-2.5 pr-3 text-left font-normal">Membre de l&apos;équipe</th>
              <th className="os-label pb-2.5 pr-3 text-right font-normal">Appels reçus</th>
              <th className="os-label pb-2.5 pr-3 text-right font-normal">Joints</th>
              <th className="os-label pb-2.5 pr-3 text-right font-normal">Gagnés</th>
              <th className="os-label pb-2.5 pr-3 text-right font-normal">Non qualifiés</th>
              <th className="os-label pb-2.5 pr-3 text-right font-normal">Commandes</th>
              <th className="os-label pb-2.5 pr-3 text-right font-normal">Conversion</th>
              <th className="os-label pb-2.5 text-right font-normal">Chiffre d&apos;affaires, TND</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((row) => (
              <tr key={row.memberId} className="border-t border-line hover:bg-surface-2">
                <td className="py-2.5 pr-3 text-[13px] font-semibold">{row.name}</td>
                <td className="os-num py-2.5 pr-3 text-right text-[12.5px]">{row.metric.callsReceived}</td>
                <td className="os-num py-2.5 pr-3 text-right text-[12.5px]">{row.metric.customersReached}</td>
                <td className="os-num py-2.5 pr-3 text-right text-[12.5px] text-success">{row.metric.customersWon}</td>
                <td className="os-num py-2.5 pr-3 text-right text-[12.5px] text-danger">{row.metric.customersRejected}</td>
                <td className="os-num py-2.5 pr-3 text-right text-[12.5px]">{row.metric.ordersPlaced}</td>
                <td className="os-num py-2.5 pr-3 text-right text-[12.5px] font-semibold">
                  {conversionRate(row.metric).toFixed(0)}%
                </td>
                <td className="os-num py-2.5 text-right text-[12.5px]">
                  {formatTND(row.metric.revenue, { withCurrency: false })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-muted">
        Le taux de conversion, ce sont les clients gagnés divises par les appels reçus. Le chiffre
        d&apos;affaires de ces commandes issues d&apos;appels totalise{" "}
        {formatTNDCompact(summary.revenue)}.
      </p>

      <form
        onSubmit={record}
        className="mt-4 rounded-[var(--radius-md)] border border-line bg-surface-2 p-3.5"
      >
        <p className="text-[13px] font-semibold">Enregistrer un appel</p>
        <p className="mt-0.5 max-w-[78ch] text-xs text-muted">
          Les appels n&apos;arrivent pas par le site web, WhatsApp, Instagram, Facebook ou Google,
          ils sont donc saisis ici après l&apos;appel. Les chiffres ci-dessus bougent dès que vous
          en ajoutez un.
        </p>

        <div className="mt-3 grid gap-3 lg:grid-cols-4">
          <label className="flex flex-col gap-1">
            <span className="os-label">Qui a pris l&apos;appel</span>
            <select
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="rounded-[var(--radius-sm)] border border-line bg-surface px-2.5 py-1.5 text-[13px]"
            >
              {rows.map((row) => (
                <option key={row.memberId} value={row.memberId}>
                  {row.name}
                </option>
              ))}
            </select>
          </label>

          <fieldset className="flex flex-col gap-1">
            <legend className="os-label">Avez-vous joint le client</legend>
            <div className="flex gap-1.5 pt-1">
              {[
                { value: true, label: "Joint" },
                { value: false, label: "Sans réponse" },
              ].map((option) => (
                <label
                  key={option.label}
                  className={`cursor-pointer rounded-full border px-3 py-1 text-[12px] ${
                    reached === option.value
                      ? "border-primary bg-primary text-white"
                      : "border-line bg-surface text-muted"
                  }`}
                >
                  <input
                    type="radio"
                    name="reached"
                    className="sr-only"
                    checked={reached === option.value}
                    onChange={() => setReached(option.value)}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="flex flex-col gap-1">
            <span className="os-label">Comment cela s&apos;est termine</span>
            <select
              value={outcome}
              disabled={!reached}
              onChange={(e) => setOutcome(e.target.value as typeof outcome)}
              className="rounded-[var(--radius-sm)] border border-line bg-surface px-2.5 py-1.5 text-[13px] disabled:text-faint"
            >
              <option value="won">Client gagne</option>
              <option value="rejected">Non qualifie</option>
              <option value="undecided">Encore en reflexion</option>
            </select>
          </label>

          <div className="flex flex-col gap-1">
            <span className="os-label">Commande passee</span>
            <div className="flex gap-1.5">
              <label className="flex items-center gap-1.5 text-[12px]">
                <input
                  type="checkbox"
                  checked={ordered}
                  disabled={!reached || outcome !== "won"}
                  onChange={(e) => setOrdered(e.target.checked)}
                  className="h-3.5 w-3.5"
                />
                Oui, pour
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={orderValue}
                disabled={!ordered || !reached || outcome !== "won"}
                onChange={(e) => setOrderValue(e.target.value)}
                aria-label="Montant de la commande en dinars"
                className="w-24 rounded-[var(--radius-sm)] border border-line bg-surface px-2 py-1.5 text-[13px] disabled:text-faint"
              />
            </div>
          </div>
        </div>

        {error ? (
          <p role="alert" className="mt-3 rounded-[var(--radius-sm)] border border-danger/20 bg-danger-soft px-3 py-2 text-[12px] text-danger">
            {error}
          </p>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="submit"
            className="rounded-[var(--radius-md)] bg-primary px-4 py-2 text-[13px] font-semibold text-white hover:bg-primary-hi"
          >
            Ajouter cet appel
          </button>
          {recorded.length > 0 ? (
            <button
              type="button"
              onClick={undoLast}
              className="rounded-[var(--radius-md)] border border-line bg-surface px-3.5 py-2 text-[13px] font-semibold"
            >
              Annuler le dernier
            </button>
          ) : null}
        </div>
      </form>

      <div role="status" aria-live="polite" className={recorded.length ? "mt-3" : "sr-only"}>
        {recorded.length > 0 ? (
          <div className="rounded-[var(--radius-md)] border border-primary-mute bg-primary-soft px-3.5 py-2.5">
            <p className="text-[13px] font-semibold">
              {recorded.length} {recorded.length === 1 ? "appel ajouté" : "appels ajoutes"} sur cette
              visite
            </p>
            <p className="mt-0.5 max-w-[80ch] text-[12px] text-muted">
              Rien n&apos;est enregistré. Ces appels vivent dans cet onglet du navigateur et
              disparaissent quand vous partez, parce que la base de données qui les conserverait
              arrive dans une étape ulterieure.
            </p>
            <ul className="mt-2 flex flex-col gap-1 text-[12px]">
              {recorded.slice(0, 4).map((entry) => (
                <li key={entry.id}>
                  {entry.memberName}, {entry.reached ? "joint" : "sans réponse"}
                  {entry.reached ? `, ${entry.outcome === "won" ? "gagne" : entry.outcome === "rejected" ? "non qualifie" : "encore en reflexion"}` : ""}
                  {entry.orderValue ? `, commande de ${formatTND(entry.orderValue)}` : ""}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
