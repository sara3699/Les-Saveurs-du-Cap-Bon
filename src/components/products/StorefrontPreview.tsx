"use client";

import { StorefrontPreview as ShopFrontPreview } from "@/components/store/StorefrontPreview";
import { Card, CardHead } from "@/components/ui/surfaces";
import type { ProductRow, ShopFront } from "./types";

/**
 * The same record, read from the other side of the counter.
 *
 * The drawing itself is the one the Store screen uses, so the two screens
 * cannot end up showing the customer two different shops. Only the product it
 * is filled with changes here, and it is the row on this screen, edits
 * included, so a price changed above is the price a customer would be quoted.
 */
export function StorefrontPreview({
  row,
  rows,
  shop,
  onSelect,
}: {
  row: ProductRow;
  rows: ProductRow[];
  shop: ShopFront;
  onSelect: (id: string) => void;
}) {
  return (
    <Card>
      <CardHead
        title="How a customer sees it"
        hint="The same drawing the Store screen shows, filled with the product you pick."
      />

      <label className="mb-3 flex flex-wrap items-center gap-2">
        <span className="os-label">Product</span>
        <select
          value={row.id}
          onChange={(event) => onSelect(event.target.value)}
          className="min-w-0 rounded-[var(--radius-sm)] border border-line bg-surface-2 px-2.5 py-1.5 text-[13px]"
        >
          {rows.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </label>

      <ShopFrontPreview
        shopName={shop.name}
        initials={shop.initials}
        tagline={shop.tagline}
        website={shop.website}
        phone={shop.phone}
        city={shop.city}
        product={{ name: row.name, sku: row.sku, price: row.price, stock: row.stock }}
        zone={shop.deliveryZone}
        freeDeliveryFrom={shop.freeDeliveryFrom}
        preparationLabel={shop.preparationLabel}
      />

      <p className="mt-3 max-w-[80ch] text-xs leading-relaxed text-muted">
        The shop name, the phone number and the delivery figures come from your Store screen. The
        product name, the price, the product code and what is left in stock are the ones in the
        list above, including any change you have just made. A picture of the product is not part
        of the demo data, so the customer view shows a placeholder in its place.
      </p>
    </Card>
  );
}
