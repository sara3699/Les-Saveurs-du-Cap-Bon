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
        title="Ce que voit le client"
        hint="Le même apercu que celui de l'écran Boutique, rempli avec le produit que vous choisissez."
      />

      <label className="mb-3 flex flex-wrap items-center gap-2">
        <span className="os-label">Produit</span>
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
        Le nom de la boutique, le numéro de téléphone et les chiffres de livraison viennent de votre
        écran Boutique. Le nom du produit, le prix, la référence produit et ce qui reste en stock
        sont ceux de la liste ci-dessus, y compris la modification que vous venez de faire. Une
        photo du produit ne fait pas partie des données d'exemple, la vue client affiche donc un
        espace réservé a sa place.
      </p>
    </Card>
  );
}
