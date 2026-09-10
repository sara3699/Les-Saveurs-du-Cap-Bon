import type {
  ChannelId,
  DeliveryStatus,
  Order,
  PaymentStatus,
  SourceAttribution,
  Task,
} from "@/lib/domain/types";
import { PRIMARY_CONNECTION, PRODUCTS } from "./core";
import { makeRng, pick, pickWeighted } from "./rng";
import { DEMO_NOW, daysAgo, daysAhead, hoursAgo, hoursAhead, minutesAgo } from "./time";

/**
 * Twelve orders written by hand, because they are the ones a reviewer will click
 * on: each is tied to a real conversation and a real customer, and each shows a
 * different combination of channel, payment and delivery.
 */
export const FEATURED_ORDER_ATTRIBUTIONS: SourceAttribution[] = [
  { id: "at_o01", channelId: "manual", connectionId: null, externalId: null, receivedAt: hoursAgo(6), campaign: null, referrer: "Walk-in, Nabeul shop", conversationId: "cv_08", contactId: "ct_ines" },
  { id: "at_o02", channelId: "google", connectionId: "cn_google_ads", externalId: "gads_order_44120", receivedAt: daysAgo(3), campaign: "Gift sets, September", referrer: null, conversationId: null, contactId: "ct_amine" },
  { id: "at_o03", channelId: "facebook", connectionId: "cn_facebook", externalId: "mid.$cAAB1v2Qp", receivedAt: daysAgo(9), campaign: null, referrer: null, conversationId: null, contactId: "ct_nadia" },
  { id: "at_o04", channelId: "website", connectionId: "cn_website_form", externalId: "form_ord_7781", receivedAt: daysAgo(2), campaign: null, referrer: "Les Saveurs checkout", conversationId: null, contactId: "ct_karim" },
  { id: "at_o05", channelId: "whatsapp", connectionId: "cn_whatsapp", externalId: "wamid.ORD.9921", receivedAt: daysAgo(5), campaign: null, referrer: null, conversationId: "cv_14", contactId: "ct_rania" },
  { id: "at_o06", channelId: "instagram", connectionId: "cn_instagram", externalId: "ig_ord_55120", receivedAt: daysAgo(13), campaign: null, referrer: "Story reply", conversationId: "cv_15", contactId: "ct_mehdi" },
  { id: "at_o07", channelId: "whatsapp", connectionId: "cn_whatsapp", externalId: "wamid.ORD.9944", receivedAt: daysAgo(6), campaign: null, referrer: null, conversationId: "cv_16", contactId: "ct_yosr" },
  { id: "at_o08", channelId: "whatsapp", connectionId: "cn_whatsapp", externalId: "wamid.ORD.9958", receivedAt: daysAgo(1), campaign: null, referrer: null, conversationId: "cv_11", contactId: "ct_sonia" },
  { id: "at_o09", channelId: "website", connectionId: "cn_website_form", externalId: "form_ord_7802", receivedAt: hoursAgo(4), campaign: null, referrer: "Les Saveurs checkout", conversationId: null, contactId: "ct_olfa" },
  { id: "at_o10", channelId: "instagram", connectionId: "cn_instagram", externalId: "ig_ord_55208", receivedAt: daysAgo(4), campaign: null, referrer: "Post comment", conversationId: null, contactId: "ct_yosr" },
  { id: "at_o11", channelId: "manual", connectionId: null, externalId: null, receivedAt: daysAgo(15), campaign: null, referrer: "Phone order", conversationId: null, contactId: "ct_ines" },
  { id: "at_o12", channelId: "facebook", connectionId: "cn_facebook", externalId: "mid.$cAAB1v8Tz", receivedAt: daysAgo(21), campaign: null, referrer: null, conversationId: null, contactId: "ct_nadia" },
];

function item(productId: string, quantity: number) {
  const product = PRODUCTS.find((p) => p.id === productId)!;
  return {
    id: `oi_${productId}_${quantity}`,
    productId,
    name: product.name,
    quantity,
    unitPrice: product.price,
  };
}

