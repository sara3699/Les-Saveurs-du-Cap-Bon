import { ProductWorkbench } from "@/components/products/ProductWorkbench";
import type { ProductRow, ProductSourceSlice, ShopFront } from "@/components/products/types";
import { Card, CardHead, DemoChip, PageHeader } from "@/components/ui/surfaces";
import { buildAttributionIndex, orderSource } from "@/lib/domain/attribution";
import { CHANNEL_ORDER } from "@/lib/domain/channels";
import type { ChannelId } from "@/lib/domain/types";
import { timeAgo } from "@/lib/format";
import { STORE } from "@/lib/mock/core";
import { STORE_PROFILE } from "@/lib/mock/operations";
import { DEMO_NOW } from "@/lib/mock/time";
import { getRepositories } from "@/lib/repositories";

export const metadata = { title: "Produits, Les Saveurs du Cap Bon" };

// The demo clock moves with the visit, so this page is rendered per request
// rather than frozen into the build.
export const dynamic = "force-dynamic";

const IMPORT_COLUMNS = [
  {
    column: "name",
    holds: "Le nom que le client lit",
    example: "Crème de pistache",
  },
  {
    column: "sku",
    holds: "Votre propre code pour le produit. Deux lignes ne peuvent pas porter le même.",
    example: "LMS-PIS-01",
  },
  {
    column: "price",
    holds: "Ce que le client paie, en dinar, les millimes après le point",
    example: "89.500",
  },
  {
    column: "cost",
    holds: "Ce que le produit vous coute, pour pouvoir calculer la marge",
    example: "42.000",
  },
  {
    column: "stock",
    holds: "Les unités en rayon le jour ou vous creez le fichier",
    example: "4",
  },
  {
    column: "low_stock_at",
    holds: "Le nombre a partir duquel vous voulez une alerte",
    example: "8",
  },
];

