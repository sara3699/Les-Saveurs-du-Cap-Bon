import { describe, expect, it } from "vitest";
import { CONNECTIONS } from "@/lib/mock/core";
import { ORDERS, ORDER_ATTRIBUTIONS } from "@/lib/mock/commerce";
import { CONVERSATIONS, CONVERSATION_ATTRIBUTIONS } from "@/lib/mock/people";
import { buildAttributionIndex, orderSource, resolveSource, totalsByChannel, touchSummary } from "./attribution";
import { CHANNEL_ORDER } from "./channels";

const index = buildAttributionIndex(
  [...CONVERSATION_ATTRIBUTIONS, ...ORDER_ATTRIBUTIONS],
  CONNECTIONS,
);

describe("source attribution", () => {
  it("gives every order a source that can be resolved", () => {
    for (const order of ORDERS) {
      expect(() => orderSource(order, index)).not.toThrow();
    }
  });

  it("never labels an order Online, Other or Unknown, in English or in French", () => {
    const forbidden = new Set([
      "online",
      "other",
      "unknown",
      "en ligne",
      "autre",
      "inconnu",
      "n/a",
      "",
    ]);
    for (const order of ORDERS) {
      const label = orderSource(order, index).label.toLowerCase();
      expect(forbidden.has(label)).toBe(false);
    }
  });

  it("keeps a WhatsApp order labelled WhatsApp", () => {
    const whatsappOrders = ORDERS.filter(
      (o) => orderSource(o, index).channelId === "whatsapp",
    );
    expect(whatsappOrders.length).toBeGreaterThan(0);
    for (const order of whatsappOrders) {
      const source = orderSource(order, index);
      expect(source.label).toBe("WhatsApp");
      expect(source.channelId).not.toBe("website");
      expect(source.channelId).not.toBe("manual");
    }
  });

  it("points a connected order at the account it arrived through", () => {
    const order = ORDERS.find((o) => orderSource(o, index).channelId === "instagram")!;
    const source = orderSource(order, index);
    expect(source.connectionId).toBe("cn_instagram");
    expect(source.accountLabel).toBe("@lesmillesaveursducapbon");
  });

  it("leaves manual orders without a connected account rather than inventing one", () => {
    const order = ORDERS.find((o) => orderSource(o, index).channelId === "manual")!;
    const source = orderSource(order, index);
    expect(source.connectionId).toBeNull();
    expect(source.accountLabel).toBeNull();
    expect(source.label).toBe("Manuel");
  });

  it("refuses to display a record whose attribution is missing", () => {
    expect(() => resolveSource("at_does_not_exist", index)).toThrow(/source attribution/i);
  });

  it("counts every order exactly once across the six channels", () => {
    const totals = totalsByChannel(ORDERS, index);
    expect(totals).toHaveLength(CHANNEL_ORDER.length);
    const counted = totals.reduce((sum, t) => sum + t.orders, 0);
    expect(counted).toBe(ORDERS.length);
  });

  it("leaves refused and refunded orders out of revenue but inside the count", () => {
    const refused = ORDERS.filter(
      (o) => o.paymentStatus === "refused" || o.paymentStatus === "refunded",
    );
    expect(refused.length).toBeGreaterThan(0);
    const totals = totalsByChannel(refused, index);
    expect(totals.reduce((sum, t) => sum + t.orders, 0)).toBe(refused.length);
    expect(totals.reduce((sum, t) => sum + t.revenue, 0)).toBe(0);
  });

  it("keeps the first channel a customer arrived on when they move to another", () => {
    const summary = touchSummary("instagram", "whatsapp");
    expect(summary.first).toBe("Instagram");
    expect(summary.latest).toBe("WhatsApp");
    expect(summary.changed).toBe(true);
  });

  it("gives every conversation a source too", () => {
    for (const conversation of CONVERSATIONS) {
      expect(() => resolveSource(conversation.attributionId, index)).not.toThrow();
    }
  });
});
