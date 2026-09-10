"use client";

import { useRef, useState, useTransition } from "react";
import { recordCall, undoCall } from "@/app/(app)/team/actions";
import { Card, CardHead } from "@/components/ui/surfaces";
import { formatTND, formatTNDCompact } from "@/lib/format";
import { conversionRate, summarizeConversions } from "@/lib/metrics";
import type { TeamConversionMetric } from "@/lib/domain/types";

export interface CallRow {
  memberId: string;
  name: string;
  metric: TeamConversionMetric;
}

type Outcome = "won" | "rejected" | "undecided";

interface Recorded {
  /** Local to this list, so an entry keeps its place while the row id arrives. */
  key: string;
  /** The row in the database, or null on a demonstration visit where there is none. */
  callId: string | null;
  memberId: string;
  memberName: string;
  reached: boolean;
  outcome: Outcome;
  orderValue: number | null;
}

/** What one call adds to a member's figures, or takes back when sign is -1. */
function applyCall(
  rows: CallRow[],
  memberId: string,
  entry: { reached: boolean; outcome: Outcome; orderValue: number | null },
  sign: 1 | -1,
): CallRow[] {
  const won = entry.reached && entry.outcome === "won";
  const rejected = entry.reached && entry.outcome === "rejected";
  const ordered = entry.orderValue !== null;

  return rows.map((row) =>
    row.memberId === memberId
      ? {
          ...row,
          metric: {
            ...row.metric,
            callsReceived: row.metric.callsReceived + sign,
            customersReached: row.metric.customersReached + (entry.reached ? sign : 0),
            customersWon: row.metric.customersWon + (won ? sign : 0),
            customersRejected: row.metric.customersRejected + (rejected ? sign : 0),
            ordersPlaced: row.metric.ordersPlaced + (ordered ? sign : 0),
            revenue: row.metric.revenue + sign * (entry.orderValue ?? 0),
          },
        }
      : row,
  );
}

/**
 * Calls do not arrive through any connector, so this is where they come from:
 * somebody types them in after the call. The figures above the form move as soon
 * as one is recorded, then the row is written and the strip underneath says so.
 *
 * A demonstration visit never sends anything. The database refuses its writes at
 * the row level security layer, so the call stays in this browser tab and the
 * strip keeps saying that nothing is saved.
 */
