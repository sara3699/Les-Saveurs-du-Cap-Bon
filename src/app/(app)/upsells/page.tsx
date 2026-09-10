import Link from "next/link";
import { RuleSwitch } from "@/components/upsells/RuleSwitch";
import { ThresholdExplorer, type ThresholdOption } from "@/components/upsells/ThresholdExplorer";
import { ChannelDot, Pill } from "@/components/ui/badges";
import { Card, CardHead, DemoChip, EmptyState, PageHeader, Stat } from "@/components/ui/surfaces";
import { buildAttributionIndex, orderSource } from "@/lib/domain/attribution";
import { CHANNEL_ORDER, channel } from "@/lib/domain/channels";
import type { ChannelId, Order, Product } from "@/lib/domain/types";
import { formatPercent, formatTND, formatTNDCompact } from "@/lib/format";
import { STORE_PROFILE, type Bundle } from "@/lib/mock/operations";
import { getRepositories } from "@/lib/repositories";

export const metadata = { title: "Ventes additionnelles, Les Saveurs du Cap Bon" };

type Params = Promise<Record<string, string | string[] | undefined>>;

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * The threshold the shop trades on today. It is the same value the Store screen
 * shows, read from the one place it is written, so the two screens cannot drift
 * apart. This screen only reads it, which is why editing it from here is not
 * offered.
 */
const FREE_DELIVERY_FROM = STORE_PROFILE.freeDeliveryFrom;

/**
 * Basket values the owner is most likely to weigh against the one she uses.
 * These are a range to try, not a measurement, and the number the shop uses is
 * always in the list so the comparison has a starting point.
 */
const CANDIDATE_THRESHOLDS = [
  ...new Set([150, 175, 200, 225, 250, 300, FREE_DELIVERY_FROM]),
].sort((a, b) => a - b);

/** How far below a threshold an order still counts as a near miss. */
const NEAR_MISS_BAND = 50;

type Kind = Bundle["kind"];

const KIND_META: Record<
  Kind,
  { chip: string; section: string; hint: string; tone: "primary" | "muted" | "accent" }
> = {
  bundle: {
    chip: "Lot",
    section: "Lots, au prix groupe",
    hint: "Deux produits proposes a un prix unique, plus bas que les deux achetes separement.",
    tone: "primary",
  },
  recommendation: {
    chip: "Suggestion",
    section: "Suggestions, proposees a cote d'un produit",
    hint: "Un deuxieme produit est affiche a son prix normal. Rien ne s'ajoute au panier tout seul.",
    tone: "muted",
  },
  threshold: {
    chip: "Seuil",
    section: "Seuil de livraison offerte",
    hint: "Un montant de panier qui change ce que le client paie pour la livraison de sa commande.",
    tone: "accent",
  },
  discount: {
    chip: "Remise",
    section: "Remises",
    hint: "Un pourcentage est retire du panier quand celui-ci correspond a la règle.",
    tone: "muted",
  },
};

/** `group` names the same set in a sentence, for the empty state. */
const KIND_FILTERS: { value: string; label: string; group: string }[] = [
  { value: "", label: "Toutes les règles", group: "règle" },
  { value: "bundle", label: "Lots", group: "offre groupee" },
  { value: "recommendation", label: "Suggestions", group: "suggestion" },
  { value: "threshold", label: "Livraison offerte", group: "règle de livraison offerte" },
  { value: "discount", label: "Remises", group: "remise" },
];

const SECTION_ORDER: Kind[] = ["bundle", "recommendation", "discount"];

/** What the customer pays for the goods, before any delivery fee. */
function goodsValue(order: Order): number {
  return order.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
}

function takeUpRate(rule: Bundle): number | null {
  if (rule.timesShown === 0) return null;
  return (rule.timesTaken / rule.timesShown) * 100;
}

function plural(count: number, singular: string, many: string): string {
  return count === 1 ? singular : many;
}

