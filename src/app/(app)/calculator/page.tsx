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

export const metadata = { title: "Calculator, Les Saveurs du Cap Bon" };

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
    ? "The delivery fee that shows on most of your orders. Change it to what the courier charges you."
    : "What the courier charges you to send one order.";

  const productWord = catalogue.length === 1 ? "product" : "products";
  const marketing = budgets.budgets.find((budget) => budget.name === "Marketing") ?? null;
  const adShare =
    marketing && catalogue.length > 0 ? Math.round(marketing.used / catalogue.length) : 0;
  const adSpendNote = marketing
    ? `An even share of the ${formatTND(marketing.used)} spent on marketing in ${marketing.period}, split across your ${catalogue.length} ${productWord}. Put in the real figure for this run.`
    : "What you plan to spend on advertising for this run, in total.";

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Calculator"
        subtitle="What is left after the product, the delivery and the advertising are paid for."
        actions={<DemoChip />}
      />

      {catalogue.length === 0 ? (
        <EmptyState
          title="There is no product to price yet"
          body="The calculator opens on one of your products so you are not starting from an empty form. Add a product first and it will show up in the list here."
          action={{ label: "Open products", href: "/products" }}
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
        This screen only works out numbers. It does not change a price, and saving a worked out
        price back onto a product is designed and not built yet, so a price you settle on here still
        has to be set on the product itself.
      </p>
    </div>
  );
}
