import type {
  ChannelConnection,
  Product,
  Tag,
  TeamConversionMetric,
  TeamMember,
} from "@/lib/domain/types";
import { daysAgo, hoursAgo, minutesAgo } from "./time";

export const STORE = {
  name: "Les Saveurs du Cap Bon",
  city: "Nabeul, Cap Bon",
  initials: "LS",
  currency: "TND",
  /** Shown on the dashboard so nobody mistakes the figures for real trading. */
  demo: true,
};

export const TEAM: TeamMember[] = [
  { id: "tm_sarra", name: "Sarra", initials: "S", role: "owner", openConversations: 4, tasksDue: 3 },
  { id: "tm_khaled", name: "Khaled Mansouri", initials: "KM", role: "manager", openConversations: 6, tasksDue: 2 },
  { id: "tm_mouna", name: "Mouna Sassi", initials: "MS", role: "agent", openConversations: 5, tasksDue: 4 },
  { id: "tm_yassine", name: "Yassine Belhaj", initials: "YB", role: "agent", openConversations: 3, tasksDue: 1 },
];

export const TEAM_CONVERSION_METRICS: TeamConversionMetric[] = [
  {
    id: "cvx_sarra",
    teamMemberId: "tm_sarra",
    callsReceived: 22,
    customersReached: 18,
    customersWon: 9,
    customersRejected: 3,
    ordersPlaced: 8,
    revenue: 3560,
  },
  {
    id: "cvx_khaled",
    teamMemberId: "tm_khaled",
    callsReceived: 31,
    customersReached: 27,
    customersWon: 13,
    customersRejected: 6,
    ordersPlaced: 11,
    revenue: 4890,
  },
  {
    id: "cvx_mouna",
    teamMemberId: "tm_mouna",
    callsReceived: 28,
    customersReached: 21,
    customersWon: 10,
    customersRejected: 5,
    ordersPlaced: 8,
    revenue: 3120,
  },
  {
    id: "cvx_yassine",
    teamMemberId: "tm_yassine",
    callsReceived: 19,
    customersReached: 15,
    customersWon: 6,
    customersRejected: 4,
    ordersPlaced: 5,
    revenue: 2140,
  },
];

export const TAGS: Tag[] = [
  { id: "tg_repeat", label: "Repeat buyer" },
  { id: "tg_gift", label: "Gift set" },
  { id: "tg_wholesale", label: "Wholesale" },
  { id: "tg_delivery", label: "Delivery question" },
  { id: "tg_price", label: "Price question" },
  { id: "tg_complaint", label: "Complaint" },
  { id: "tg_ramadan", label: "Ramadan range" },
  { id: "tg_vip", label: "Priority customer" },
];

export const PRODUCTS: Product[] = [
  { id: "pr_pistachio_cream", name: "Crème de pistache", sku: "LMS-PIS-01", price: 42, cost: 22, stock: 18, lowStockAt: 6, unitsSold: 52 },
  { id: "pr_pistachio_dessert", name: "Dessert à la pistache", sku: "LMS-PIS-02", price: 68, cost: 34, stock: 12, lowStockAt: 5, unitsSold: 41 },
  { id: "pr_dessert_assortment", name: "Assortiment de desserts", sku: "LMS-DES-01", price: 78, cost: 39, stock: 9, lowStockAt: 5, unitsSold: 37 },
  { id: "pr_artisan_butter", name: "Beurre artisanal", sku: "LMS-BTR-01", price: 26, cost: 13, stock: 21, lowStockAt: 6, unitsSold: 64 },
  { id: "pr_dairy_selection", name: "Sélection laitière", sku: "LMS-DAI-01", price: 54, cost: 28, stock: 7, lowStockAt: 8, unitsSold: 29 },
  { id: "pr_gourmet_box", name: "Coffret gourmand", sku: "LMS-GFT-01", price: 148, cost: 76, stock: 6, lowStockAt: 4, unitsSold: 18 },
  { id: "pr_seasonal_jar", name: "Pot gourmand saisonnier", sku: "LMS-SWT-01", price: 36, cost: 18, stock: 15, lowStockAt: 5, unitsSold: 48 },
  { id: "pr_discovery_assortment", name: "Assortiment découverte", sku: "LMS-SMP-01", price: 96, cost: 49, stock: 4, lowStockAt: 6, unitsSold: 26 },
  { id: "pr_celebration_platter", name: "Plateau de fête", sku: "LMS-PLT-01", price: 185, cost: 96, stock: 8, lowStockAt: 3, unitsSold: 14 },
];

/**
 * Connection states are spread on purpose: one working, one half configured, one
 * never started, one broken, and two that Google has not been asked for yet. The
 * Integrations screen is only honest if it can show all of these.
 */
