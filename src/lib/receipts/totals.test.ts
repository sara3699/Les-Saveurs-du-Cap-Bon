import { describe, expect, it } from "vitest";
import { checkItems, checkTotals, toleranceFor } from "./totals";

describe("checkTotals", () => {
  it("accepts a receipt that adds up", () => {
    const result = checkTotals({
      subtotal: 182,
      discount: null,
      taxAmount: 34.58,
      tipAmount: null,
      totalAmount: 216.58,
    });
    expect(result.balanced).toBe(true);
    expect(result.message).toBeNull();
  });

  it("accepts a rounding difference rather than arguing with the paper", () => {
    const result = checkTotals({
      subtotal: 182,
      discount: null,
      taxAmount: 34.58,
      tipAmount: null,
      totalAmount: 216.6,
    });
    expect(result.balanced).toBe(true);
  });

  it("takes the remise off and the pourboire on", () => {
    const result = checkTotals({
      subtotal: 100,
      discount: 10,
      taxAmount: 19,
      tipAmount: 5,
      totalAmount: 114,
    });
    expect(result.balanced).toBe(true);
  });

  it("warns, in French, when it does not add up", () => {
    const result = checkTotals({
      subtotal: 182,
      discount: null,
      taxAmount: 34.58,
      tipAmount: null,
      totalAmount: 316.58,
    });
    expect(result.balanced).toBe(false);
    expect(result.expected).toBeCloseTo(216.58, 3);
    expect(result.message).toMatch(/100,000 de plus que/);
    expect(result.message).toMatch(/enregistrez si le reçu dit bien cela/);
  });

  it("says nothing when there is not enough to check", () => {
    const result = checkTotals({
      subtotal: null,
      discount: null,
      taxAmount: null,
      tipAmount: null,
      totalAmount: 216.58,
    });
    expect(result.unchecked).toBe(true);
    expect(result.balanced).toBe(true);
    expect(result.message).toBeNull();
  });

  it("keeps its slack proportionate and bounded", () => {
    expect(toleranceFor(10)).toBe(0.05);
    expect(toleranceFor(100)).toBe(0.5);
    expect(toleranceFor(100_000)).toBe(1);
  });
});

describe("checkItems", () => {
  it("accepts articles that come to the sous-total", () => {
    const result = checkItems([{ totalAmount: 144 }, { totalAmount: 38 }], {
      subtotal: 182,
      totalAmount: 216.58,
    });
    expect(result.matches).toBe(true);
    expect(result.itemsTotal).toBe(182);
  });

  it("warns when a line looks to be missing", () => {
    const result = checkItems([{ totalAmount: 144 }], { subtotal: 182, totalAmount: 216.58 });
    expect(result.matches).toBe(false);
    expect(result.message).toMatch(/Il manque peut-être une ligne/);
  });

  it("compares against the total when there is no sous-total", () => {
    const result = checkItems([{ totalAmount: 216.58 }], { subtotal: null, totalAmount: 216.58 });
    expect(result.matches).toBe(true);
  });

  it("says nothing when there are no articles", () => {
    const result = checkItems([], { subtotal: 182, totalAmount: 216.58 });
    expect(result.unchecked).toBe(true);
    expect(result.message).toBeNull();
  });
});
