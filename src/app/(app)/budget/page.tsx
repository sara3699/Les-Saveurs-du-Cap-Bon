import Link from "next/link";
import { LimitPill, Meter, shareLabel, spendTone } from "@/components/budget/meter";
import { ChannelDot } from "@/components/ui/badges";
import { Card, CardHead, DemoChip, EmptyState, PageHeader, Stat } from "@/components/ui/surfaces";
import { buildAttributionIndex, totalsByChannel } from "@/lib/domain/attribution";
import { formatDate, formatTND, formatTNDCompact } from "@/lib/format";
import { revenueOf } from "@/lib/metrics";
import { DEMO_NOW } from "@/lib/mock/time";
import { getRepositories } from "@/lib/repositories";

export const metadata = { title: "Gestion du budget, Les Saveurs du Cap Bon" };

// The demo clock moves with the visit, so these pages are rendered per request
// rather than frozen into the build.
export const dynamic = "force-dynamic";

type Params = Promise<Record<string, string | string[] | undefined>>;

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function Figure({
  label,
  value,
  money = false,
}: {
  label: string;
  value: string;
  money?: boolean;
}) {
  return (
    <div>
      <dt className="os-label">{label}</dt>
      <dd className={`os-num mt-0.5 text-[15px] font-semibold ${money ? "text-accent-ink" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

export default async function BudgetPage({ searchParams }: { searchParams: Params }) {
  const params = await searchParams;
  const requested = one(params.budget);
  const nearOnly = one(params.near) === "1";

  const repos = getRepositories();
  const [{ budgets, lines }, recentOrders, connections, attributions] = await Promise.all([
    repos.workspace.budgets(),
    repos.orders.list({ sinceDays: 30 }),
    repos.intégrations.list(),
    repos.workspace.attributions(),
  ]);

  // A budget is worth the sum of the lines underneath it. The tiles, the summary
  // table and the line tables are all read off this one addition, so a card can
  // never show a total that its own lines contradict.
  const rollups = budgets.map((budget) => {
    const own = lines.filter((line) => line.budgetId === budget.id);
    return {
      budget,
      lines: own,
      planned: own.length ? own.reduce((sum, l) => sum + l.planned, 0) : budget.planned,
      used: own.length ? own.reduce((sum, l) => sum + l.used, 0) : budget.used,
    };
  });

  const period = budgets[0]?.period ?? "Ce mois-ci";
  const plannedTotal = rollups.reduce((sum, r) => sum + r.planned, 0);
  const usedTotal = rollups.reduce((sum, r) => sum + r.used, 0);
  const leftTotal = plannedTotal - usedTotal;
  const atLimit = lines.filter((l) => spendTone(l.used, l.planned) !== "ok");

  // The snapshot subtracts spend from takings. It is not accounting, and the
  // note under it says exactly which columns were added up.
  const revenue = revenueOf(recentOrders);
  const leftAfterSpend = revenue - usedTotal;
  const index = buildAttributionIndex(attributions, connections);
  const bySource = totalsByChannel(recentOrders, index)
    .filter((row) => row.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue);

  const focus = rollups.find((r) => r.budget.id === requested) ?? null;
  const cards = (focus ? [focus] : rollups)
    .map((row) => ({
      ...row,
      lineCount: row.lines.length,
      lines: row.lines.filter((line) => !nearOnly || spendTone(line.used, line.planned) !== "ok"),
    }))
    .filter((row) => row.lines.length > 0);

  const keep = (extra: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const merged = { budget: focus?.budget.id, near: nearOnly ? "1" : undefined, ...extra };
    for (const [key, value] of Object.entries(merged)) {
      if (value) next.set(key, String(value));
    }
    const qs = next.toString();
    return qs ? `/budget?${qs}` : "/budget";
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Gestion du budget"
        subtitle={`${period}. Ce que vous aviez prévu de depenser, ce qui est déjà sorti, et ce que le plan permet encore.`}
        actions={<DemoChip />}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Prévu ce mois-ci"
          value={formatTNDCompact(plannedTotal)}
          détail={budgets.map((b) => b.name).join(", ")}
        />
        <Stat
          label="Utilisé a ce jour"
          value={formatTNDCompact(usedTotal)}
          détail={`${shareLabel(usedTotal, plannedTotal)} du plan`}
        />
        <Stat
          label="Restant dans le plan"
          value={formatTNDCompact(leftTotal)}
          détail="Si rien de nouveau n'y est ajouté"
          tone="money"
        />
        <Stat
          label="Lignes a leur limite"
          value={String(atLimit.length)}
          détail={
            atLimit.length > 0
              ? atLimit.map((l) => l.label).join(", ")
              : "Chaque ligne a encore de la marge"
          }
        />
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.35fr_1fr]">
        <Card>
          <CardHead
            title="Prévu et utilisé"
            hint={`Les trois budgets de ${period}, avec le total en dessous`}
          />
          <div className="os-scroll">
            <table className="w-full min-w-[600px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="os-label pb-2.5 pr-3 text-left font-normal">Budget</th>
                  <th className="os-label pb-2.5 pr-3 text-left font-normal">Part utilisée</th>
                  <th className="os-label pb-2.5 pr-3 text-right font-normal">Prévu, TND</th>
                  <th className="os-label pb-2.5 pr-3 text-right font-normal">Utilisé, TND</th>
                  <th className="os-label pb-2.5 text-right font-normal">Restant, TND</th>
                </tr>
              </thead>
              <tbody>
                {rollups.map(({ budget, planned, used }) => (
                  <tr key={budget.id} className="border-t border-line">
                    <td className="py-2.5 pr-3">
                      <Link
                        href={keep({ budget: budget.id })}
                        className="text-[13px] font-semibold hover:text-primary hover:underline"
                      >
                        {budget.name}
                      </Link>
                      <LimitPill used={used} planned={planned} className="mt-1" />
                    </td>
                    <td className="py-2.5 pr-3">
                      <Meter used={used} planned={planned} />
                    </td>
                    <td className="os-num py-2.5 pr-3 text-right text-[12.5px]">
                      {formatTND(planned, { withCurrency: false })}
                    </td>
                    <td className="os-num py-2.5 pr-3 text-right text-[12.5px]">
                      {formatTND(used, { withCurrency: false })}
                    </td>
                    <td className="os-num py-2.5 text-right text-[12.5px]">
                      {formatTND(planned - used, { withCurrency: false })}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-line-strong">
                  <td className="py-2.5 pr-3 text-[13px] font-semibold">Les trois budgets</td>
                  <td className="py-2.5 pr-3">
                    <Meter used={usedTotal} planned={plannedTotal} />
                  </td>
                  <td className="os-num py-2.5 pr-3 text-right text-[12.5px] font-semibold">
                    {formatTND(plannedTotal, { withCurrency: false })}
                  </td>
                  <td className="os-num py-2.5 pr-3 text-right text-[12.5px] font-semibold">
                    {formatTND(usedTotal, { withCurrency: false })}
                  </td>
                  <td className="os-num py-2.5 text-right text-[12.5px] font-semibold">
                    {formatTND(leftTotal, { withCurrency: false })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted">
            Utilisé correspond a ce qui est déjà sorti du compte ce mois-ci. Restant correspond a
            ce que le plan permet encore, ce qui n'est pas la même chose que de l'argent disponible
            en banque.
          </p>
        </Card>

        <Card>
          <CardHead
            title="Apercu du resultat"
            hint="Chiffres d'exemple, additionnes sur cet écran"
          />
          <dl className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
              <dt className="text-[13px] text-muted">Chiffre d'affaires, 30 derniers jours</dt>
              <dd className="os-num text-[14px] font-semibold">{formatTND(revenue)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
              <dt className="text-[13px] text-muted">Budget utilisé, les trois</dt>
              <dd className="os-num text-[14px] font-semibold text-danger">
                -{formatTND(usedTotal)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3 rounded-[var(--radius-md)] border border-accent-line bg-accent-soft px-3 py-2">
              <dt className="text-[13px] font-semibold text-accent-ink">
                Restant après les dépenses
              </dt>
              <dd className="os-num text-[16px] font-bold text-accent-ink">
                {formatTND(leftAfterSpend)}
              </dd>
            </div>
          </dl>

          {bySource.length > 0 ? (
            <>
              <p className="os-label mt-4">D'ou vient ce chiffre d'affaires</p>
              <ul className="mt-2 flex flex-col gap-1.5">
                {bySource.map((row) => (
                  <li
                    key={row.channelId}
                    className="flex items-center justify-between gap-3 text-[13px]"
                  >
                    <span className="flex items-center gap-2 font-semibold">
                      <ChannelDot channelId={row.channelId} size={9} />
                      {row.label}
                    </span>
                    <span className="os-num text-[12.5px] text-muted">
                      {formatTND(row.revenue, { withCurrency: false })}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          <p className="mt-4 text-xs leading-relaxed text-muted">
            Deux chiffres entrent ici. Le chiffre d'affaires reprend toutes les commandes passées
            sur les 30 jours jusqu'au{" "}
            {formatDate(DEMO_NOW.toISOString())}, les commandes refusees et remboursees retirées.
            Les dépenses sont la colonne utilisé des trois budgets, qui couvrent {period}, donc les
            deux ne comptent pas exactement les memes jours. Ce que les produits coutent a fabriquer
            n'est pas compris ici, lisez donc la dernière ligne comme l'argent restant face au plan
            plutot que comme un bénéfice dans vos comptes.
          </p>
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap gap-1.5">
          <Link
            href={keep({ budget: undefined })}
            aria-current={focus ? undefined : "page"}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
              focus ? "border-line bg-surface-2 text-muted" : "border-primary bg-primary text-white"
            }`}
          >
            Les trois budgets
          </Link>
          {budgets.map((budget) => {
            const active = focus?.budget.id === budget.id;
            return (
              <Link
                key={budget.id}
                href={keep({ budget: active ? undefined : budget.id })}
                aria-current={active ? "page" : undefined}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  active
                    ? "border-primary bg-primary text-white"
                    : "border-line bg-surface-2 text-muted"
                }`}
              >
                {budget.name}
              </Link>
            );
          })}
          <Link
            href={keep({ near: nearOnly ? undefined : "1" })}
            aria-current={nearOnly ? "true" : undefined}
            className={`ml-auto rounded-full border px-3 py-1.5 text-xs font-semibold ${
              nearOnly
                ? "border-accent-line bg-accent-soft text-accent-ink"
                : "border-line bg-surface-2 text-muted"
            }`}
          >
            Seulement les lignes a leur limite
          </Link>
        </div>
      </Card>

      <section className="flex flex-col gap-3">
        <h2 className="os-label">
          {focus ? `${focus.budget.name}, ligne par ligne` : "Tous les budgets, ligne par ligne"}
        </h2>

        {cards.length === 0 ? (
          <EmptyState
            title="Aucune ligne ne correspond a ces filtres"
            body={
              nearOnly
                ? "Seules les lignes qui ont utilisé 95 pour cent ou plus de leur plan sont affichees, et rien dans cette vue n'est alle aussi loin. Retirez le filtre pour revoir toutes les lignes."
                : "Il n'y a pas encore de ligne sous ce budget, il n'y a donc rien a detailler ici."
            }
            action={{ label: "Afficher toutes les lignes", href: "/budget" }}
          />
        ) : (
          cards.map(({ budget, planned, used, lineCount, lines: budgetLines }) => {
            const warned = spendTone(used, planned) !== "ok";
            return (
              <Card key={budget.id} className={warned ? "border-accent-line" : ""}>
                <CardHead
                  title={budget.name}
                  hint={`${budget.period}, ${shareLabel(used, planned)} du plan utilisé`}
                  action={<LimitPill used={used} planned={planned} />}
                />

                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <Meter used={used} planned={planned} showShare={false} />
                  <dl className="flex flex-wrap gap-x-7 gap-y-2">
                    <Figure label="Prévu" value={formatTND(planned)} />
                    <Figure label="Utilisé" value={formatTND(used)} />
                    <Figure label="Restant" value={formatTND(planned - used)} money />
                  </dl>
                </div>

                <div className="os-scroll mt-4">
                  <table className="w-full min-w-[700px] border-collapse text-sm">
                    <thead>
                      <tr>
                        <th className="os-label pb-2.5 pr-3 text-left font-normal">Ligne</th>
                        <th className="os-label pb-2.5 pr-3 text-left font-normal">
                          Part utilisée
                        </th>
                        <th className="os-label pb-2.5 pr-3 text-right font-normal">
                          Prévu, TND
                        </th>
                        <th className="os-label pb-2.5 pr-3 text-right font-normal">
                          Utilisé, TND
                        </th>
                        <th className="os-label pb-2.5 pr-3 text-right font-normal">
                          Restant, TND
                        </th>
                        <th className="os-label pb-2.5 text-left font-normal">Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {budgetLines.map((line) => {
                        const flagged = spendTone(line.used, line.planned) !== "ok";
                        return (
                          <tr
                            key={line.id}
                            className={`border-t border-line ${flagged ? "bg-accent-soft" : ""}`}
                          >
                            <td className="py-2.5 pr-3">
                              <span className="text-[13px] font-semibold">{line.label}</span>
                              <LimitPill used={line.used} planned={line.planned} className="mt-1" />
                            </td>
                            <td className="py-2.5 pr-3">
                              <Meter used={line.used} planned={line.planned} />
                            </td>
                            <td className="os-num py-2.5 pr-3 text-right text-[12.5px]">
                              {formatTND(line.planned, { withCurrency: false })}
                            </td>
                            <td className="os-num py-2.5 pr-3 text-right text-[12.5px]">
                              {formatTND(line.used, { withCurrency: false })}
                            </td>
                            <td className="os-num py-2.5 pr-3 text-right text-[12.5px]">
                              {formatTND(line.planned - line.used, { withCurrency: false })}
                            </td>
                            <td className="py-2.5 text-[12px] text-muted">{line.note ?? ""}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {budgetLines.length < lineCount ? (
                  <p className="mt-2.5 text-xs text-muted">
                    {budgetLines.length} lignes affichees sur {lineCount}. Les montants prevus et
                    utilises en haut de cette carte comptent toujours chaque ligne, y compris celles
                    que le filtre masqué.
                  </p>
                ) : null}
              </Card>
            );
          })
        )}
      </section>

      <p className="text-xs text-muted">
        Cet écran se contente de lire les chiffres. Modifier un plan et envoyer le mois a votre
        comptable ne sont pas encore construits, et rien ici ne deplace d'argent ni ne communique
        avec une banque.
      </p>
    </div>
  );
}