function Figure({ label, value, money = false }: { label: string; value: string; money?: boolean }) {
  return (
    <div className="rounded-[var(--radius-sm)] border border-line bg-surface-2 px-2.5 py-2">
      <dt className="os-label">{label}</dt>
      <dd className={`os-num mt-1 text-[14px] font-semibold ${money ? "text-accent-ink" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

/** Decorative: the same share is written out in words beside every bar. */
function ShareBar({ share }: { share: number }) {
  return (
    <div aria-hidden className="h-1.5 w-full overflow-hidden rounded-full bg-line">
      <div className="h-full rounded-full bg-primary" style={{ width: `${share}%` }} />
    </div>
  );
}

function RuleCard({ rule, productById }: { rule: Bundle; productById: Map<string, Product> }) {
  const meta = KIND_META[rule.kind];
  const parts = rule.productIds
    .map((id) => productById.get(id))
    .filter((product): product is Product => Boolean(product));
  const partsTotal = parts.reduce((sum, product) => sum + product.price, 0);
  const rate = takeUpRate(rule);
  const perTake = rule.timesTaken > 0 ? rule.revenueAdded / rule.timesTaken : null;

  return (
    <Card className="flex h-full flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[15px] leading-tight">{rule.name}</h3>
        <Pill tone={meta.tone}>{meta.chip}</Pill>
      </div>

      <p className="text-[13px] leading-relaxed text-muted">{rule.description}</p>

      {parts.length > 0 ? (
        <div>
          <p className="os-label">Produits de cette règle</p>
          <ul className="mt-1.5 flex flex-col gap-1">
            {parts.map((product) => (
              <li key={product.id} className="flex items-baseline justify-between gap-3 text-[13px]">
                <span>{product.name}</span>
                <span className="os-num shrink-0 text-[12px] text-muted">
                  {formatTND(product.price, { withCurrency: false })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {rule.bundlePrice !== null && parts.length > 0 ? (
        <div className="grid grid-cols-3 gap-2 rounded-[var(--radius-md)] border border-line bg-surface-2 px-3 py-2.5">
          <div>
            <p className="os-label">Separement</p>
            <p className="os-num mt-1 text-[13px] font-semibold">
              {formatTND(partsTotal, { withCurrency: false })}
            </p>
          </div>
          <div>
            <p className="os-label">Ensemble</p>
            <p className="os-num mt-1 text-[13px] font-semibold">
              {formatTND(rule.bundlePrice, { withCurrency: false })}
            </p>
          </div>
          <div>
            <p className="os-label">Le client economise</p>
            <p className="os-num mt-1 text-[13px] font-semibold text-success">
              {formatTND(partsTotal - rule.bundlePrice, { withCurrency: false })}
            </p>
          </div>
        </div>
      ) : parts.length > 0 ? (
        <p className="rounded-[var(--radius-md)] border border-line bg-surface-2 px-3 py-2.5 text-[12.5px] text-muted">
          Pas de prix groupe. Tout reste a son prix normal, et les produits ci-dessus reviennent a{" "}
          <span className="os-num font-semibold text-ink">{formatTND(partsTotal)}</span> ensemble.
        </p>
      ) : null}

      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Figure label="Affichages" value={String(rule.timesShown)} />
        <Figure label="Acceptations" value={String(rule.timesTaken)} />
        <Figure label="Taux d'acceptation" value={rate === null ? "Pas encore" : formatPercent(rate)} />
        <Figure label="Chiffre d'affaires ajouté" value={formatTNDCompact(rule.revenueAdded)} money />
      </dl>

      {rate === null ? (
        <p className="text-[12px] text-muted">
          Cette règle n'a jamais été affichee, elle n'a donc pas encore de chiffres a comparer.
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          <ShareBar share={rate} />
          <p className="text-[12px] text-muted">
            <span className="os-num">{rule.timesTaken}</span> des{" "}
            <span className="os-num">{rule.timesShown}</span> clients qui l'ont vue l'ont acceptee
            {perTake ? (
              <>
                , soit <span className="os-num">{formatTND(perTake)}</span> par commande
              </>
            ) : null}
            .
          </p>
        </div>
      )}

      <RuleSwitch ruleName={rule.name} startsActive={rule.active} />
    </Card>
  );
}

export default async function UpsellsPage({ searchParams }: { searchParams: Params }) {
  const params = await searchParams;
  const kind = one(params.kind);
  const state = one(params.state);

  const repos = getRepositories();
  const [bundles, products, orders, attributions, connections] = await Promise.all([
    repos.workspace.bundles(),
    repos.workspace.products(),
    repos.orders.list(),
    repos.workspace.attributions(),
    repos.intégrations.list(),
  ]);

  const index = buildAttributionIndex(attributions, connections);
  const productById = new Map(products.map((product) => [product.id, product]));

  const running = bundles.filter((rule) => rule.active);
  const revenueRunning = running.reduce((sum, rule) => sum + rule.revenueAdded, 0);
  const shownRunning = running.reduce((sum, rule) => sum + rule.timesShown, 0);
  const takenRunning = running.reduce((sum, rule) => sum + rule.timesTaken, 0);
  const overallRate = shownRunning > 0 ? (takenRunning / shownRunning) * 100 : 0;

  // The free delivery figures, worked out from the orders themselves.
  const baskets = orders.map(goodsValue);
  const orderCount = baskets.length || 1;

  const thresholdOptions: ThresholdOption[] = CANDIDATE_THRESHOLDS.map((value) => {
    const reached = baskets.filter((basket) => basket >= value).length;
    const nearMiss = baskets.filter((basket) => basket >= value - NEAR_MISS_BAND && basket < value);
    const averageShort =
      nearMiss.length > 0
        ? nearMiss.reduce((sum, basket) => sum + (value - basket), 0) / nearMiss.length
        : 0;
    const share = (reached / orderCount) * 100;
    return {
      value,
      label: `${value} TND`,
      share,
      shareLabel: formatPercent(share),
      reachedLabel: `${reached} sur ${baskets.length}`,
      justShortLabel:
        nearMiss.length > 0
          ? `${nearMiss.length} ${plural(nearMiss.length, "commande s'arrete", "commandes s'arretent")} a moins de ${NEAR_MISS_BAND} TND du seuil, en moyenne ${formatTND(averageShort)} en dessous.`
          : `Aucune commande de ce jeu d'exemple ne s'arrete a moins de ${NEAR_MISS_BAND} TND du seuil.`,
    };
  });

  const current =
    thresholdOptions.find((option) => option.value === FREE_DELIVERY_FROM) ?? thresholdOptions[0];

  const overThreshold = orders.filter((order) => goodsValue(order) >= FREE_DELIVERY_FROM);
  const perChannel = new Map<ChannelId, number>();
  for (const order of overThreshold) {
    const source = orderSource(order, index);
    perChannel.set(source.channelId, (perChannel.get(source.channelId) ?? 0) + 1);
  }
  const channelRows = CHANNEL_ORDER.map((id) => ({
    id,
    label: channel(id).label,
    count: perChannel.get(id) ?? 0,
  }))
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count);

  // Filters
  const visible = bundles.filter((rule) => {
    if (kind && rule.kind !== kind) return false;
    if (state === "on" && !rule.active) return false;
    if (state === "off" && rule.active) return false;
    return true;
  });

  const thresholdRule = visible.find((rule) => rule.kind === "threshold") ?? null;
  const thresholdRate = thresholdRule ? takeUpRate(thresholdRule) : null;

  const keep = (extra: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const merged: Record<string, string | undefined> = { kind, state, ...extra };
    for (const [key, value] of Object.entries(merged)) if (value) next.set(key, value);
    const qs = next.toString();
    return qs ? `/upsells?${qs}` : "/upsells";
  };

  const chipClass = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-xs font-semibold ${
      active
        ? "border-primary bg-primary text-white"
        : "border-line bg-surface-2 text-muted hover:border-line-strong"
    }`;

  const ranked = [...visible].sort((a, b) => (takeUpRate(b) ?? -1) - (takeUpRate(a) ?? -1));

  // The empty state has to describe the filter that actually emptied the list,
  // rather than guess at one the owner may not have picked.
  const pickedKind = KIND_FILTERS.find((filter) => filter.value === (kind ?? ""));
  const groupLabel = pickedKind ? pickedKind.group : "règle de ce type";
  const stateWord = state === "on" ? "active" : state === "off" ? "désactivée" : null;
  const filterSentence = stateWord
    ? `Aucune ${groupLabel} n'est ${stateWord}.`
    : `Cette boutique n'utilisé aucune ${groupLabel}.`;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Ventes additionnelles"
        subtitle="Les règles qui augmentent la valeur d'une commande : ce que chacune propose, a quelle frequence les clients l'acceptent, et ce qu'elle a rapporte."
        actions={<DemoChip />}
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Ajoute par les règles actives"
          value={formatTNDCompact(revenueRunning)}
          détail={`Sur ${running.length} ${plural(running.length, "règle", "règles")}`}
          tone="money"
        />
        <Stat
          label="Règles actives"
          value={`${running.length} sur ${bundles.length}`}
          détail={`${bundles.length - running.length} desactivees`}
        />
        <Stat
          label="Affichages d'une offre"
          value={String(shownRunning)}
          détail="Sur les règles actives"
        />
        <Stat
          label="Acceptations d'une offre"
          value={String(takenRunning)}
          détail={`${formatPercent(overallRate)} des offres affichees`}
        />
      </section>

      <p className="max-w-[86ch] text-[13px] leading-relaxed text-muted">
        Tous les chiffres de cet écran sont des données d'exemple. Le chiffre d'affaires ajouté
        compte ce que l'offre elle-même a rapporte sur les commandes ou elle a été acceptee, pas la
        commande entiere et pas le bénéfice, et il n'a pas été compare aux commandes qui n'ont
        jamais vu la règle. Les quatre chiffres ci-dessus portent sur toutes les règles de la
        boutique, ils restent donc les memes quel que soit le filtre choisi ci-dessous.
      </p>

      <Card>
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filtrer les règles">
          {KIND_FILTERS.map((filter) => (
            <Link
              key={filter.value || "all"}
              href={keep({ kind: filter.value || undefined })}
              aria-current={(kind ?? "") === filter.value ? "page" : undefined}
              className={chipClass((kind ?? "") === filter.value)}
            >
              {filter.label}
            </Link>
          ))}
          <span aria-hidden className="mx-1 h-5 w-px bg-line" />
          <Link
            href={keep({ state: state === "on" ? undefined : "on" })}
            aria-current={state === "on" ? "true" : undefined}
            className={chipClass(state === "on")}
          >
            Actives
          </Link>
          <Link
            href={keep({ state: state === "off" ? undefined : "off" })}
            aria-current={state === "off" ? "true" : undefined}
            className={chipClass(state === "off")}
          >
            Desactivees
          </Link>
        </div>
      </Card>

      {visible.length === 0 ? (
        <EmptyState
          title="Aucune règle ne correspond a ces filtres"
          body={`${filterSentence} La boutique compte ${bundles.length} règles en tout, dont ${running.length} actives.`}
          action={{ label: "Afficher toutes les règles", href: "/upsells" }}
        />
      ) : null}

      {thresholdRule ? (
        <Card className="border-accent-line">
          <CardHead
            title={thresholdRule.name}
            hint={thresholdRule.description}
            action={<Pill tone="accent">{KIND_META.threshold.chip}</Pill>}
          />

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="flex flex-col gap-2">
              <p className="os-label">Votre seuil actuel</p>
              <p className="os-num font-display text-[30px] font-bold leading-none tracking-tight text-accent-ink">
                {formatTNDCompact(FREE_DELIVERY_FROM)}
              </p>
              <p className="text-[12.5px] leading-relaxed text-muted">
                En dessous, le client paie les frais de livraison de sa zone. Ce montant est
                range avec vos frais de livraison sur{" "}
                <Link href="/store" className="font-semibold text-primary hover:underline">
                  l'écran Boutique
                </Link>
                . Le modifier depuis cet écran est concu mais pas developpe.
              </p>
              <RuleSwitch ruleName={thresholdRule.name} startsActive={thresholdRule.active} />
            </div>

            <div className="flex flex-col gap-2 border-line lg:border-l lg:pl-4">
              <p className="os-label">Commandes qui l'atteignent</p>
              <p className="os-num font-display text-[30px] font-bold leading-none tracking-tight">
                {current.shareLabel}
              </p>
              <ShareBar share={current.share} />
              <p className="text-[12.5px] leading-relaxed text-muted">
                <span className="os-num">{current.reachedLabel}</span> commandes de ce jeu
                d'exemple ont{" "}
                <span className="os-num">{formatTNDCompact(FREE_DELIVERY_FROM)}</span> ou plus de
                marchandises dans le panier.{" "}
                {current.justShortLabel} Les paniers qui passent juste a cote sont ceux pour
                lesquels le rappel est ecrit.
              </p>
            </div>

            <div className="flex flex-col gap-2 border-line lg:border-l lg:pl-4">
              <p className="os-label">D'ou viennent ces commandes</p>
              {channelRows.length === 0 ? (
                <p className="text-[13px] text-muted">
                  Aucune commande de ce jeu d'exemple n'atteint encore le seuil.
                </p>
              ) : null}
              <ul className="flex flex-col gap-1.5">
                {channelRows.map((row) => (
                  <li key={row.id} className="flex items-center justify-between gap-3 text-[13px]">
                    <span className="flex items-center gap-2">
                      <ChannelDot channelId={row.id} />
                      {row.label}
                    </span>
                    <span className="os-num shrink-0 text-[12px] text-muted">
                      {row.count} {plural(row.count, "commande", "commandes")},{" "}
                      {formatPercent((row.count / (overThreshold.length || 1)) * 100)}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-[12px] leading-relaxed text-muted">
                Le canal par lequel une commande est arrivée est conserve, donc un panier plus
                gros passe sur WhatsApp reste un panier WhatsApp ici.
              </p>
            </div>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Figure label="Affichages" value={String(thresholdRule.timesShown)} />
            <Figure label="Acceptations" value={String(thresholdRule.timesTaken)} />
            <Figure
              label="Taux d'acceptation"
              value={thresholdRate === null ? "Pas encore" : formatPercent(thresholdRate)}
            />
            <Figure label="Chiffre d'affaires ajouté" value={formatTNDCompact(thresholdRule.revenueAdded)} money />
          </dl>
          <p className="mt-2 text-[12px] leading-relaxed text-muted">
            Les affichages comptent les fois ou un panier a été informe du montant restant pour
            obtenir la livraison offerte, et les acceptations comptent les fois ou ce panier a
            ensuite atteint le seuil. C'est une question differente de la part affichee plus haut,
            qui porte sur toutes les commandes, que le rappel soit apparu ou non.
          </p>

          <div className="mt-4">
            <ThresholdExplorer options={thresholdOptions} currentValue={FREE_DELIVERY_FROM} />
          </div>
        </Card>
      ) : null}

      {SECTION_ORDER.map((sectionKind) => {
        const rules = visible.filter((rule) => rule.kind === sectionKind);
        if (rules.length === 0) return null;
        const meta = KIND_META[sectionKind];
        return (
          <section key={sectionKind} className="flex flex-col gap-3">
            <div>
              <h2 className="os-label">
                {meta.section}, {rules.length}
              </h2>
              <p className="mt-1 max-w-[80ch] text-[13px] text-muted">{meta.hint}</p>
            </div>
            <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
              {rules.map((rule) => (
                <RuleCard key={rule.id} rule={rule} productById={productById} />
              ))}
            </div>
          </section>
        );
      })}

      {ranked.length > 0 ? (
        <Card>
          <CardHead
            title="Les règles cote a cote"
            hint="Classees par taux d'acceptation, pour reperer vite une règle souvent affichee et rarement acceptee."
          />
          <div className="os-scroll">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="os-label pb-2.5 pr-3 text-left font-normal">Regle</th>
                  <th className="os-label pb-2.5 pr-3 text-left font-normal">Type</th>
                  <th className="os-label pb-2.5 pr-3 text-left font-normal">Etat</th>
                  <th className="os-label pb-2.5 pr-3 text-right font-normal">Affichages</th>
                  <th className="os-label pb-2.5 pr-3 text-right font-normal">Acceptations</th>
                  <th className="os-label pb-2.5 pr-3 text-right font-normal">Taux d'acceptation</th>
                  <th className="os-label pb-2.5 text-right font-normal">Ajoute, TND</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((rule) => {
                  const rate = takeUpRate(rule);
                  return (
                    <tr key={rule.id} className="border-t border-line hover:bg-surface-2">
                      <td className="py-2.5 pr-3 text-[13px] font-semibold">{rule.name}</td>
                      <td className="py-2.5 pr-3">
                        <Pill tone={KIND_META[rule.kind].tone}>{KIND_META[rule.kind].chip}</Pill>
                      </td>
                      <td className="py-2.5 pr-3 text-[12.5px]">
                        {rule.active ? (
                          <span className="font-semibold text-primary">Active</span>
                        ) : (
                          <span className="text-muted">Desactivee</span>
                        )}
                      </td>
                      <td className="os-num py-2.5 pr-3 text-right text-[12.5px]">{rule.timesShown}</td>
                      <td className="os-num py-2.5 pr-3 text-right text-[12.5px]">{rule.timesTaken}</td>
                      <td className="os-num py-2.5 pr-3 text-right text-[12.5px]">
                        {rate === null ? <span className="text-muted">Pas encore</span> : formatPercent(rate)}
                      </td>
                      <td className="os-num py-2.5 text-right text-[12.5px] font-semibold">
                        {formatTND(rule.revenueAdded, { withCurrency: false })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      <p className="max-w-[86ch] text-xs leading-relaxed text-muted">
        Ecrire une nouvelle règle, modifier le montant de la livraison offerte et arreter vraiment
        une règle sont concus mais pas developpes, donc les interrupteurs de cet écran changent ce
        que vous voyez et rien d'autre. Aucun compte n'est connecté, et rien ici n'est envoyé a un
        client.
      </p>
    </div>
  );
}
