/**
 * Does the receipt add up.
 *
 * subtotal − remise + TVA + pourboire = total.
 *
 * This warns and never refuses. Real receipts round in ways that do not reconcile to
 * the millime, and a shopkeeper holding a piece of paper that clearly says 42,300 does
 * not want to be told the paper is wrong. So the answer is a sentence next to the
 * total, not a locked button.
 */

export interface TotalsInput {
  subtotal: number | null;
  discount: number | null;
  taxAmount: number | null;
  tipAmount: number | null;
  totalAmount: number | null;
}

export interface TotalsCheck {
  /** False only when the parts are known and do not add up. */
  balanced: boolean;
  /** True when there is not enough on the receipt to check anything. */
  unchecked: boolean;
  expected: number | null;
  difference: number;
  tolerance: number;
  /** French, ready to print. Null when there is nothing to say. */
  message: string | null;
}

/**
 * Half a dinar of slack on a small receipt, half a percent on a large one, and never
 * more than one dinar. Generous enough for rounding, tight enough that a transposed
 * digit still shows up.
 */
export function toleranceFor(total: number): number {
  return Math.min(Math.max(0.05, Math.abs(total) * 0.005), 1);
}

export function checkTotals(input: TotalsInput): TotalsCheck {
  const { subtotal, discount, taxAmount, tipAmount, totalAmount } = input;

  if (totalAmount === null || subtotal === null) {
    return {
      balanced: true,
      unchecked: true,
      expected: null,
      difference: 0,
      tolerance: 0,
      message: null,
    };
  }

  const expected = subtotal - (discount ?? 0) + (taxAmount ?? 0) + (tipAmount ?? 0);
  const difference = Number((totalAmount - expected).toFixed(3));
  const tolerance = toleranceFor(totalAmount);

  if (Math.abs(difference) <= tolerance) {
    return { balanced: true, unchecked: false, expected, difference, tolerance, message: null };
  }

  const gap = Math.abs(difference).toFixed(3).replace(".", ",");
  const direction = difference > 0 ? "de plus que" : "de moins que";
  return {
    balanced: false,
    unchecked: false,
    expected,
    difference,
    tolerance,
    message: `Le total indiqué est ${gap} ${direction} la somme des lignes. Vérifiez les montants, puis enregistrez si le reçu dit bien cela.`,
  };
}

export interface ItemsCheck {
  matches: boolean;
  unchecked: boolean;
  itemsTotal: number;
  message: string | null;
}

/**
 * The articles against the receipt's own figure. Compared to the sous-total when there
 * is one, because the articles are printed before the tax is added.
 */
export function checkItems(
  items: { totalAmount: number }[],
  against: { subtotal: number | null; totalAmount: number | null },
): ItemsCheck {
  const reference = against.subtotal ?? against.totalAmount;
  const itemsTotal = Number(items.reduce((sum, item) => sum + item.totalAmount, 0).toFixed(3));

  if (items.length === 0 || reference === null) {
    return { matches: true, unchecked: true, itemsTotal, message: null };
  }

  const tolerance = toleranceFor(reference);
  if (Math.abs(itemsTotal - reference) <= tolerance) {
    return { matches: true, unchecked: false, itemsTotal, message: null };
  }

  const shown = itemsTotal.toFixed(3).replace(".", ",");
  return {
    matches: false,
    unchecked: false,
    itemsTotal,
    message: `Les articles font ${shown}, ce qui ne correspond pas au sous-total du reçu. Il manque peut-être une ligne.`,
  };
}
