/**
 * The whole arithmetic of the calculator, in one pure function.
 *
 * It lives on its own so the sentence printed under the result and the code
 * that produced it can be read side by side. Nothing in here reads state, a
 * clock or a random number, so the same six figures always give the same answer.
 */

export interface MarginInputs {
  /** Shelf price of one order, before any discount. */
  sellingPrice: number;
  /** What the product costs the shop to make or to buy. */
  productCost: number;
  /** What the courier costs the shop for one order. */
  deliveryCost: number;
  /** Discount the customer is given, 0 to 100. */
  discountPercent: number;
  /** How many orders the run is expected to bring. */
  orders: number;
  /** Advertising for the whole run, not for one order. */
  adSpend: number;
}

export interface MarginResult {
  /** Dinars taken off the selling price by the discount, on one order. */
  discountValue: number;
  /** What the customer actually pays for one order. */
  netPrice: number;
  /** The advertising for the run, divided by the number of orders. */
  adPerOrder: number;
  /** Product, delivery and advertising for one order. */
  costPerOrder: number;
  marginPerOrder: number;
  /** Margin as a share of what the customer pays, 0 to 100. */
  marginPercent: number;
  /** What one order leaves before the advertising is taken out. */
  contributionPerOrder: number;
  totalRevenue: number;
  totalCost: number;
  profit: number;
  isLoss: boolean;
  /**
   * Orders needed before the advertising is paid off. Null when no number of
   * orders can ever do it, because each one already loses money on its own.
   */
  breakEvenOrders: number | null;
}

/** A blank field, a minus sign or a stray letter all mean zero, never NaN. */
function atLeastZero(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

/**
 * The dinar is counted in thousandths, so every amount is snapped to one.
 *
 * Without this a run that breaks even exactly comes out as -0.0000000000009
 * and the screen turns red and says the run lost money, because a tenth of a
 * millime is still less than zero. Snapping also makes the printed breakdown
 * add up exactly, which is the whole promise of the check it by hand line.
 */
function millimes(amount: number): number {
  return Math.round(amount * 1000) / 1000;
}

/**
 * The one place the six typed figures are tidied up: nothing below zero, no
 * discount above a hundred percent, no half an order.
 *
 * The screen prints these cleaned figures rather than the raw text of the
 * fields, so the breakdown a reader checks by hand is the same arithmetic this
 * file did. Typing a minus sign into the cost field can then never show one
 * number on the line and use a different one in the total.
 */
export function cleanInputs(inputs: MarginInputs): MarginInputs {
  return {
    sellingPrice: atLeastZero(inputs.sellingPrice),
    productCost: atLeastZero(inputs.productCost),
    deliveryCost: atLeastZero(inputs.deliveryCost),
    discountPercent: Math.min(atLeastZero(inputs.discountPercent), 100),
    orders: Math.floor(atLeastZero(inputs.orders)),
    adSpend: atLeastZero(inputs.adSpend),
  };
}

export function computeMargin(raw: MarginInputs): MarginResult {
  const { sellingPrice, productCost, deliveryCost, discountPercent, orders, adSpend } =
    cleanInputs(raw);

  const discountValue = millimes((sellingPrice * discountPercent) / 100);
  const netPrice = millimes(sellingPrice - discountValue);

  // Advertising is bought for the run, so one order carries its share of it.
  const adPerOrder = millimes(orders > 0 ? adSpend / orders : 0);
  const costPerOrder = millimes(productCost + deliveryCost + adPerOrder);
  const marginPerOrder = millimes(netPrice - costPerOrder);
  const marginPercent = netPrice > 0 ? (marginPerOrder / netPrice) * 100 : 0;
  const contributionPerOrder = millimes(netPrice - productCost - deliveryCost);

  const totalRevenue = millimes(netPrice * orders);
  const totalCost = millimes((productCost + deliveryCost) * orders + adSpend);
  const profit = millimes(totalRevenue - totalCost);

  return {
    discountValue,
    netPrice,
    adPerOrder,
    costPerOrder,
    marginPerOrder,
    marginPercent,
    contributionPerOrder,
    totalRevenue,
    totalCost,
    profit,
    isLoss: profit < 0,
    // The tiny subtraction keeps a run that pays its advertising back on the
    // last order from reading as one order short, which floating point would
    // otherwise do to a division like 2332.8 over 24.3.
    breakEvenOrders:
      contributionPerOrder > 0
        ? Math.max(0, Math.ceil(adSpend / contributionPerOrder - 1e-9))
        : null,
  };
}

/** Reads what was typed in a number field. Blank counts as zero. */
export function readNumber(value: string): number {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}