export const CONNECTIONS: ChannelConnection[] = [
  {
    id: "cn_website_form",
    channelId: "website",
    accountLabel: "Les Saveurs website form",
    status: "connected",
    summary:
      "Orders placed on your site arrive here with the page the customer came from, alongside any question sent with the order.",
    requires: "A form on a site you control",
    permissions: ["Post to your Les Saveurs du Cap Bon intake address"],
    lastSyncAt: minutesAgo(6),
    lastEventAt: minutesAgo(52),
    lastErrorAt: null,
    lastErrorMessage: null,
    outstanding: [],
    reviewNote: null,
    eventsThisWeek: 23,
    setupGuideHref: "/help#website-form",
  },
  {
    id: "cn_whatsapp",
    channelId: "whatsapp",
    accountLabel: "Les Saveurs WhatsApp Business",
    status: "connected",
    summary:
      "Orders taken over WhatsApp land in the order list with the customer, the products and the WhatsApp account they came from.",
    requires: "A verified business and a phone number that is not on the WhatsApp app",
    permissions: ["whatsapp_business_messaging", "whatsapp_business_management"],
    lastSyncAt: minutesAgo(2),
    lastEventAt: minutesAgo(4),
    lastErrorAt: null,
    lastErrorMessage: null,
    outstanding: [],
    reviewNote:
      "Answering within 24 hours needs nothing extra. Starting a conversation after 24 hours of silence needs a message template that Meta has approved.",
    eventsThisWeek: 148,
    setupGuideHref: "/help#whatsapp",
  },
  {
    id: "cn_instagram",
    channelId: "instagram",
    accountLabel: "@lesmillesaveursducapbon",
    status: "setup_required",
    summary:
      "Orders that start in an Instagram message land in the order list, labelled Instagram, with the story or post behind them.",
    requires: "An Instagram professional account linked to a Facebook page you administer",
    permissions: ["instagram_manage_messages", "pages_manage_metadata"],
    lastSyncAt: daysAgo(11),
    lastEventAt: daysAgo(11),
    lastErrorAt: null,
    lastErrorMessage: null,
    outstanding: [
      "Grant the messaging permission to @lesmillesaveursducapbon",
      "Confirm the linked Facebook page",
    ],
    reviewNote:
      "Only professional accounts can be connected. Personal Instagram inboxes are not available to any product, including this one.",
    eventsThisWeek: 0,
    setupGuideHref: "/help#instagram",
  },
  {
    id: "cn_facebook",
    channelId: "facebook",
    accountLabel: "Les Saveurs du Cap Bon, Facebook page",
    status: "error",
    summary: "Orders that start on your Facebook page land in the order list, labelled Facebook, with the conversation attached.",
    requires: "A Facebook page you administer",
    permissions: ["pages_messaging", "pages_manage_metadata", "pages_read_engagement"],
    lastSyncAt: daysAgo(7),
    lastEventAt: daysAgo(7),
    lastErrorAt: hoursAgo(3),
    lastErrorMessage: "Page permission withdrawn. Messages sent since then have not been received.",
    outstanding: ["Reconnect the page and grant messaging permission again"],
    reviewNote: null,
    eventsThisWeek: 0,
    setupGuideHref: "/help#facebook",
  },
  {
    id: "cn_google_ads",
    channelId: "google",
    accountLabel: "Les Saveurs Google Ads",
    status: "warning",
    summary:
      "Orders from people who came through a Google Ads lead form arrive here with the campaign that paid for them.",
    requires: "A Google Ads account with at least one lead form extension",
    permissions: ["adwords"],
    lastSyncAt: hoursAgo(2),
    lastEventAt: hoursAgo(3),
    lastErrorAt: hoursAgo(9),
    lastErrorMessage: "Two lead notifications were rejected because the webhook key did not match.",
    outstanding: ["Update the webhook key in Google Ads"],
    reviewNote: null,
    eventsThisWeek: 11,
    setupGuideHref: "/help#google-ads",
  },
  {
    id: "cn_google_business",
    channelId: "google",
    accountLabel: "Google Business Profile",
    status: "not_connected",
    summary:
      "Orders and enquiries from your Google Business Profile. Kept separate from Google Ads so a review is never counted as an order.",
    requires: "A verified Google Business Profile",
    permissions: ["business.manage"],
    lastSyncAt: null,
    lastEventAt: null,
    lastErrorAt: null,
    lastErrorMessage: null,
    outstanding: ["Planned for a later release"],
    reviewNote: null,
    eventsThisWeek: 0,
    setupGuideHref: "/help#google-business",
    planned: true,
  },
  {
    id: "cn_gmail",
    channelId: "google",
    accountLabel: "Gmail",
    status: "not_connected",
    summary:
      "Turn orders emailed to your shop address into real orders. A separate connector from Google Ads and from your Business Profile.",
    requires: "A Google Workspace or Gmail account",
    permissions: ["gmail.readonly", "gmail.send"],
    lastSyncAt: null,
    lastEventAt: null,
    lastErrorAt: null,
    lastErrorMessage: null,
    outstanding: ["Planned for a later release"],
    reviewNote: null,
    eventsThisWeek: 0,
    setupGuideHref: "/help#gmail",
    planned: true,
  },
  {
    id: "cn_manual",
    channelId: "manual",
    accountLabel: "Typed in by your team",
    status: "connected",
    summary:
      "Orders you take by phone or at the counter. Always available, and never confused with a platform a customer used.",
    requires: "Nothing",
    permissions: [],
    lastSyncAt: hoursAgo(5),
    lastEventAt: hoursAgo(5),
    lastErrorAt: null,
    lastErrorMessage: null,
    outstanding: [],
    reviewNote: null,
    eventsThisWeek: 6,
    setupGuideHref: "/help#manual",
  },
];

/** Which connection a generated record belongs to, per channel. */
export const PRIMARY_CONNECTION: Record<string, string | null> = {
  website: "cn_website_form",
  whatsapp: "cn_whatsapp",
  instagram: "cn_instagram",
  facebook: "cn_facebook",
  google: "cn_google_ads",
  manual: null,
};
