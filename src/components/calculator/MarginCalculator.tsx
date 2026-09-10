"use client";

import { useState } from "react";
import { SourceBadge } from "@/components/ui/badges";
import { Card, CardHead, EmptyState } from "@/components/ui/surfaces";
import type { ChannelId } from "@/lib/domain/types";
import { formatPercent, formatTND } from "@/lib/format";
import { cleanInputs, computeMargin, readNumber } from "./margin";

/** One order line that already contains this product, with the source it arrived on. */
export interface ProductSale {
  id: string;
  reference: string;
  channelId: ChannelId;
  account: string | null;
  whenLabel: string;
  quantity: number;
  lineValue: number;
}

export interface CalculatorProduct {
  id: string;
  name: string;
  sku: string;
  price: number;
  cost: number;
  unitsSold: number;
  orderCount: number;
  sales: ProductSale[];
}

export interface MarginCalculatorProps {
  products: CalculatorProduct[];
  initialProductId: string;
  /** The delivery fee that shows on most orders, used to open the field on a real number. */
  deliveryCost: number;
  deliveryNote: string;
  adSpend: number;
  adSpendNote: string;
}

function Field({
  label,
  hint,
  value,
  onChange,
  step = "1",
  max,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (next: string) => void;
  step?: string;
  max?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="os-label">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        min="0"
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="os-num rounded-[var(--radius-sm)] border border-line bg-surface-2 px-2.5 py-1.5 text-[13px]"
      />
      <span className="text-[11px] leading-snug text-muted">{hint}</span>
    </label>
  );
}

function Figure({
  label,
  value,
  detail,
  tone = "plain",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "plain" | "bad";
}) {
  const bad = tone === "bad";
  return (
    <div
      className={`rounded-[var(--radius-md)] border p-3 ${
        bad ? "border-danger/25 bg-danger-soft" : "border-line bg-surface-2"
      }`}
    >
      <p className="text-[11.5px] text-muted">{label}</p>
      <p
        className={`os-num mt-1 font-display text-[19px] font-bold leading-none tracking-tight ${
          bad ? "text-danger" : ""
        }`}
      >
        {value}
      </p>
      <p className="mt-1.5 text-[11px] leading-snug text-muted">{detail}</p>
    </div>
  );
}

