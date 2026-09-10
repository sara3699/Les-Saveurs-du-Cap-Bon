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

export const metadata = { title: "Products, Les Saveurs du Cap Bon" };

// The demo clock moves with the visit, so this page is rendered per request
// rather than frozen into the build.
export const dynamic = "force-dynamic";

const IMPORT_COLUMNS = [
  {
    column: "name",
    holds: "The name a customer reads",
    example: "Crème de pistache",
  },
  {
    column: "sku",
    holds: "Your own code for the product. Two lines cannot share one.",
    example: "LMS-PIS-01",
  },
  {
    column: "price",
    holds: "What the customer pays, in dinar, millimes after the dot",
    example: "89.500",
  },
  {
    column: "cost",
    holds: "What the product costs you, so the margin can be worked out",
    example: "42.000",
  },
  {
    column: "stock",
    holds: "Units on the shelf the day you make the file",
    example: "4",
  },
  {
    column: "low_stock_at",
    holds: "The count you want to be warned at",
    example: "8",
  },
];

export default async function ProductsPage() {
  const repos = getRepositories();
  const [products, orders, attributions, connections] = await Promise.all([
    repos.workspace.products(),
    repos.orders.list(),
    repos.workspace.attributions(),
    repos.integrations.list(),
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
      profile.preparationDays === 1 ? "1 day" : `${profile.preparationDays} days`,
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Products"
        subtitle={`Everything ${profile.displayName} sells, what each one costs you, and what is running out.`}
        actions={<DemoChip />}
      />

      <div className="rounded-[var(--radius-md)] border border-accent-line bg-accent-soft px-4 py-3 text-[12.5px] leading-relaxed text-accent-ink">
        Product names are based on visible public Instagram signals. Prices, stock, and SKUs are
        demo placeholders until an authorised catalog import.
      </div>

      <ProductWorkbench rows={rows} shop={shop} />

      <Card>
        <CardHead
          title="Bring your product list in"
          hint="What a file needs before it can be read"
          action={
            <span className="rounded-[var(--radius-sm)] border border-dashed border-line-strong bg-surface-2 px-3 py-1.5 text-center text-[12px] font-semibold text-faint">
              Choosing a file is not built yet
            </span>
          }
        />
        <p className="max-w-[80ch] text-[13px] leading-relaxed text-muted">
          Importing is designed and not built, so this page cannot take a file yet. What follows is
          the shape to prepare in the meantime. One product per line, saved as a CSV file, a comma
          between the columns, and the first line holding the column names below.
        </p>

        <div className="os-scroll mt-3">
          <table className="w-full min-w-[620px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="os-label pb-2.5 pr-3 text-left font-normal">Column</th>
                <th className="os-label pb-2.5 pr-3 text-left font-normal">What it holds</th>
                <th className="os-label pb-2.5 text-left font-normal">Example</th>
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
            A line whose product code already exists updates that product. It does not add a second
            one with the same code.
          </li>
          <li>
            Units sold is not in the file. It is counted from your orders, so an import never
            rewrites what you have already sold.
          </li>
          <li>
            Prices are read as dinar. Write <span className="os-num">89.500</span>, not{" "}
            <span className="os-num">89,500</span>, because the comma is already doing the job of
            separating the columns.
          </li>
        </ul>
      </Card>

      <p className="max-w-[80ch] text-xs leading-relaxed text-muted">
        Nothing on this screen reaches a shop, a marketplace or a supplier. Editing a product
        changes what you see for this visit, and the figures come back as they were on the next
        refresh, because the database arrives in a later step.
      </p>
    </div>
  );
}
