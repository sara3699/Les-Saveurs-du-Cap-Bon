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

export const metadata = { title: "Up and cross sells, Les Saveurs du Cap Bon" };

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
    chip: "Bundle",
    section: "Bundles, priced together",
    hint: "Two products offered as one price, lower than the two bought on their own.",
    tone: "primary",
  },
  recommendation: {
    chip: "Suggestion",
    section: "Suggestions, offered beside a product",
    hint: "A second product is shown at its normal price. Nothing goes into the basket on its own.",
    tone: "muted",
  },
  threshold: {
    chip: "Threshold",
    section: "Free delivery threshold",
    hint: "A basket value that changes what the customer pays to have the order delivered.",
    tone: "accent",
  },
  discount: {
    chip: "Discount",
    section: "Discounts",
    hint: "A percentage comes off the basket when it matches the rule.",
    tone: "muted",
  },
};

/** `group` names the same set in a sentence, for the empty state. */
const KIND_FILTERS: { value: string; label: string; group: string }[] = [
  { value: "", label: "All rules", group: "rules" },
  { value: "bundle", label: "Bundles", group: "bundles" },
  { value: "recommendation", label: "Suggestions", group: "suggestions" },
  { value: "threshold", label: "Free delivery", group: "free delivery rules" },
  { value: "discount", label: "Discounts", group: "discounts" },
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
          <p className="os-label">Products in this rule</p>
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
            <p className="os-label">Parts</p>
            <p className="os-num mt-1 text-[13px] font-semibold">
              {formatTND(partsTotal, { withCurrency: false })}
            </p>
          </div>
          <div>
            <p className="os-label">Together</p>
            <p className="os-num mt-1 text-[13px] font-semibold">
              {formatTND(rule.bundlePrice, { withCurrency: false })}
            </p>
          </div>
          <div>
            <p className="os-label">Customer saves</p>
            <p className="os-num mt-1 text-[13px] font-semibold text-success">
              {formatTND(partsTotal - rule.bundlePrice, { withCurrency: false })}
            </p>
          </div>
        </div>
      ) : parts.length > 0 ? (
        <p className="rounded-[var(--radius-md)] border border-line bg-surface-2 px-3 py-2.5 text-[12.5px] text-muted">
          No bundle price. Everything stays at its normal price, and the products above come to{" "}
          <span className="os-num font-semibold text-ink">{formatTND(partsTotal)}</span> together.
        </p>
      ) : null}

      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Figure label="Shown" value={String(rule.timesShown)} />
        <Figure label="Taken" value={String(rule.timesTaken)} />
        <Figure label="Take-up" value={rate === null ? "None yet" : formatPercent(rate)} />
        <Figure label="Revenue added" value={formatTNDCompact(rule.revenueAdded)} money />
      </dl>

      {rate === null ? (
        <p className="text-[12px] text-muted">
          This rule has never been shown, so it has no figures to compare yet.
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          <ShareBar share={rate} />
          <p className="text-[12px] text-muted">
            <span className="os-num">{rule.timesTaken}</span> of the{" "}
            <span className="os-num">{rule.timesShown}</span> customers who saw it took it
            {perTake ? (
              <>
                , worth <span className="os-num">{formatTND(perTake)}</span> an order
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
    repos.integrations.list(),
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
      reachedLabel: `${reached} of ${baskets.length}`,
      justShortLabel:
        nearMiss.length > 0
          ? `${nearMiss.length} ${plural(nearMiss.length, "order stops", "orders stop")} within ${NEAR_MISS_BAND} TND of it, on average ${formatTND(averageShort)} short.`
          : `No order in this demo set stops within ${NEAR_MISS_BAND} TND of it.`,
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
  const groupLabel = pickedKind ? pickedKind.group : "rules of that kind";
  const stateWord = state === "on" ? "running" : state === "off" ? "switched off" : null;
  const filterSentence = stateWord
    ? `None of the ${groupLabel} is ${stateWord}.`
    : `This shop has no ${groupLabel}.`;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Up and cross sells"
        subtitle="The rules that raise the value of an order: what each one offers, how often customers take it, and what it brought in."
        actions={<DemoChip />}
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Added by the rules that are running"
          value={formatTNDCompact(revenueRunning)}
          detail={`Across ${running.length} ${plural(running.length, "rule", "rules")}`}
          tone="money"
        />
        <Stat
          label="Rules running"
          value={`${running.length} of ${bundles.length}`}
          detail={`${bundles.length - running.length} switched off`}
        />
        <Stat
          label="Times an offer was shown"
          value={String(shownRunning)}
          detail="On the rules that are running"
        />
        <Stat
          label="Times an offer was taken"
          value={String(takenRunning)}
          detail={`${formatPercent(overallRate)} of the offers shown`}
        />
      </section>

      <p className="max-w-[86ch] text-[13px] leading-relaxed text-muted">
        Every figure on this screen is demo data. Revenue added counts what the offer itself was
        worth on the orders where it was taken, not the whole order and not the profit, and it has
        not been measured against the orders that never saw the rule. The four figures above cover
        every rule in the shop, so they stay the same whichever filter you pick below.
      </p>

      <Card>
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter the rules">
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
            Running
          </Link>
          <Link
            href={keep({ state: state === "off" ? undefined : "off" })}
            aria-current={state === "off" ? "true" : undefined}
            className={chipClass(state === "off")}
          >
            Switched off
          </Link>
        </div>
      </Card>

      {visible.length === 0 ? (
        <EmptyState
          title="No rule matches these filters"
          body={`${filterSentence} The shop has ${bundles.length} rules in all, ${running.length} of them running.`}
          action={{ label: "Show every rule", href: "/upsells" }}
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
              <p className="os-label">Your threshold now</p>
              <p className="os-num font-display text-[30px] font-bold leading-none tracking-tight text-accent-ink">
                {formatTNDCompact(FREE_DELIVERY_FROM)}
              </p>
              <p className="text-[12.5px] leading-relaxed text-muted">
                Below it the customer pays the delivery fee for their zone. The number lives with
                your delivery fees on the{" "}
                <Link href="/store" className="font-semibold text-primary hover:underline">
                  Store screen
                </Link>
                . Changing it from here is designed and not built.
              </p>
              <RuleSwitch ruleName={thresholdRule.name} startsActive={thresholdRule.active} />
            </div>

            <div className="flex flex-col gap-2 border-line lg:border-l lg:pl-4">
              <p className="os-label">Orders that reach it</p>
              <p className="os-num font-display text-[30px] font-bold leading-none tracking-tight">
                {current.shareLabel}
              </p>
              <ShareBar share={current.share} />
              <p className="text-[12.5px] leading-relaxed text-muted">
                <span className="os-num">{current.reachedLabel}</span> orders in this demo set have{" "}
                <span className="os-num">{formatTNDCompact(FREE_DELIVERY_FROM)}</span> or more of
                goods in the basket.{" "}
                {current.justShortLabel} The near misses are the baskets the reminder is written
                for.
              </p>
            </div>

            <div className="flex flex-col gap-2 border-line lg:border-l lg:pl-4">
              <p className="os-label">Where those orders came from</p>
              {channelRows.length === 0 ? (
                <p className="text-[13px] text-muted">
                  No order in this demo set reaches the threshold yet.
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
                      {row.count} {plural(row.count, "order", "orders")},{" "}
                      {formatPercent((row.count / (overThreshold.length || 1)) * 100)}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-[12px] leading-relaxed text-muted">
                The channel an order arrived on is kept, so a bigger basket on WhatsApp stays a
                WhatsApp basket here.
              </p>
            </div>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Figure label="Shown" value={String(thresholdRule.timesShown)} />
            <Figure label="Taken" value={String(thresholdRule.timesTaken)} />
            <Figure
              label="Take-up"
              value={thresholdRate === null ? "None yet" : formatPercent(thresholdRate)}
            />
            <Figure label="Revenue added" value={formatTNDCompact(thresholdRule.revenueAdded)} money />
          </dl>
          <p className="mt-2 text-[12px] leading-relaxed text-muted">
            Shown counts the times a basket was told how much was left to reach free delivery, and
            taken counts the times that basket then reached it. That is a different question from
            the share above, which looks at every order whether or not the reminder appeared.
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
            title="Rules side by side"
            hint="Ranked by take-up, so a rule that is shown often and taken rarely is easy to spot."
          />
          <div className="os-scroll">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="os-label pb-2.5 pr-3 text-left font-normal">Rule</th>
                  <th className="os-label pb-2.5 pr-3 text-left font-normal">Kind</th>
                  <th className="os-label pb-2.5 pr-3 text-left font-normal">State</th>
                  <th className="os-label pb-2.5 pr-3 text-right font-normal">Shown</th>
                  <th className="os-label pb-2.5 pr-3 text-right font-normal">Taken</th>
                  <th className="os-label pb-2.5 pr-3 text-right font-normal">Take-up</th>
                  <th className="os-label pb-2.5 text-right font-normal">Added, TND</th>
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
                          <span className="font-semibold text-primary">Running</span>
                        ) : (
                          <span className="text-muted">Switched off</span>
                        )}
                      </td>
                      <td className="os-num py-2.5 pr-3 text-right text-[12.5px]">{rule.timesShown}</td>
                      <td className="os-num py-2.5 pr-3 text-right text-[12.5px]">{rule.timesTaken}</td>
                      <td className="os-num py-2.5 pr-3 text-right text-[12.5px]">
                        {rate === null ? <span className="text-muted">None yet</span> : formatPercent(rate)}
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
        Writing a new rule, editing the free delivery number and stopping a rule for real are
        designed and not built, so the switches on this screen move what you see and nothing else.
        No account is connected, and nothing here is sent to a customer.
      </p>
    </div>
  );
}
