import { describe, expect, it } from "vitest";
import { manualOrder, orderTotal } from "./manual";

describe("an order typed in by the shop", () => {
  const line = { name: "Coffret gourmand", quantity: 2, unit_price: 148 };

  it("needs at least one line", () => {
    const result = manualOrder.safeParse({ name: "Client", items: [] });
    expect(result.success).toBe(false);
  });

  it("needs a customer, either chosen or named", () => {
    expect(manualOrder.safeParse({ items: [line] }).success).toBe(false);
    expect(manualOrder.safeParse({ name: "Client", items: [line] }).success).toBe(true);
    expect(
      manualOrder.safeParse({
        contact_id: "10f2108b-0e88-46ba-a9bb-d53550b0fbdb",
        items: [line],
      }).success,
    ).toBe(true);
  });

  it("refuses a quantity below one, which would be a refund written as a sale", () => {
    expect(manualOrder.safeParse({ name: "C", items: [{ ...line, quantity: 0 }] }).success).toBe(false);
    expect(manualOrder.safeParse({ name: "C", items: [{ ...line, quantity: -3 }] }).success).toBe(false);
  });

  it("refuses a negative price", () => {
    expect(manualOrder.safeParse({ name: "C", items: [{ ...line, unit_price: -1 }] }).success).toBe(false);
  });

  it("defaults to awaiting payment and preparing, the honest state for a new order", () => {
    const parsed = manualOrder.parse({ name: "Client", items: [line] });
    expect(parsed.payment_status).toBe("pending");
    expect(parsed.delivery_status).toBe("preparing");
    expect(parsed.delivery_fee).toBe(0);
  });

  it("adds the delivery fee to the goods, the same way the database does", () => {
    expect(orderTotal([line], 7.5)).toEqual({ goods: 296, deliveryFee: 7.5, total: 303.5 });
    expect(orderTotal([], 0).total).toBe(0);
  });
});