function totalOf(items: { quantity: number; unitPrice: number }[], deliveryFee: number): number {
  return items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0) + deliveryFee;
}

const FEATURED: Omit<Order, "total">[] = [
  { id: "or_01", reference: "ORD-2481", contactId: "ct_ines", attributionId: "at_o01", conversationId: "cv_08", placedAt: hoursAgo(6), paymentStatus: "paid", deliveryStatus: "preparing", assigneeId: "tm_sarra", items: [item("pr_gourmet_box", 2)], deliveryFee: 0 },
  { id: "or_02", reference: "ORD-2480", contactId: "ct_amine", attributionId: "at_o02", conversationId: null, placedAt: daysAgo(3), paymentStatus: "refused", deliveryStatus: "cancelled", assigneeId: "tm_yassine", items: [item("pr_celebration_platter", 1)], deliveryFee: 7.5 },
  { id: "or_03", reference: "ORD-2472", contactId: "ct_nadia", attributionId: "at_o03", conversationId: null, placedAt: daysAgo(9), paymentStatus: "paid", deliveryStatus: "delivered", assigneeId: "tm_yassine", items: [item("pr_dessert_assortment", 3), item("pr_artisan_butter", 1)], deliveryFee: 0 },
  { id: "or_04", reference: "ORD-2479", contactId: "ct_karim", attributionId: "at_o04", conversationId: null, placedAt: daysAgo(2), paymentStatus: "cash_on_delivery", deliveryStatus: "dispatched", assigneeId: "tm_mouna", items: [item("pr_dairy_selection", 1)], deliveryFee: 0 },
  { id: "or_05", reference: "ORD-2474", contactId: "ct_rania", attributionId: "at_o05", conversationId: "cv_14", placedAt: daysAgo(5), paymentStatus: "paid", deliveryStatus: "delivered", assigneeId: "tm_sarra", items: [item("pr_seasonal_jar", 1)], deliveryFee: 7.5 },
  { id: "or_06", reference: "ORD-2455", contactId: "ct_mehdi", attributionId: "at_o06", conversationId: "cv_15", placedAt: daysAgo(13), paymentStatus: "paid", deliveryStatus: "delivered", assigneeId: "tm_khaled", items: [item("pr_pistachio_dessert", 1), item("pr_discovery_assortment", 1)], deliveryFee: 7.5 },
  { id: "or_07", reference: "ORD-2473", contactId: "ct_yosr", attributionId: "at_o07", conversationId: "cv_16", placedAt: daysAgo(6), paymentStatus: "paid", deliveryStatus: "delivered", assigneeId: "tm_khaled", items: [item("pr_dairy_selection", 1)], deliveryFee: 0 },
  { id: "or_08", reference: "ORD-2482", contactId: "ct_sonia", attributionId: "at_o08", conversationId: "cv_11", placedAt: daysAgo(1), paymentStatus: "cash_on_delivery", deliveryStatus: "dispatched", assigneeId: "tm_mouna", items: [item("pr_dessert_assortment", 2)], deliveryFee: 7.5 },
  { id: "or_09", reference: "ORD-2483", contactId: "ct_olfa", attributionId: "at_o09", conversationId: null, placedAt: hoursAgo(4), paymentStatus: "pending", deliveryStatus: "preparing", assigneeId: null, items: [item("pr_artisan_butter", 1), item("pr_seasonal_jar", 1)], deliveryFee: 7.5 },
  { id: "or_10", reference: "ORD-2477", contactId: "ct_yosr", attributionId: "at_o10", conversationId: null, placedAt: daysAgo(4), paymentStatus: "refunded", deliveryStatus: "returned", assigneeId: "tm_khaled", items: [item("pr_celebration_platter", 1)], deliveryFee: 7.5 },
  { id: "or_11", reference: "ORD-2449", contactId: "ct_ines", attributionId: "at_o11", conversationId: null, placedAt: daysAgo(15), paymentStatus: "paid", deliveryStatus: "delivered", assigneeId: "tm_sarra", items: [item("pr_gourmet_box", 1), item("pr_artisan_butter", 4)], deliveryFee: 0 },
  { id: "or_12", reference: "ORD-2431", contactId: "ct_nadia", attributionId: "at_o12", conversationId: null, placedAt: daysAgo(21), paymentStatus: "paid", deliveryStatus: "delivered", assigneeId: "tm_yassine", items: [item("pr_discovery_assortment", 2)], deliveryFee: 7.5 },
];