export default async function ProductsPage() {
  const repos = getRepositories();
  const [products, orders, attributions, connections] = await Promise.all([
    repos.workspace.products(),
    repos.orders.list(),
    repos.workspace.attributions(),
    repos.intégrations.list(),
  ]);

  const index = buildAttributionIndex(attributions, connections);

  // Where each product actually sells. The channel is read from the order's
  // attribution, never from the product, so an Instagram product sale stays
  // Instagram on this screen too.
  const unitsByProduct = new Map<string, Map<ChannelId, number>>();
  const lastSoldByProduct = new Map<string, string>();

  for (const order of orders) {
    if (order.paymentStatus === "refused" || order.paymentStatus === "refunded") continue;
    const source = orderSource(order, index);
    for (const line of order.items) {
      const perChannel = unitsByProduct.get(line.productId) ?? new Map<ChannelId, number>();
      perChannel.set(source.channelId, (perChannel.get(source.channelId) ?? 0) + line.quantity);
      unitsByProduct.set(line.productId, perChannel);

      const seen = lastSoldByProduct.get(line.productId);
      if (!seen || new Date(order.placedAt) > new Date(seen)) {
        lastSoldByProduct.set(line.productId, order.placedAt);
      }
    }
  }

  const rows: ProductRow[] = products.map((product) => {
    const perChannel = unitsByProduct.get(product.id) ?? new Map<ChannelId, number>();
    const sources: ProductSourceSlice[] = CHANNEL_ORDER.map((channelId) => ({
      channelId,
      units: perChannel.get(channelId) ?? 0,
    }))
      .filter((slice) => slice.units > 0)
      .sort((a, b) => b.units - a.units);
    const lastSoldAt = lastSoldByProduct.get(product.id) ?? null;

    return {
      id: product.id,
      name: product.name,
      sku: product.sku,
      price: product.price,
      cost: product.cost,
      stock: product.stock,
      lowStockAt: product.lowStockAt,
      unitsSold: product.unitsSold,
      sources,
      lastSoldLabel: lastSoldAt ? timeAgo(lastSoldAt, DEMO_NOW) : null,
    };
  });

  // The customer preview borrows the shop's own record rather than repeating a
  // name, a town or a delivery fee of its own, so this screen and the Store
  // screen can never quote a customer two different shops.
  const profile = STORE_PROFILE;
  const homeZone = profile.deliveryZones[0];
  const shop: ShopFront = {
    name: profile.displayName,
    initials: STORE.initials,
    tagline: profile.tagline,
    website: profile.website,
    phone: profile.phone,
    city: profile.addressLines[profile.addressLines.length - 1].replace(/^\d+\s*/, ""),
    deliveryZone: { name: homeZone.name, days: homeZone.days, fee: homeZone.fee },
    freeDeliveryFrom: profile.freeDeliveryFrom,
    preparationLabel:
      profile.preparationDays === 1 ? "1 jour" : `${profile.preparationDays} jours`,
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Produits"
        subtitle={`Tout ce que ${profile.displayName} vend, ce que chaque produit vous coute, et ce qui commence a manquer.`}
        actions={<DemoChip />}
      />

      <div className="rounded-[var(--radius-md)] border border-accent-line bg-accent-soft px-4 py-3 text-[12.5px] leading-relaxed text-accent-ink">
        Les noms de produits reposent sur des signaux publics visibles sur Instagram. Les prix, le
        stock et les references produit sont des valeurs d'exemple, en attendant un import de
        catalogue autorise.
      </div>

      <ProductWorkbench rows={rows} shop={shop} />

      <Card>
        <CardHead
          title="Importer votre liste de produits"
          hint="Ce qu'un fichier doit contenir pour pouvoir etre lu"
          action={
            <span className="rounded-[var(--radius-sm)] border border-dashed border-line-strong bg-surface-2 px-3 py-1.5 text-center text-[12px] font-semibold text-faint">
              Le choix d'un fichier n'est pas encore construit
            </span>
          }
        />
        <p className="max-w-[80ch] text-[13px] leading-relaxed text-muted">
          L'import est concu mais pas construit, cette page ne peut donc pas encore recevoir de
          fichier. Voici la forme a preparer en attendant. Un produit par ligne, enregistré dans un
          fichier CSV, une virgule entre les colonnes, et la première ligne qui porte les noms de
          colonnes ci-dessous.
        </p>

        <div className="os-scroll mt-3">
          <table className="w-full min-w-[620px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="os-label pb-2.5 pr-3 text-left font-normal">Colonne</th>
                <th className="os-label pb-2.5 pr-3 text-left font-normal">Ce qu'elle contient</th>
                <th className="os-label pb-2.5 text-left font-normal">Exemple</th>
              </tr>
            </thead>
            <tbody>
              {IMPORT_COLUMNS.map((row) => (
                <tr key={row.column} className="border-t border-line">
                  <td className="os-num py-2.5 pr-3 text-[12.5px] font-semibold">{row.column}</td>
                  <td className="py-2.5 pr-3 text-[13px] text-muted">{row.holds}</td>
                  <td className="os-num py-2.5 text-[12.5px]">{row.example}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="mt-3 flex max-w-[80ch] list-disc flex-col gap-1 pl-4 text-[13px] leading-relaxed text-muted">
          <li>
            Une ligne dont la référence produit existe déjà met a jour ce produit. Elle n'en ajouté
            pas un deuxieme avec la même référence.
          </li>
          <li>
            Les unités vendues ne figurent pas dans le fichier. Elles sont comptees à partir de vos
            commandes, un import ne reecrit donc jamais ce que vous avez déjà vendu.
          </li>
          <li>
            Les prix sont lus en dinar. Ecrivez <span className="os-num">89.500</span>, et non{" "}
            <span className="os-num">89,500</span>, car la virgule sert déjà a separer les colonnes.
          </li>
        </ul>
      </Card>

      <p className="max-w-[80ch] text-xs leading-relaxed text-muted">
        Rien sur cet écran n'atteint une boutique, une place de marche ou un fournisseur. Modifier
        un produit change ce que vous voyez pendant cette visite, et les chiffres reviennent tels
        quels au prochain rafraichissement, car la base de données arrive dans une étape ulterieure.
      </p>
    </div>
  );
}
