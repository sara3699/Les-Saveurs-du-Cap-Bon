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

/** "1 order", "96 orders". */
function orderWord(count: number): string {
  return `${count} ${count === 1 ? "order" : "orders"}`;
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
      ? "One order does not even cover its own product and delivery, so more orders make the loss bigger. Raise the price, cut the discount, or find cheaper delivery."
      : `One order leaves ${formatTND(result.contributionPerOrder)} before advertising, so you need ${orderWord(breakEven)} to pay the advertising back. This run is set at ${orderWord(orderCount)}.`;

  const profitNote =
    breakEven !== null && breakEven > 0 && inputs.adSpend > 0
      ? `Each order leaves ${formatTND(result.marginPerOrder)}, and the run is set at ${orderWord(orderCount)}. The advertising is paid back at order ${breakEven}, and everything after that is yours.`
      : `Each order leaves ${formatTND(result.marginPerOrder)}, and the run is set at ${orderWord(orderCount)}.`;

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
      <Card className="flex min-w-0 flex-col gap-3">
        <CardHead
          title="What you are pricing"
          hint="Nothing is saved. Change a figure and the result moves with it."
        />

        <label className="flex flex-col gap-1">
          <span className="os-label">Product</span>
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
            Picking a product fills in its price, what it costs you, and the units it has sold so
            far. Reference <span className="os-num">{product.sku}</span>.
          </span>
        </label>

        <div className="grid gap-3 border-t border-line pt-3 sm:grid-cols-2 xl:grid-cols-1">
          <Field
            label="Selling price, TND"
            hint="What the product is listed at today, before any discount."
            value={price}
            onChange={setPrice}
            step="0.5"
          />
          <Field
            label="What the product costs you, TND"
            hint="Materials, the maker, and anything you pay before it leaves the workshop."
            value={cost}
            onChange={setCost}
            step="0.5"
          />
          <Field
            label="Delivery for one order, TND"
            hint={deliveryNote}
            value={delivery}
            onChange={setDelivery}
            step="0.5"
          />
          <Field
            label="Discount you plan to give, percent"
            hint="Leave it at zero if the customer pays the full price."
            value={discount}
            onChange={setDiscount}
            step="1"
            max="100"
          />
          <Field
            label="Orders in the run"
            hint={`Prefilled with the ${product.unitsSold} units this product has sold so far, one unit counted as one order.`}
            value={orders}
            onChange={setOrders}
            step="1"
          />
          <Field
            label="Advertising for the run, TND"
            hint={adSpendNote}
            value={ads}
            onChange={setAds}
            step="10"
          />
        </div>
      </Card>

      <div className="flex min-w-0 flex-col gap-4">
        <Card>
          <CardHead title="What is left" hint={`${product.name}, ${orderWord(orderCount)}`} />

          <div className="grid gap-2.5 sm:grid-cols-2">
            <Figure
              label="Margin on one order"
              value={formatTND(result.marginPerOrder)}
              detail={
                result.netPrice > 0
                  ? `${formatPercent(Math.round(result.marginPercent))} of what the customer pays`
                  : "The customer pays nothing at this discount, so there is no percentage to work out"
              }
              tone={result.marginPerOrder < 0 ? "bad" : "plain"}
            />
            <Figure
              label="Advertising per order"
              value={formatTND(result.adPerOrder)}
              detail={
                orderCount > 0
                  ? `${formatTND(inputs.adSpend)} shared across ${orderWord(orderCount)}`
                  : "No orders in the run yet, so nothing carries the advertising"
              }
            />
            <Figure
              label="Money in, whole run"
              value={formatTND(result.totalRevenue)}
              detail={`${orderWord(orderCount)} at ${formatTND(result.netPrice)} each`}
            />
            <Figure
              label="Money out, whole run"
              value={formatTND(result.totalCost)}
              detail="Product and delivery on every order, plus the advertising once"
            />
          </div>

          {result.isLoss ? (
            <div className="mt-3 rounded-[var(--radius-md)] border border-danger/25 bg-danger-soft px-4 py-3">
              <p className="os-label">This run loses money</p>
              <p className="os-num mt-1 font-display text-[26px] font-bold leading-none tracking-tight text-danger">
                {formatTND(result.profit)}
              </p>
              <p className="mt-2 max-w-[62ch] text-[12.5px] leading-relaxed text-danger">
                {lossAdvice}
              </p>
            </div>
          ) : (
            <div className="mt-3 rounded-[var(--radius-md)] border border-accent-line bg-accent-soft px-4 py-3">
              <p className="os-label">Left after everything is paid</p>
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
            title="How that was worked out"
            hint="One order first, then the same figures multiplied out"
          />
          <div className="grid gap-x-8 gap-y-1 lg:grid-cols-2">
            <div>
              <p className="os-label mb-1">One order</p>
              <dl>
                <Line label="Selling price" value={formatTND(inputs.sellingPrice)} />
                {discountPercent > 0 ? (
                  <Line
                    label={`Discount, ${discountPercent} percent`}
                    value={minus(result.discountValue)}
                  />
                ) : null}
                <Line label="What the customer pays" value={formatTND(result.netPrice)} subtotal />
                <Line label="The product" value={minus(inputs.productCost)} />
                <Line label="Delivery" value={minus(inputs.deliveryCost)} />
                <Line label="Advertising, this order's share" value={minus(result.adPerOrder)} />
                <Line label="Margin on one order" value={formatTND(result.marginPerOrder)} strong />
              </dl>
            </div>
            <div className="mt-3 lg:mt-0">
              <p className="os-label mb-1">The whole run</p>
              <dl>
                <Line
                  label={`Money in, ${orderWord(orderCount)}`}
                  value={formatTND(result.totalRevenue)}
                />
                <Line
                  label="Product and delivery on every order"
                  value={minus((inputs.productCost + inputs.deliveryCost) * orderCount)}
                />
                <Line label="Advertising for the run" value={minus(inputs.adSpend)} />
                <Line
                  label={result.isLoss ? "Lost on the run" : "Left after the run"}
                  value={formatTND(result.profit)}
                  strong
                />
              </dl>
            </div>
          </div>

          <p className="mt-3 max-w-[80ch] border-t border-line pt-3 text-[12.5px] leading-relaxed text-muted">
            {orderCount > 0 ? (
              <>
                Check it by hand: the customer pays{" "}
                <span className="os-num">{formatTND(result.netPrice)}</span>, then take off{" "}
                <span className="os-num">{formatTND(inputs.productCost)}</span> for the product,{" "}
                <span className="os-num">{formatTND(inputs.deliveryCost)}</span> for delivery and{" "}
                <span className="os-num">{formatTND(result.adPerOrder)}</span> of advertising, which
                is the <span className="os-num">{formatTND(inputs.adSpend)}</span> divided by{" "}
                <span className="os-num">{orderCount}</span>{" "}
                {orderCount === 1 ? "order" : "orders"}. That leaves{" "}
                <span className="os-num">{formatTND(result.marginPerOrder)}</span> on one order, and{" "}
                <span className="os-num">{formatTND(result.profit)}</span> once you multiply it out.
              </>
            ) : (
              <>
                Check it by hand: the customer pays{" "}
                <span className="os-num">{formatTND(result.netPrice)}</span>, then take off{" "}
                <span className="os-num">{formatTND(inputs.productCost)}</span> for the product and{" "}
                <span className="os-num">{formatTND(inputs.deliveryCost)}</span> for delivery, which
                leaves <span className="os-num">{formatTND(result.marginPerOrder)}</span> on one
                order. The run has no orders in it yet, so there is nothing to share the{" "}
                <span className="os-num">{formatTND(inputs.adSpend)}</span> of advertising across,
                and the run itself stands at{" "}
                <span className="os-num">{formatTND(result.profit)}</span>.
              </>
            )}
          </p>
        </Card>

        <Card>
          <CardHead
            title="Where this product has been selling"
            hint={
              product.sales.length < product.orderCount
                ? `${orderWord(product.orderCount)} in the demo data include ${product.name}. The ${product.sales.length} most recent are listed here.`
                : `${orderWord(product.orderCount)} in the demo data include ${product.name}`
            }
          />
          {product.sales.length === 0 ? (
            <EmptyState
              title="No order in the demo data includes this product"
              body="The figures above still work, they are just not backed by a sale yet. Pick another product to see real orders, or open Orders to look at the full list."
              action={{ label: "Open orders", href: "/orders" }}
            />
          ) : (
            <div className="os-scroll">
              <table className="w-full min-w-[520px] border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="os-label pb-2 text-left font-normal">Order</th>
                    <th className="os-label pb-2 text-left font-normal">Came in on</th>
                    <th className="os-label pb-2 text-left font-normal">When</th>
                    <th className="os-label pb-2 text-right font-normal">Units</th>
                    <th className="os-label pb-2 text-right font-normal">Line value, TND</th>
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
            Every row names the channel that order arrived on, kept from the moment the request came
            in. It is here so a price you set for an Instagram run is checked against orders that
            really came from Instagram.
          </p>
        </Card>
      </div>
    </div>
  );
}
