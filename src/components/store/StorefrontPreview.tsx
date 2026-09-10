import { formatTND } from "@/lib/format";

export interface PreviewProduct {
  name: string;
  sku: string;
  price: number;
  stock: number;
}

export interface PreviewZone {
  name: string;
  days: string;
  fee: number;
}

export interface StorefrontPreviewProps {
  shopName: string;
  /** The monogram the workspace already uses, so the shop is not initialled twice. */
  initials?: string;
  tagline: string;
  website: string;
  phone: string;
  city: string;
  product: PreviewProduct;
  zone: PreviewZone;
  freeDeliveryFrom: number;
  preparationLabel: string;
}

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/**
 * A picture of the shop front, drawn only from the store profile and one real
 * product. Nothing in it is a control: a preview that could be clicked would be
 * read as a second, half working storefront rather than a rendering of the one
 * the customer sees.
 */
export function StorefrontPreview({
  shopName,
  initials,
  tagline,
  website,
  phone,
  city,
  product,
  zone,
  freeDeliveryFrom,
  preparationLabel,
}: StorefrontPreviewProps) {
  const missing = freeDeliveryFrom - product.price;
  const qualifiés = missing <= 0;
  const filled =
    freeDeliveryFrom > 0 ? Math.min(100, (product.price / freeDeliveryFrom) * 100) : 100;

  return (
    <figure className="m-0 flex flex-col gap-2">
      <div className="overflow-hidden rounded-[var(--radius-md)] border border-line-strong bg-surface">
        <div className="flex items-center gap-2 border-b border-line bg-surface-2 px-3 py-2">
          <span aria-hidden className="flex gap-1">
            <span className="block h-2 w-2 rounded-full bg-line-strong" />
            <span className="block h-2 w-2 rounded-full bg-line-strong" />
            <span className="block h-2 w-2 rounded-full bg-line-strong" />
          </span>
          <span className="os-num min-w-0 truncate rounded-full border border-line bg-surface px-2.5 py-0.5 text-[11px] text-muted">
            {website}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="grid h-9 w-9 place-items-center rounded-[10px] bg-primary font-display text-xs font-bold text-white"
            >
              {initials ?? initialsOf(shopName)}
            </span>
            <div>
              <p className="font-display text-[15px] font-bold leading-tight">{shopName}</p>
              <p className="text-[11px] text-muted">{tagline}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden gap-3 text-[11.5px] text-muted sm:flex">
              <span>Boutique</span>
              <span>Cadeaux</span>
              <span>A propos</span>
            </span>
            <span className="os-num text-[11.5px] font-semibold">{phone}</span>
          </div>
        </div>

        <p className="border-b border-accent-line bg-accent-soft px-4 py-1.5 text-center text-[11.5px] font-semibold text-accent-ink">
          Livraison offerte à partir de <span className="os-num">{formatTND(freeDeliveryFrom)}</span>,
          expedie depuis {city}.
        </p>

        <div className="grid gap-4 p-4 sm:grid-cols-[128px_minmax(0,1fr)]">
          <span
            aria-hidden
            className="grid h-28 w-28 place-items-center rounded-[var(--radius-sm)] bg-gradient-to-br from-primary-soft to-accent-soft text-primary-mute sm:h-32 sm:w-32"
          >
            <svg viewBox="0 0 48 48" fill="none" className="h-12 w-12">
              <rect x="7" y="14" width="34" height="9" rx="4.5" stroke="currentColor" strokeWidth="2" />
              <rect x="7" y="26" width="34" height="9" rx="4.5" stroke="currentColor" strokeWidth="2" />
              <circle cx="16" cy="18.5" r="1.6" fill="currentColor" />
              <circle cx="16" cy="30.5" r="1.6" fill="currentColor" />
            </svg>
          </span>

          <div className="flex flex-col gap-2">
            <div>
              <p className="font-display text-[17px] font-bold leading-tight">{product.name}</p>
              <p className="os-num mt-0.5 text-[11px] text-faint">{product.sku}</p>
            </div>

            <p className="os-num font-display text-[22px] font-bold leading-none tracking-tight">
              {formatTND(product.price)}
            </p>

            <ul className="flex flex-col gap-0.5 text-[12px] text-muted">
              <li>
                <span className="os-num">{product.stock}</span> en stock, pret a expedier en{" "}
                {preparationLabel}
              </li>
              <li>
                {zone.name}, {zone.days}, <span className="os-num">{formatTND(zone.fee)}</span>
              </li>
            </ul>

            <div className="rounded-[var(--radius-sm)] border border-line bg-surface-2 px-3 py-2">
              <p className="text-[11.5px] font-semibold">
                {qualifiés ? (
                  "Cet article suffit déjà pour la livraison offerte."
                ) : (
                  <>
                    Ajoutez <span className="os-num">{formatTND(missing)}</span> pour la livraison
                    offerte.
                  </>
                )}
              </p>
              <span
                aria-hidden
                className="mt-1.5 block h-1.5 w-full overflow-hidden rounded-full bg-surface ring-1 ring-line"
              >
                <span className="block h-full rounded-full bg-primary" style={{ width: `${filled}%` }} />
              </span>
            </div>

            <span
              aria-hidden
              className="mt-0.5 inline-flex w-fit items-center rounded-[var(--radius-md)] bg-primary px-4 py-2 text-sm font-semibold text-white"
            >
              Ajouter au panier
            </span>
          </div>
        </div>
      </div>

      <figcaption className="text-xs text-muted">
        Un dessin de la vue client, construit avec les informations de cet écran et un produit de
        votre liste. C'est une image, pas votre site en ligne, et rien dedans ne peut etre clique.
      </figcaption>
    </figure>
  );
}