export const FEATURED_ORDERS: Order[] = FEATURED.map((o) => ({
  ...o,
  total: totalOf(o.items, o.deliveryFee),
}));

const CHANNEL_WEIGHTS: Record<ChannelId, number> = {
  whatsapp: 34,
  website: 26,
  instagram: 18,
  facebook: 10,
  google: 7,
  manual: 5,
};

const CAMPAIGNS = ["Gift sets, September", "Brand, always on", "Retargeting, cart"];
const REFERRERS = [
  "Les Saveurs checkout",
  "Les Saveurs product page",
  "Les Saveurs assortment page",
];

const CONTACT_POOL = [
  "ct_rania", "ct_slim", "ct_yosr", "ct_amine", "ct_nadia", "ct_ines", "ct_mehdi",
  "ct_olfa", "ct_hatem", "ct_leila", "ct_walid", "ct_sonia", "ct_karim",
];

/**
 * The rest of the trading history, generated from a fixed seed so the dashboard
 * shows the same figures on every render. Instagram carries a higher return rate
 * than the other channels, which is the sort of difference the Statistics screen
 * exists to make visible.
 */
function generateHistory(): { orders: Order[]; attributions: SourceAttribution[] } {
  const rng = makeRng(20260909);
  const orders: Order[] = [];
  const attributions: SourceAttribution[] = [];
  let reference = 2100;

  for (let day = 74; day >= 0; day--) {
    const weekday = new Date(DEMO_NOW.getTime() - day * 86_400_000).getUTCDay();
    const base = weekday === 6 || weekday === 0 ? 6 : 4;
    const count = base + Math.floor(rng() * 4);

    for (let n = 0; n < count; n++) {
      const channelId = pickWeighted(rng, CHANNEL_WEIGHTS);
      const contactId = pick(rng, CONTACT_POOL);
      const hour = 8 + Math.floor(rng() * 12);
      const placedAt = new Date(
        DEMO_NOW.getTime() - day * 86_400_000 - (23 - hour) * 3_600_000,
      ).toISOString();

      const product = pick(rng, PRODUCTS);
      const quantity = rng() > 0.86 ? 2 : 1;
      const items = [item(product.id, quantity)];
      const deliveryFee = product.price * quantity >= 200 ? 0 : 7.5;

      const returnChance = channelId === "instagram" ? 0.11 : 0.05;
      const roll = rng();
      let paymentStatus: PaymentStatus;
      let deliveryStatus: DeliveryStatus;
      if (roll < returnChance) {
        paymentStatus = "refunded";
        deliveryStatus = "returned";
      } else if (roll < returnChance + 0.06) {
        paymentStatus = "refused";
        deliveryStatus = "cancelled";
      } else if (day <= 1) {
        paymentStatus = rng() > 0.5 ? "paid" : "cash_on_delivery";
        deliveryStatus = "preparing";
      } else if (day <= 3) {
        paymentStatus = rng() > 0.4 ? "paid" : "cash_on_delivery";
        deliveryStatus = "dispatched";
      } else {
        paymentStatus = "paid";
        deliveryStatus = "delivered";
      }

      reference += 1;
      const attributionId = `at_g${reference}`;
      attributions.push({
        id: attributionId,
        channelId,
        connectionId: PRIMARY_CONNECTION[channelId] ?? null,
        externalId: channelId === "manual" ? null : `${channelId}_evt_${reference}`,
        receivedAt: placedAt,
        campaign: channelId === "google" ? pick(rng, CAMPAIGNS) : null,
        referrer: channelId === "website" ? pick(rng, REFERRERS) : null,
        conversationId: null,
        contactId,
      });

      orders.push({
        id: `or_g${reference}`,
        reference: `ORD-${reference}`,
        contactId,
        attributionId,
        conversationId: null,
        placedAt,
        paymentStatus,
        deliveryStatus,
        assigneeId: pick(rng, ["tm_sarra", "tm_khaled", "tm_mouna", "tm_yassine", null]),
        items,
        deliveryFee,
        total: totalOf(items, deliveryFee),
      });
    }
  }

  return { orders, attributions };
}