function Line({
  label,
  value,
  strong = false,
  subtotal = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
  subtotal?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 py-1.5 text-[13px] ${
        strong ? "border-t border-line-strong pt-2 font-semibold" : ""
      } ${subtotal ? "border-t border-line pt-2" : ""}`}
    >
      <dt className={strong ? "text-ink" : "text-muted"}>{label}</dt>
      <dd className="os-num shrink-0">{value}</dd>
    </div>
  );
}

/** Never print "-0,000 TND", which is what a plain minus sign would give. */
function minus(amount: number): string {
  return amount === 0 ? formatTND(0) : `-${formatTND(amount)}`;
}

/** "1 commande", "96 commandes". */
function orderWord(count: number): string {
  return `${count} ${count === 1 ? "commande" : "commandes"}`;
}

export function MarginCalculator({
  products,
  initialProductId,
  deliveryCost,
  deliveryNote,
  adSpend,
  adSpendNote,
}: MarginCalculatorProps) {
  const first = products.find((p) => p.id === initialProductId) ?? products[0];

  const [productId, setProductId] = useState(first.id);
  const [price, setPrice] = useState(String(first.price));
  const [cost, setCost] = useState(String(first.cost));
  const [delivery, setDelivery] = useState(String(deliveryCost));
  const [discount, setDiscount] = useState("0");
  const [orders, setOrders] = useState(String(first.unitsSold));
  const [ads, setAds] = useState(String(adSpend));

  const product = products.find((p) => p.id === productId) ?? first;

  // Switching product refills the three figures that belong to the product. The
  // discount, the delivery and the advertising belong to the run, so they stay.
  function chooseProduct(id: string) {
    const next = products.find((p) => p.id === id);
    if (!next) return;
    setProductId(next.id);
    setPrice(String(next.price));
    setCost(String(next.cost));
    setOrders(String(next.unitsSold));
  }

  // Cleaned once here, so every figure printed below is the figure the
  // arithmetic used, whatever was typed into the fields.
  const inputs = cleanInputs({
    sellingPrice: readNumber(price),
    productCost: readNumber(cost),
    deliveryCost: readNumber(delivery),
    discountPercent: readNumber(discount),
    orders: readNumber(orders),
    adSpend: readNumber(ads),
  });
  const result = computeMargin(inputs);
  const orderCount = inputs.orders;
  const discountPercent = inputs.discountPercent;
  const breakEven = result.breakEvenOrders;

  const lossAdvice =
    breakEven === null
      ? "Une commande ne couvre même pas son produit et sa livraison, donc plus il y a de commandes, plus la perte augmente. Augmentez le prix, réduisez la remise, ou trouvez une livraison moins chère."
      : `Une commande laisse ${formatTND(result.contributionPerOrder)} avant la publicité, il vous faut donc ${orderWord(breakEven)} pour rembourser la publicité. Cette opération est réglée sur ${orderWord(orderCount)}.`;

  const profitNote =
    breakEven !== null && breakEven > 0 && inputs.adSpend > 0
      ? `Chaque commande laisse ${formatTND(result.marginPerOrder)}, et l'opération est réglée sur ${orderWord(orderCount)}. La publicité est remboursée à la commande ${breakEven}, et tout ce qui vient après est pour vous.`
      : `Chaque commande laisse ${formatTND(result.marginPerOrder)}, et l'opération est réglée sur ${orderWord(orderCount)}.`;

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
      <Card className="flex min-w-0 flex-col gap-3">
        <CardHead
          title="Ce que vous chiffrez"
          hint="Rien n'est enregistré. Changez un chiffre et le résultat suit."
        />

        <label className="flex flex-col gap-1">
          <span className="os-label">Produit</span>
          <select
            value={productId}
            onChange={(event) => chooseProduct(event.target.value)}
            className="rounded-[var(--radius-sm)] border border-line bg-surface-2 px-2.5 py-1.5 text-[13px]"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <span className="text-[11px] leading-snug text-muted">
            Choisir un produit remplit son prix, ce qu'il vous coûte, et les unités vendues jusqu'ici.
            Référence produit <span className="os-num">{product.sku}</span>.
          </span>
        </label>

        <div className="grid gap-3 border-t border-line pt-3 sm:grid-cols-2 xl:grid-cols-1">
          <Field
            label="Prix de vente, TND"
            hint="Le prix affiché aujourd'hui pour ce produit, avant toute remise."
            value={price}
            onChange={setPrice}
            step="0.5"
          />
          <Field
            label="Ce que le produit vous coûte, TND"
            hint="Les matières, la fabrication, et tout ce que vous payez avant qu'il quitte l'atelier."
            value={cost}
            onChange={setCost}
            step="0.5"
          />
          <Field
            label="Livraison pour une commande, TND"
            hint={deliveryNote}
            value={delivery}
            onChange={setDelivery}
            step="0.5"
          />
          <Field
            label="Remise que vous comptez accorder, en pourcentage"
            hint="Laissez zéro si le client paie le prix complet."
            value={discount}
            onChange={setDiscount}
            step="1"
            max="100"
          />
          <Field
            label="Commandes de l'opération"
            hint={`Prérempli avec les ${product.unitsSold} unités que ce produit a vendues jusqu'ici, une unité comptée comme une commande.`}
            value={orders}
            onChange={setOrders}
            step="1"
          />
          <Field
            label="Publicité pour l'opération, TND"
            hint={adSpendNote}
            value={ads}
            onChange={setAds}
            step="10"
          />
        </div>
      </Card>

      <div className="flex min-w-0 flex-col gap-4">
        <Card>
          <CardHead title="Ce qui reste" hint={`${product.name}, ${orderWord(orderCount)}`} />

          <div className="grid gap-2.5 sm:grid-cols-2">
            <Figure
              label="Marge sur une commande"
              value={formatTND(result.marginPerOrder)}
              detail={
                result.netPrice > 0
                  ? `${formatPercent(Math.round(result.marginPercent))} de ce que le client paie`
                  : "Le client ne paie rien avec cette remise, il n'y a donc pas de pourcentage à calculer"
              }
              tone={result.marginPerOrder < 0 ? "bad" : "plain"}
            />
            <Figure
              label="Publicité par commande"
              value={formatTND(result.adPerOrder)}
              detail={
                orderCount > 0
                  ? `${formatTND(inputs.adSpend)} répartis sur ${orderWord(orderCount)}`
                  : "Aucune commande dans l'opération pour l'instant, rien ne porte donc la publicité"
              }
            />
            <Figure
              label="Argent entrant, toute l'opération"
              value={formatTND(result.totalRevenue)}
              detail={`${orderWord(orderCount)} à ${formatTND(result.netPrice)} chacune`}
            />
            <Figure
              label="Argent sortant, toute l'opération"
              value={formatTND(result.totalCost)}
              detail="Le produit et la livraison sur chaque commande, plus la publicité une fois"
            />
          </div>

          {result.isLoss ? (
            <div className="mt-3 rounded-[var(--radius-md)] border border-danger/25 bg-danger-soft px-4 py-3">
              <p className="os-label">Cette opération perd de l'argent</p>
              <p className="os-num mt-1 font-display text-[26px] font-bold leading-none tracking-tight text-danger">
                {formatTND(result.profit)}
              </p>
              <p className="mt-2 max-w-[62ch] text-[12.5px] leading-relaxed text-danger">
                {lossAdvice}
              </p>
            </div>
          ) : (
            <div className="mt-3 rounded-[var(--radius-md)] border border-accent-line bg-accent-soft px-4 py-3">
              <p className="os-label">Ce qui reste une fois tout payé</p>
              <p className="os-num mt-1 font-display text-[26px] font-bold leading-none tracking-tight text-accent-ink">
                {formatTND(result.profit)}
              </p>
              <p className="mt-2 max-w-[62ch] text-[12.5px] leading-relaxed text-accent-ink">
                {profitNote}
              </p>
            </div>
          )}
        </Card>

        <Card>
          <CardHead
            title="Comment ce résultat a été calculé"
            hint="D'abord une commande, puis les mêmes chiffres multipliés"
          />
          <div className="grid gap-x-8 gap-y-1 lg:grid-cols-2">
            <div>
              <p className="os-label mb-1">Une commande</p>
              <dl>
                <Line label="Prix de vente" value={formatTND(inputs.sellingPrice)} />
                {discountPercent > 0 ? (
                  <Line
                    label={`Remise, ${discountPercent} pour cent`}
                    value={minus(result.discountValue)}
                  />
                ) : null}
                <Line label="Ce que le client paie" value={formatTND(result.netPrice)} subtotal />
                <Line label="Le produit" value={minus(inputs.productCost)} />
                <Line label="Livraison" value={minus(inputs.deliveryCost)} />
                <Line label="Publicité, la part de cette commande" value={minus(result.adPerOrder)} />
                <Line label="Marge sur une commande" value={formatTND(result.marginPerOrder)} strong />
              </dl>
            </div>
            <div className="mt-3 lg:mt-0">
              <p className="os-label mb-1">Toute l'opération</p>
              <dl>
                <Line
                  label={`Argent entrant, ${orderWord(orderCount)}`}
                  value={formatTND(result.totalRevenue)}
                />
                <Line
                  label="Le produit et la livraison sur chaque commande"
                  value={minus((inputs.productCost + inputs.deliveryCost) * orderCount)}
                />
                <Line label="Publicité pour l'opération" value={minus(inputs.adSpend)} />
                <Line
                  label={result.isLoss ? "Perdu sur l'opération" : "Reste après l'opération"}
                  value={formatTND(result.profit)}
                  strong
                />
              </dl>
            </div>
          </div>

          <p className="mt-3 max-w-[80ch] border-t border-line pt-3 text-[12.5px] leading-relaxed text-muted">
            {orderCount > 0 ? (
              <>
                Vérifiez à la main : le client paie{" "}
                <span className="os-num">{formatTND(result.netPrice)}</span>, puis retirez{" "}
                <span className="os-num">{formatTND(inputs.productCost)}</span> pour le produit,{" "}
                <span className="os-num">{formatTND(inputs.deliveryCost)}</span> pour la livraison et{" "}
                <span className="os-num">{formatTND(result.adPerOrder)}</span> de publicité, soit les{" "}
                <span className="os-num">{formatTND(inputs.adSpend)}</span> divisés par{" "}
                <span className="os-num">{orderCount}</span>{" "}
                {orderCount === 1 ? "commande" : "commandes"}. Il reste{" "}
                <span className="os-num">{formatTND(result.marginPerOrder)}</span> sur une commande,
                et <span className="os-num">{formatTND(result.profit)}</span> une fois le calcul
                multiplié.
              </>
            ) : (
              <>
                Vérifiez à la main : le client paie{" "}
                <span className="os-num">{formatTND(result.netPrice)}</span>, puis retirez{" "}
                <span className="os-num">{formatTND(inputs.productCost)}</span> pour le produit et{" "}
                <span className="os-num">{formatTND(inputs.deliveryCost)}</span> pour la livraison,
                il reste <span className="os-num">{formatTND(result.marginPerOrder)}</span> sur une
                commande. L'opération ne contient encore aucune commande, il n'y a donc rien pour
                répartir les <span className="os-num">{formatTND(inputs.adSpend)}</span> de
                publicité, et l'opération elle-même s'établit à{" "}
                <span className="os-num">{formatTND(result.profit)}</span>.
              </>
            )}
          </p>
        </Card>

        <Card>
          <CardHead
            title="Où ce produit se vend"
            hint={
              product.sales.length < product.orderCount
                ? `${orderWord(product.orderCount)} des données d'exemple contiennent ${product.name}. Les ${product.sales.length} plus récentes sont listées ici.`
                : `${orderWord(product.orderCount)} des données d'exemple contiennent ${product.name}`
            }
          />
          {product.sales.length === 0 ? (
            <EmptyState
              title="Aucune commande des données d'exemple ne contient ce produit"
              body="Les chiffres ci-dessus fonctionnent toujours, ils ne sont simplement pas encore appuyés par une vente. Choisissez un autre produit pour voir des commandes réelles, ou ouvrez les commandes pour consulter la liste complète."
              action={{ label: "Ouvrir les commandes", href: "/orders" }}
            />
          ) : (
            <div className="os-scroll">
              <table className="w-full min-w-[520px] border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="os-label pb-2 text-left font-normal">Commande</th>
                    <th className="os-label pb-2 text-left font-normal">Arrivée sur</th>
                    <th className="os-label pb-2 text-left font-normal">Quand</th>
                    <th className="os-label pb-2 text-right font-normal">Unités</th>
                    <th className="os-label pb-2 text-right font-normal">Valeur de la ligne, TND</th>
                  </tr>
                </thead>
                <tbody>
                  {product.sales.map((sale) => (
                    <tr key={sale.id} className="border-t border-line">
                      <td className="os-num py-2.5 pr-3 text-[13px] font-semibold">
                        {sale.reference}
                      </td>
                      <td className="py-2.5 pr-3">
                        <SourceBadge
                          channelId={sale.channelId}
                          account={sale.account}
                          size="sm"
                        />
                      </td>
                      <td className="os-num py-2.5 pr-3 text-[12px] text-muted">
                        {sale.whenLabel}
                      </td>
                      <td className="os-num py-2.5 pr-3 text-right text-[13px]">
                        {sale.quantity}
                      </td>
                      <td className="os-num py-2.5 text-right text-[13px]">
                        {formatTND(sale.lineValue, { withCurrency: false })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-3 max-w-[80ch] text-xs text-muted">
            Chaque ligne nomme le canal sur lequel la commande est arrivée, conservé depuis le moment
            où la demande est entrée. Cette colonne est là pour qu'un prix fixé pour une opération
            Instagram soit vérifié face à des commandes venues réellement d'Instagram.
          </p>
        </Card>
      </div>
    </div>
  );
}