export function CallPerformance({
  rows: initialRows,
  canWrite,
}: {
  rows: CallRow[];
  canWrite: boolean;
}) {
  const [rows, setRows] = useState(initialRows);
  const [recorded, setRecorded] = useState<Recorded[]>([]);
  const [memberId, setMemberId] = useState(initialRows[0]?.memberId ?? "");
  const [reached, setReached] = useState(true);
  const [outcome, setOutcome] = useState<Outcome>("won");
  const [ordered, setOrdered] = useState(true);
  const [orderValue, setOrderValue] = useState("120");
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const nextKey = useRef(0);

  const summary = summarizeConversions(rows.map((r) => r.metric));
  const ranked = [...rows].sort(
    (a, b) => conversionRate(b.metric) - conversionRate(a.metric),
  );

  function record(event: React.FormEvent) {
    event.preventDefault();
    const member = rows.find((r) => r.memberId === memberId);
    if (!member) return;

    const won = reached && outcome === "won";
    const placedOrder = won && ordered;
    const value = placedOrder ? Number(orderValue) : 0;

    if (placedOrder && (!Number.isFinite(value) || value <= 0)) {
      setError("Donnez un montant en dinars à la commande, ou indiquez qu'aucune commande n'a été passée.");
      return;
    }
    setError(null);

    nextKey.current += 1;
    const entry: Recorded = {
      key: String(nextKey.current),
      callId: null,
      memberId: member.memberId,
      memberName: member.name,
      reached,
      outcome: reached ? outcome : "undecided",
      orderValue: placedOrder ? value : null,
    };

    // The screen moves first, so it stays instant whichever way the write goes.
    setRows((current) => applyCall(current, entry.memberId, entry, 1));
    setRecorded((current) => [entry, ...current]);

    // A demonstration visit stops here. There is nothing to send, and the strip
    // underneath says the call lives in this tab only.
    if (!canWrite) return;

    startSaving(async () => {
      const result = await recordCall({
        memberId: entry.memberId,
        reached: entry.reached,
        outcome: entry.outcome,
        orderValue: entry.orderValue,
      });

      if (result.ok) {
        // The row id, so this same call can be taken back out by its own id.
        setRecorded((current) =>
          current.map((item) => (item.key === entry.key ? { ...item, callId: result.callId } : item)),
        );
        return;
      }

      // Nothing was written, so the figures go back to what the database holds
      // and the reader is told why.
      setRows((current) => applyCall(current, entry.memberId, entry, -1));
      setRecorded((current) => current.filter((item) => item.key !== entry.key));
      setError(result.error);
    });
  }

  function undoLast() {
    const last = recorded[0];
    if (!last) return;

    setError(null);
    setRows((current) => applyCall(current, last.memberId, last, -1));
    setRecorded((current) => current.slice(1));

    // Nothing was ever written for this one, so there is nothing to delete.
    const callId = last.callId;
    if (!canWrite || !callId) return;

    startSaving(async () => {
      // Only the row this entry created, named by the id its insert returned.
      const result = await undoCall(callId);
      if (result.ok) return;

      // The row is still there, so the call goes back on the screen too.
      setRows((current) => applyCall(current, last.memberId, last, 1));
      setRecorded((current) => [last, ...current]);
      setError(result.error);
    });
  }

  const tiles = [
    { label: "Appels reçus", value: summary.callsReceived, note: "total de l'équipe" },
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
        Le taux de conversion, ce sont les clients gagnés divisés par les appels reçus. Le chiffre
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
          en ajoutez un
          {canWrite
            ? ", et l'appel est écrit dans la base de données."
            : ", sans que rien ne soit enregistré nulle part."}
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
            <span className="os-label">Comment cela s&apos;est terminé</span>
            <select
              value={outcome}
              disabled={!reached}
              onChange={(e) => setOutcome(e.target.value as Outcome)}
              className="rounded-[var(--radius-sm)] border border-line bg-surface px-2.5 py-1.5 text-[13px] disabled:text-faint"
            >
              <option value="won">Client gagné</option>
              <option value="rejected">Non qualifié</option>
              <option value="undecided">Encore en réflexion</option>
            </select>
          </label>

          <div className="flex flex-col gap-1">
            <span className="os-label">Commande passée</span>
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
            disabled={saving}
            className="rounded-[var(--radius-md)] bg-primary px-4 py-2 text-[13px] font-semibold text-white hover:bg-primary-hi disabled:opacity-60"
          >
            {saving ? "Enregistrement en cours" : "Ajouter cet appel"}
          </button>
          {recorded.length > 0 ? (
            <button
              type="button"
              onClick={undoLast}
              disabled={saving}
              className="rounded-[var(--radius-md)] border border-line bg-surface px-3.5 py-2 text-[13px] font-semibold disabled:opacity-60"
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
              {recorded.length}{" "}
              {canWrite
                ? recorded.length === 1
                  ? "appel enregistré"
                  : "appels enregistrés"
                : recorded.length === 1
                  ? "appel ajouté"
                  : "appels ajoutés"}{" "}
              sur cette visite
            </p>
            <p className="mt-0.5 max-w-[80ch] text-[12px] text-muted">
              {canWrite
                ? "Chaque appel est écrit dans la base de données. Il reste là après un rechargement, et il compte dans l'entonnoir ci-dessus comme dans celui du tableau de bord."
                : "Rien n'est enregistré. Cette visite passe par l'entrée de démonstration, que la base de données laisse tout lire et rien écrire. Ces appels vivent dans cet onglet du navigateur et disparaissent quand vous partez."}
            </p>
            <ul className="mt-2 flex flex-col gap-1 text-[12px]">
              {recorded.slice(0, 4).map((entry) => (
                <li key={entry.key}>
                  {entry.memberName}, {entry.reached ? "joint" : "sans réponse"}
                  {entry.reached ? `, ${entry.outcome === "won" ? "gagné" : entry.outcome === "rejected" ? "non qualifié" : "encore en réflexion"}` : ""}
                  {entry.orderValue ? `, commande de ${formatTND(entry.orderValue)}` : ""}
                  {/* Written the moment the row comes back, so a line never claims
                      to be saved while its write is still on the way. */}
                  {canWrite && !entry.callId ? (
                    <span className="text-muted">, enregistrement en cours</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
