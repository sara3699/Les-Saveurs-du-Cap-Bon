import Link from "next/link";
import { StorefrontPreview } from "@/components/store/StorefrontPreview";
import { ConnectionPill, SourceBadge } from "@/components/ui/badges";
import { Card, CardHead, DemoChip, EmptyState, PageHeader, Stat } from "@/components/ui/surfaces";
import { CHANNEL_ORDER } from "@/lib/domain/channels";
import { formatTND, formatTNDCompact } from "@/lib/format";
import { STORE } from "@/lib/mock/core";
import { STORE_PROFILE } from "@/lib/mock/operations";
import { getRepositories } from "@/lib/repositories";

export const metadata = { title: "Boutique, Les Saveurs du Cap Bon" };

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
  th_olive: "L'apparence que votre boutique utilisé aujourd'hui, et celle dans laquelle cet écran est dessine.",
  th_clay: "Un jeu de couleurs plus chaudes, enregistré comme un nom seulement.",
  th_linen: "Un jeu de couleurs plus pales, enregistré comme un nom seulement.",
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
    repos.intégrations.list(),
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
    profile.preparationDays === 1 ? "1 jour" : `${profile.preparationDays} jours`;

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
    ...(featured ? [{ amount: featured.price, note: `${featured.name}, votre meilleure vente` }] : []),
    { amount: homeZone.fee, note: `Frais de livraison, ${homeZone.name}` },
    { amount: profile.freeDeliveryFrom, note: "Le seuil a partir duquel la livraison est offerte" },
    ...(priciest && priciest.id !== featured?.id
      ? [{ amount: priciest.price, note: `${priciest.name}, avec les milliers separes` }]
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
        title="Boutique"
        subtitle={`${profile.displayName}, ${city}. Les informations que vos clients voient, la monnaie dans laquelle ils paient et ce que la livraison leur coute.`}
        actions={<DemoChip />}
      />

      <p className="rounded-[var(--radius-md)] border border-line bg-surface-2 px-4 py-2.5 text-[13px] text-muted">
        Tout sur cet écran est affiche, rien ne s'y modifie. La modification de ces informations
        arrivera avec la base de données, donc rien ici ne pretend enregistrer. Le seul champ ou
        vous pouvez taper cherche dans les zones de livraison, il ne les change pas.
      </p>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Livraison offerte à partir de"
          value={formatTND(profile.freeDeliveryFrom)}
          détail="Calcule sur la commande, avant les frais"
          tone="money"
        />
        <Stat
          label="Livraison standard"
          value={formatTND(profile.standardDeliveryFee)}
          détail={`${homeZone.name}, ${homeZone.days}`}
        />
        <Stat
          label="Pret a expedier en"
          value={preparationLabel}
          détail="Avant le passage du transporteur"
        />
        <Stat
          label="Zones de livraison"
          value={String(profile.deliveryZones.length)}
          détail="Chacune a ses propres frais et son propre délai"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHead
            title="Identite de la boutique"
            hint="Ce qui apparait sur votre site, sur une facture et en haut d'un bon de livraison."
          />
          <dl className="flex flex-col">
            <DetailRow label="Raison sociale" value={profile.legalName} />
            <DetailRow label="Nom affiche" value={profile.displayName} />
            <DetailRow label="Slogan" value={profile.tagline} />
            <DetailRow label="Adresse" value={profile.addressLines.join(", ")} />
            <DetailRow label="Téléphone" value={profile.phone} mono />
            <DetailRow label="E-mail" value={profile.email} />
            <DetailRow label="Site web" value={profile.website} />
            <DetailRow label="Numéro de TVA" value={profile.vatNumber} mono />
          </dl>
          <p className="mt-3 text-xs text-muted">
            La raison sociale figure sur les documents officiels, le nom affiche est celui que
            voient les clients. Les deux restent separes pour qu'une facture n'ait jamais a etre
            corrigee a la main.
          </p>
        </Card>

        <Card>
          <CardHead
            title="Apercu de la boutique en ligne"
            hint="Comment l'en-tete et un produit se presentent a quelqu'un qui acheté chez vous."
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
              title="Rien a montrer pour l'instant"
              body="L'apercu reprend votre produit le plus vendu. Ajoutez un produit et ce panneau se remplit tout seul."
              action={{ label: "Aller aux produits", href: "/products" }}
            />
          )}
        </Card>
      </div>

      <Card>
        <CardHead
          title="Monnaie"
          hint={`${profile.currencyNote}. Tous les montants de Les Saveurs du Cap Bon sont ecrits de la même facon.`}
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
                  <th className="os-label pb-2 text-left font-normal">Le nombre</th>
                  <th className="os-label pb-2 text-left font-normal">Comment il s'affiche</th>
                  <th className="os-label pb-2 text-right font-normal">Ce que c'est</th>
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
              Un dinar vaut <span className="os-num">1000</span> millimes, donc les trois decimales
              sont de l'argent et pas du remplissage. Les milliers sont separes par une espace et
              les millimes suivent une virgule, comme sur une facture tunisienne.
            </p>
            {priciest ? (
              <p>
                Une tuile qui doit faire tenir un grand nombre laisse tomber les millimes pour
                rester lisible, comme votre produit le plus cher qui s'y lirait{" "}
                <span className="os-num font-semibold text-ink">
                  {formatTNDCompact(priciest.price)}
                </span>
                . Partout ou un client ou un comptable lit le montant, les trois decimales
                reviennent :{" "}
                <span className="os-num font-semibold text-ink">{formatTND(priciest.price)}</span>.
              </p>
            ) : null}
            <p>
              Les chiffres restent ecrits en anglais dans toute l'interface, y compris du cote
              arabe d'une conversation, pour qu'un nombre ne se lise jamais de deux facons.
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <CardHead
          title="Règles de livraison"
          hint={`Offerte à partir de ${formatTND(profile.freeDeliveryFrom)}, et preparee en ${preparationLabel} quelle que soit la zone de destination.`}
          action={
            cityQuery ? (
              <Link href="/store" className="text-xs font-semibold text-primary hover:underline">
                Voir toutes les zones
              </Link>
            ) : null
          }
        />

        <form className="mb-3 flex flex-wrap items-end gap-2">
          <label className="flex flex-1 flex-col gap-1 sm:max-w-[280px]">
            <span className="os-label">Trouver la zone d'une ville</span>
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
            Rechercher
          </button>
        </form>

        {zones.length === 0 ? (
          <EmptyState
            title="Aucune zone ne correspond a ce nom"
            body={`Les ${profile.deliveryZones.length} zones couvrent ensemble les villes que vous livrez. Verifiez l'orthographe, ou effacez la recherche pour lire toute la liste.`}
            action={{ label: "Voir toutes les zones", href: "/store" }}
          />
        ) : (
          <div className="os-scroll">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="os-label pb-2 text-left font-normal">Zone</th>
                  <th className="os-label pb-2 text-left font-normal">Villes</th>
                  <th className="os-label pb-2 text-left font-normal">Delai</th>
                  <th className="os-label pb-2 text-right font-normal">Frais, TND</th>
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
          Les frais tombent des qu'une commande depasse{" "}
          <span className="os-num">{formatTND(profile.freeDeliveryFrom)}</span>, dans toutes les
          zones. La zone decide toujours du délai, donc une commande vers {farZone.name} livrée
          sans frais met quand même {farZone.days}.
        </p>
      </Card>

      <Card>
        <CardHead
          title="Themes"
          hint="Une seule apparence est utilisée. Les deux autres sont des noms et des couleurs reserves, rien de plus."
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
                  {THEME_NOTES[theme.id] ?? "Un jeu de couleurs enregistré comme un nom seulement."}
                </p>
              </div>
            );
          })}
        </div>
        <p className="mt-3 max-w-[80ch] text-xs text-muted">
          Le changement de theme est concu mais pas construit, il n'y a donc ici aucun bouton qui
          ne ferait rien. Quand il arrivera, changer l'apparence repeindra l'apercu de la boutique
          ci-dessus avant de repeindre quoi que ce soit que voit un client.
        </p>
      </Card>

      <Card>
        <CardHead
          title="Ou ces informations atteignent vos clients"
          hint="Le même nom de boutique, le même téléphone et les memes règles de livraison, quel que soit le chemin par lequel arrive la personne. Le badge de chaque canal dit s'il reçoit aujourd'hui."
          action={
            <Link href="/integrations" className="text-xs font-semibold text-primary hover:underline">
              Voir ce qui est configure
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
          Des frais annonces sur WhatsApp et des frais annonces sur le site web viennent de cette
          seule liste, les deux ne peuvent donc jamais se contredire. Un canal qui attend encore sa
          configuration n'en porte rien pour l'instant, c'est ce que dit son badge. La commande qui
          suit garde le canal par lequel elle est arrivée, c'est pourquoi une livraison{" "}
          {homeZone.name} vendue sur WhatsApp reste une commande WhatsApp dans tous les rapports.
        </p>
      </Card>
    </div>
  );
}
