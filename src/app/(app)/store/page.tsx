import Link from "next/link";
import { StorefrontPreview } from "@/components/store/StorefrontPreview";
import { ConnectionPill, SourceBadge } from "@/components/ui/badges";
import { Card, CardHead, DemoChip, EmptyState, PageHeader, Stat } from "@/components/ui/surfaces";
import { CHANNEL_ORDER } from "@/lib/domain/channels";
import { formatTND, formatTNDCompact } from "@/lib/format";
import { STORE } from "@/lib/mock/core";
import { STORE_PROFILE } from "@/lib/mock/operations";
import { getRepositories } from "@/lib/repositories";

export const metadata = { title: "Store, Les Saveurs du Cap Bon" };

type Params = Promise<Record<string, string | string[] | undefined>>;

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Swatches are token names, never hex, so a theme cannot drift from the palette. */
const THEME_SWATCHES: Record<string, string[]> = {
  th_olive: ["bg-primary", "bg-primary-mute", "bg-primary-soft"],
  th_clay: ["bg-accent", "bg-accent-line", "bg-accent-soft"],
  th_linen: ["bg-line-strong", "bg-line", "bg-surface"],
};

const THEME_NOTES: Record<string, string> = {
  th_olive: "The look your shop uses today, and the one this screen is drawn in.",
  th_clay: "A warmer set of colours, saved as a name only.",
  th_linen: "A paler set of colours, saved as a name only.",
};

function DetailRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 border-t border-line py-2 first:border-t-0 first:pt-0">
      <dt className="text-[12px] text-muted">{label}</dt>
      <dd className={`min-w-0 break-words text-right text-[13px] font-semibold ${mono ? "os-num" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

export default async function StorePage({ searchParams }: { searchParams: Params }) {
  const params = await searchParams;
  const cityQuery = (one(params.city) ?? "").trim();

  const repos = getRepositories();
  const [products, connections] = await Promise.all([
    repos.workspace.products(),
    repos.integrations.list(),
  ]);

  const profile = STORE_PROFILE;
  const needle = cityQuery.toLowerCase();
  const zones = needle
    ? profile.deliveryZones.filter(
        (zone) =>
          zone.name.toLowerCase().includes(needle) || zone.cities.toLowerCase().includes(needle),
      )
    : profile.deliveryZones;

  const preparationLabel =
    profile.preparationDays === 1 ? "1 day" : `${profile.preparationDays} days`;

  // The best seller stands in for the catalogue in the preview. It is chosen by
  // units sold rather than at random, so the screen looks the same on every visit.
  const featured = [...products].sort((a, b) => b.unitsSold - a.unitsSold)[0] ?? null;
  const priciest = [...products].sort((a, b) => b.price - a.price)[0] ?? null;
  const homeZone = profile.deliveryZones[0];
  const farZone = profile.deliveryZones[profile.deliveryZones.length - 1];
  const city = profile.addressLines[profile.addressLines.length - 1].replace(/^\d+\s*/, "");

  // Every worked example below is a real figure from this shop, so nobody has to
  // wonder whether the formatting was demonstrated on an invented number.
  const currencyExamples = [
    ...(featured ? [{ amount: featured.price, note: `${featured.name}, your best seller` }] : []),
    { amount: homeZone.fee, note: `${homeZone.name} delivery fee` },
    { amount: profile.freeDeliveryFrom, note: "Where delivery becomes free" },
    ...(priciest && priciest.id !== featured?.id
      ? [{ amount: priciest.price, note: `${priciest.name}, grouped by thousands` }]
      : []),
  ];

  const reach = connections
    .filter((connection) => !connection.planned)
    .sort(
      (a, b) =>
        CHANNEL_ORDER.indexOf(a.channelId) - CHANNEL_ORDER.indexOf(b.channelId),
    );

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Store"
        subtitle={`${profile.displayName}, ${city}. The details your customers see, the currency they pay in, and what delivery costs them.`}
        actions={<DemoChip />}
      />

      <p className="rounded-[var(--radius-md)] border border-line bg-surface-2 px-4 py-2.5 text-[13px] text-muted">
        Everything on this screen is shown, not edited. Changing these details arrives with the
        database, so nothing here pretends to save. The one box you can type in searches the
        delivery zones, it does not change them.
      </p>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Free delivery from"
          value={formatTND(profile.freeDeliveryFrom)}
          detail="Counted on the order, before the fee"
          tone="money"
        />
        <Stat
          label="Standard delivery"
          value={formatTND(profile.standardDeliveryFee)}
          detail={`${homeZone.name}, ${homeZone.days}`}
        />
        <Stat
          label="Ready to post in"
          value={preparationLabel}
          detail="Before the courier picks it up"
        />
        <Stat
          label="Delivery zones"
          value={String(profile.deliveryZones.length)}
          detail="Each one has its own fee and its own delivery time"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHead
            title="Shop identity"
            hint="What appears on your site, on an invoice and at the top of a delivery note."
          />
          <dl className="flex flex-col">
            <DetailRow label="Legal name" value={profile.legalName} />
            <DetailRow label="Display name" value={profile.displayName} />
            <DetailRow label="Tagline" value={profile.tagline} />
            <DetailRow label="Address" value={profile.addressLines.join(", ")} />
            <DetailRow label="Phone" value={profile.phone} mono />
            <DetailRow label="Email" value={profile.email} />
            <DetailRow label="Website" value={profile.website} />
            <DetailRow label="VAT number" value={profile.vatNumber} mono />
          </dl>
          <p className="mt-3 text-xs text-muted">
            The legal name goes on paperwork, the display name goes in front of customers. They are
            kept apart so an invoice never has to be corrected by hand.
          </p>
        </Card>

        <Card>
          <CardHead
            title="Storefront preview"
            hint="How the header and one product read to someone buying from you."
          />
          {featured ? (
            <StorefrontPreview
              shopName={profile.displayName}
              initials={STORE.initials}
              tagline={profile.tagline}
              website={profile.website}
              phone={profile.phone}
              city={city}
              product={{
                name: featured.name,
                sku: featured.sku,
                price: featured.price,
                stock: featured.stock,
              }}
              zone={homeZone}
              freeDeliveryFrom={profile.freeDeliveryFrom}
              preparationLabel={preparationLabel}
            />
          ) : (
            <EmptyState
              title="Nothing to preview yet"
              body="The preview borrows your best selling product. Add one product and this panel fills in on its own."
              action={{ label: "Go to products", href: "/products" }}
            />
          )}
        </Card>
      </div>

      <Card>
        <CardHead
          title="Currency"
          hint={`${profile.currencyNote}. Every figure in Les Saveurs du Cap Bon is written the same way.`}
          action={
            <span className="os-num rounded-full border border-line bg-surface-2 px-2.5 py-1 text-xs font-semibold">
              {profile.currency}
            </span>
          }
        />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="os-scroll">
            <table className="w-full min-w-[360px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="os-label pb-2 text-left font-normal">The number</th>
                  <th className="os-label pb-2 text-left font-normal">How it reads</th>
                  <th className="os-label pb-2 text-right font-normal">What it is</th>
                </tr>
              </thead>
              <tbody>
                {currencyExamples.map((example) => (
                  <tr key={example.note} className="border-t border-line">
                    <td className="os-num py-2 pr-3 text-[13px] text-muted">{example.amount}</td>
                    <td className="os-num py-2 pr-3 text-[13px] font-semibold">
                      {formatTND(example.amount)}
                    </td>
                    <td className="py-2 text-right text-[12px] text-muted">{example.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-2 text-[13px] leading-relaxed text-muted">
            <p>
              One dinar is <span className="os-num">1000</span> millimes, so the three decimals are
              money and not padding. Thousands are split by a space and the millimes follow a comma,
              which is how a Tunisian invoice reads.
            </p>
            {priciest ? (
              <p>
                A tile that has to fit a large figure drops the millimes to stay readable, the way
                your most expensive product would read as{" "}
                <span className="os-num font-semibold text-ink">
                  {formatTNDCompact(priciest.price)}
                </span>{" "}
                on one. Anywhere a customer or an accountant reads the figure, all three decimals
                come back:{" "}
                <span className="os-num font-semibold text-ink">{formatTND(priciest.price)}</span>.
              </p>
            ) : null}
            <p>
              Digits stay in English across the interface, including on the Arabic side of a
              conversation, so a number is never read twice in two ways.
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <CardHead
          title="Delivery rules"
          hint={`Free from ${formatTND(profile.freeDeliveryFrom)}, and packed within ${preparationLabel} whichever zone the order is going to.`}
          action={
            cityQuery ? (
              <Link href="/store" className="text-xs font-semibold text-primary hover:underline">
                Show all zones
              </Link>
            ) : null
          }
        />

        <form className="mb-3 flex flex-wrap items-end gap-2">
          <label className="flex flex-1 flex-col gap-1 sm:max-w-[280px]">
            <span className="os-label">Find the zone for a city</span>
            <input
              name="city"
              defaultValue={cityQuery}
              placeholder="Sousse, Bizerte, Djerba"
              className="rounded-[var(--radius-sm)] border border-line bg-surface-2 px-2.5 py-1.5 text-[13px]"
            />
          </label>
          <button
            type="submit"
            className="rounded-[var(--radius-sm)] bg-primary px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-primary-hi"
          >
            Look up
          </button>
        </form>

        {zones.length === 0 ? (
          <EmptyState
            title="No zone covers that name"
            body={`The ${profile.deliveryZones.length} zones between them list the cities you post to. Check the spelling, or clear the search to read the whole list.`}
            action={{ label: "Show all zones", href: "/store" }}
          />
        ) : (
          <div className="os-scroll">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="os-label pb-2 text-left font-normal">Zone</th>
                  <th className="os-label pb-2 text-left font-normal">Cities</th>
                  <th className="os-label pb-2 text-left font-normal">Arrives in</th>
                  <th className="os-label pb-2 text-right font-normal">Fee, TND</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((zone) => (
                  <tr key={zone.id} className="border-t border-line">
                    <td className="py-2.5 pr-3 text-[13px] font-semibold">{zone.name}</td>
                    <td className="py-2.5 pr-3 text-[12.5px] text-muted">{zone.cities}</td>
                    <td className="py-2.5 pr-3 text-[12.5px] text-muted">{zone.days}</td>
                    <td className="os-num py-2.5 text-right text-[13px]">
                      {formatTND(zone.fee, { withCurrency: false })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-3 max-w-[80ch] text-xs text-muted">
          The fee is dropped once an order passes{" "}
          <span className="os-num">{formatTND(profile.freeDeliveryFrom)}</span>, in every zone. The
          zone still decides how long the order takes, so an order going to {farZone.name} that
          ships free still takes {farZone.days}.
        </p>
      </Card>

      <Card>
        <CardHead
          title="Themes"
          hint="One look is in use. The other two are names and colours that have been reserved, nothing more."
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {profile.themes.map((theme) => {
            const inUse = theme.state === "In use";
            const swatches = THEME_SWATCHES[theme.id] ?? ["bg-line-strong", "bg-line", "bg-surface"];
            return (
              <div
                key={theme.id}
                aria-current={inUse ? "true" : undefined}
                className={`rounded-[var(--radius-md)] border p-3 ${
                  inUse
                    ? "border-primary/30 bg-surface"
                    : "border-dashed border-line-strong bg-surface-2"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[14px] font-semibold">{theme.name}</p>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                      inUse
                        ? "border-primary/15 bg-primary-soft text-primary"
                        : "border-line bg-surface text-muted"
                    }`}
                  >
                    {theme.state}
                  </span>
                </div>
                <div aria-hidden className="mt-2.5 flex gap-1.5">
                  {swatches.map((swatch) => (
                    <span
                      key={swatch}
                      className={`h-6 flex-1 rounded-[var(--radius-sm)] ring-1 ring-line ${swatch}`}
                    />
                  ))}
                </div>
                <p className="mt-2.5 text-[12px] leading-relaxed text-muted">
                  {THEME_NOTES[theme.id] ?? "A set of colours saved as a name only."}
                </p>
              </div>
            );
          })}
        </div>
        <p className="mt-3 max-w-[80ch] text-xs text-muted">
          Switching between themes is designed and not built, so there is no button here that would
          do nothing. When it lands, changing the look will repaint the storefront preview above
          before it repaints anything a customer sees.
        </p>
      </Card>

      <Card>
        <CardHead
          title="Where these details reach customers"
          hint="The same shop name, phone number and delivery rules, whichever way someone arrives. The badge on each one says whether it is receiving today."
          action={
            <Link href="/integrations" className="text-xs font-semibold text-primary hover:underline">
              See what is set up
            </Link>
          }
        />
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {reach.map((connection) => (
            <li
              key={connection.id}
              className="flex flex-col gap-1.5 rounded-[var(--radius-md)] border border-line bg-surface-2 p-3"
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <SourceBadge channelId={connection.channelId} size="sm" />
                <ConnectionPill status={connection.status} />
              </div>
              <span className="text-[12.5px] font-semibold">{connection.accountLabel}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 max-w-[80ch] text-xs text-muted">
          A fee you quote on WhatsApp and a fee you quote on the website come from this one list, so
          the two can never disagree. A channel that is still waiting on setup carries none of it
          yet, which is what its badge is saying. The order that follows keeps the channel it
          arrived on, which is why a {homeZone.name} delivery sold over WhatsApp stays a WhatsApp
          order in every report.
        </p>
      </Card>
    </div>
  );
}