const history = generateHistory();

export const ORDERS: Order[] = [...FEATURED_ORDERS, ...history.orders].sort(
  (a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime(),
);

export const ORDER_ATTRIBUTIONS: SourceAttribution[] = [
  ...FEATURED_ORDER_ATTRIBUTIONS,
  ...history.attributions,
];

export const TASKS: Task[] = [
  { id: "tk_01", title: "Hold the green jar for Rania until Thursday", type: "reminder", contactId: "ct_rania", conversationId: "cv_01", assigneeId: "tm_sarra", dueAt: hoursAhead(5), priority: "high", completedAt: null },
  { id: "tk_02", title: "Send Rania the pair price for pistachio products", type: "quote", contactId: "ct_rania", conversationId: "cv_01", assigneeId: "tm_sarra", dueAt: hoursAhead(2), priority: "normal", completedAt: null },
  { id: "tk_03", title: "Call Slim about the Friday delivery to Sousse", type: "call", contactId: "ct_slim", conversationId: "cv_03", assigneeId: "tm_mouna", dueAt: hoursAgo(2), priority: "high", completedAt: null },
  { id: "tk_04", title: "Reply to Amine about the gift set price", type: "reply", contactId: "ct_amine", conversationId: "cv_04", assigneeId: "tm_yassine", dueAt: hoursAgo(9), priority: "normal", completedAt: null },
  { id: "tk_05", title: "Send Leila the quote for eight gift sets", type: "quote", contactId: "ct_leila", conversationId: "cv_10", assigneeId: "tm_khaled", dueAt: daysAgo(1), priority: "high", completedAt: null },
  { id: "tk_06", title: "Reply to Hatem on Instagram", type: "reply", contactId: "ct_hatem", conversationId: "cv_09", assigneeId: "tm_mouna", dueAt: hoursAhead(20), priority: "normal", completedAt: null },
  { id: "tk_07", title: "Confirm the dessert platter size for Karim", type: "custom", contactId: "ct_karim", conversationId: "cv_13", assigneeId: "tm_mouna", dueAt: daysAhead(1), priority: "low", completedAt: null },
  { id: "tk_08", title: "Meet the hotel buyer in Bizerte", type: "meeting", contactId: "ct_mehdi", conversationId: "cv_07", assigneeId: "tm_khaled", dueAt: daysAhead(2), priority: "normal", completedAt: null },
  { id: "tk_09", title: "Chase Walid before closing the lead", type: "call", contactId: "ct_walid", conversationId: "cv_12", assigneeId: "tm_yassine", dueAt: daysAhead(3), priority: "low", completedAt: null },
  { id: "tk_10", title: "Confirm Sonia's Saturday pickup", type: "reminder", contactId: "ct_sonia", conversationId: "cv_11", assigneeId: "tm_mouna", dueAt: daysAgo(2), priority: "normal", completedAt: daysAgo(2) },
  { id: "tk_11", title: "Send Nadia the thank you note", type: "reply", contactId: "ct_nadia", conversationId: "cv_05", assigneeId: "tm_yassine", dueAt: daysAgo(1), priority: "low", completedAt: daysAgo(1) },
  { id: "tk_12", title: "Restock the discovery assortments", type: "custom", contactId: null, conversationId: null, assigneeId: "tm_sarra", dueAt: minutesAgo(90), priority: "high", completedAt: null },
];
