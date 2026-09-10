import {
  MarginCalculator,
  type CalculatorProduct,
  type ProductSale,
} from "@/components/calculator/MarginCalculator";
import { DemoChip, EmptyState, PageHeader } from "@/components/ui/surfaces";
import { buildAttributionIndex, orderSource } from "@/lib/domain/attribution";
import { formatTND, timeAgo } from "@/lib/format";
import { DEMO_NOW } from "@/lib/mock/time";
import { getRepositories } from "@/lib/repositories";

export const metadata = { title: "Calculateur, Les Saveurs du Cap Bon" };

// The sale rows carry relative dates, so the page is rendered per visit rather
// than frozen into the build.
export const dynamic = "force-dynamic";

/** How many recent orders the sales table lists. The card says so on screen. */
const MAX_SALE_ROWS = 5;

/** The delivery fee that shows on most orders, so the field opens on a real figure. */
function commonDeliveryFee(fees: number[]): number {
  const counts = new Map<number, number>();
  for (const fee of fees) {
    if (fee > 0) counts.set(fee, (counts.get(fee) ?? 0) + 1);
  }
  let best = 0;
  let bestCount = 0;
  for (const [fee, count] of counts) {
    if (count > bestCount) {
      best = fee;
      bestCount = count;
    }
  }
  return best;
}

export default async function CalculatorPage() {
  const repos = getRepositories();
  const [products, orders, attributions, connections, budgets] = await Promise.all([
    repos.workspace.products(),
    repos.orders.list(),
    repos.workspace.attributions(),
    repos.integrations.list(),
    repos.workspace.budgets(),
  ]);

  const index = buildAttributionIndex(attributions, connections);

  // The most recent orders that contain each product, newest first, each one
  // keeping the channel its request arrived on.
  const newestFirst = [...orders].sort(
    (a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime(),
  );
  const salesByProduct = new Map<string, ProductSale[]>();
  const ordersByProduct = new Map<string, number>();

  for (const order of newestFirst) {
    const source = orderSource(order, index);
    // An order that lists the same product on two lines is still one order, so
    // the count on screen and the word "orders" next to it agree.
    const counted = new Set<string>();
    for (const item of order.items) {
      if (!counted.has(item.productId)) {
        counted.add(item.productId);
        ordersByProduct.set(item.productId, (ordersByProduct.get(item.productId) ?? 0) + 1);
      }
      const rows = salesByProduct.get(item.productId) ?? [];
      if (rows.length < MAX_SALE_ROWS) {
        rows.push({
          id: `${order.id}_${item.id}`,
          reference: order.reference,
          channelId: source.channelId,
          account: source.accountLabel,
          whenLabel: timeAgo(order.placedAt, DEMO_NOW),
          quantity: item.quantity,
          lineValue: item.quantity * item.unitPrice,
        });
      }
      salesByProduct.set(item.productId, rows);
    }
  }

  const catalogue: CalculatorProduct[] = products.map((product) => ({
    id: product.id,
    name: product.name,
    sku: product.sku,
    price: product.price,
    cost: product.cost,
    unitsSold: product.unitsSold,
    orderCount: ordersByProduct.get(product.id) ?? 0,
    sales: salesByProduct.get(product.id) ?? [],
  }));

  // The screen opens on the best seller, because that is the price the owner is
  // most likely to be second guessing.
  const bestSeller = catalogue.reduce(
    (top, product) => (product.unitsSold > top.unitsSold ? product : top),
    catalogue[0],
  );

  // Both notes name where the opening figure came from. Neither repeats the
  // figure itself, because the field shows it as a plain number and the note
  // would have to write the same amount the Tunisian way, which reads as a
  // different number.
  const deliveryFee = commonDeliveryFee(orders.map((order) => order.deliveryFee));
  const deliveryNote = deliveryFee
    ? "Les frais de livraison qui apparaissent sur la plupart de vos commandes. Remplacez-les par ce que le livreur vous facture."
    : "Ce que le livreur vous facture pour envoyer une commande.";

  const productWord = catalogue.length === 1 ? "produit" : "produits";
  const marketing = budgets.budgets.find((budget) => budget.name === "Marketing") ?? null;
  const adShare =
    marketing && catalogue.length > 0 ? Math.round(marketing.used / catalogue.length) : 0;
  const adSpendNote = marketing
    ? `Une part égale des ${formatTND(marketing.used)} dépensés en marketing sur ${marketing.period}, répartie entre vos ${catalogue.length} ${productWord}. Indiquez le montant réel pour cette opération.`
    : "Ce que vous prévoyez de dépenser en publicité pour cette opération, au total.";

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Calculateur"
        subtitle="Ce qui reste une fois le produit, la livraison et la publicité payés."
        actions={<DemoChip />}
      />

      {catalogue.length === 0 ? (
        <EmptyState
          title="Aucun produit à chiffrer pour l'instant"
          body="Le calculateur s'ouvre sur l'un de vos produits pour que vous ne partiez pas d'un formulaire vide. Ajoutez d'abord un produit et il apparaîtra dans la liste ici."
          action={{ label: "Ouvrir les produits", href: "/products" }}
        />
      ) : (
        <MarginCalculator
          products={catalogue}
          initialProductId={bestSeller.id}
          deliveryCost={deliveryFee}
          deliveryNote={deliveryNote}
          adSpend={adShare}
          adSpendNote={adSpendNote}
        />
      )}

      <p className="max-w-[80ch] text-xs text-muted">
        Cet écran ne fait que calculer des chiffres. Il ne modifie aucun prix, et l'enregistrement
        d'un prix calculé sur la fiche du produit est prévu mais pas encore construit, donc un prix
        retenu ici doit toujours être saisi sur le produit lui-même.
      </p>
    </div>
  );
}
