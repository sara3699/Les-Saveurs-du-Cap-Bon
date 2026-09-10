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
  { id: "tg_repeat", label: "Client fidele" },
  { id: "tg_gift", label: "Coffret cadeau" },
  { id: "tg_wholesale", label: "Vente en gros" },
  { id: "tg_delivery", label: "Question livraison" },
  { id: "tg_price", label: "Question prix" },
  { id: "tg_complaint", label: "Reclamation" },
  { id: "tg_ramadan", label: "Gamme Ramadan" },
  { id: "tg_vip", label: "Client prioritaire" },
];

export const PRODUCTS: Product[] = [
  { id: "pr_pistachio_cream", name: "Creme de pistache", sku: "LMS-PIS-01", price: 42, cost: 22, stock: 18, lowStockAt: 6, unitsSold: 52 },
  { id: "pr_pistachio_dessert", name: "Dessert a la pistache", sku: "LMS-PIS-02", price: 68, cost: 34, stock: 12, lowStockAt: 5, unitsSold: 41 },
  { id: "pr_dessert_assortment", name: "Assortiment de desserts", sku: "LMS-DES-01", price: 78, cost: 39, stock: 9, lowStockAt: 5, unitsSold: 37 },
  { id: "pr_artisan_butter", name: "Beurre artisanal", sku: "LMS-BTR-01", price: 26, cost: 13, stock: 21, lowStockAt: 6, unitsSold: 64 },
  { id: "pr_dairy_sélection", name: "Sélection laitière", sku: "LMS-DAI-01", price: 54, cost: 28, stock: 7, lowStockAt: 8, unitsSold: 29 },
  { id: "pr_gourmet_box", name: "Coffret gourmand", sku: "LMS-GFT-01", price: 148, cost: 76, stock: 6, lowStockAt: 4, unitsSold: 18 },
  { id: "pr_seasonal_jar", name: "Pot gourmand saisonnier", sku: "LMS-SWT-01", price: 36, cost: 18, stock: 15, lowStockAt: 5, unitsSold: 48 },
  { id: "pr_discovery_assortment", name: "Assortiment decouverte", sku: "LMS-SMP-01", price: 96, cost: 49, stock: 4, lowStockAt: 6, unitsSold: 26 },
  { id: "pr_celebration_platter", name: "Plateau de fete", sku: "LMS-PLT-01", price: 185, cost: 96, stock: 8, lowStockAt: 3, unitsSold: 14 },
];

/**
 * Connection states are spread on purpose: one working, one half configured, one
 * never started, one broken, and two that Google has not been asked for yet. The
 * Intégrations screen is only honest if it can show all of these.
 */
export const CONNECTIONS: ChannelConnection[] = [
  {
    id: "cn_website_form",
    channelId: "website",
    accountLabel: "Formulaire du site Les Saveurs",
    status: "connected",
    summary:
      "Les commandes passées sur votre site arrivent ici avec la page d'origine et la question eventuelle envoyée avec la commande.",
    requires: "Un formulaire sur un site que vous controlez",
    permissions: ["Publier vers l'adresse de reception Les Saveurs du Cap Bon"],
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
    accountLabel: "WhatsApp Business Les Saveurs",
    status: "connected",
    summary:
      "Les commandes prises sur WhatsApp arrivent dans la liste avec le client, les produits et le compte WhatsApp d'origine.",
    requires: "Une entreprise vérifiée et un numéro qui n'utilisé pas l'application WhatsApp",
    permissions: ["whatsapp_business_messaging", "whatsapp_business_management"],
    lastSyncAt: minutesAgo(2),
    lastEventAt: minutesAgo(4),
    lastErrorAt: null,
    lastErrorMessage: null,
    outstanding: [],
    reviewNote:
      "Répondre dans les 24 heures ne demande rien de plus. Après 24 heures de silence, il faut un modèle de message approuve par Meta.",
    eventsThisWeek: 148,
    setupGuideHref: "/help#whatsapp",
  },
  {
    id: "cn_instagram",
    channelId: "instagram",
    accountLabel: "@lesmillesaveursducapbon",
    status: "setup_required",
    summary:
      "Les commandes qui commencent dans un message Instagram arrivent dans la liste avec la story ou la publication d'origine.",
    requires: "Un compte professionnel Instagram relie a une page Facebook administree par vous",
    permissions: ["instagram_manage_messages", "pages_manage_metadata"],
    lastSyncAt: daysAgo(11),
    lastEventAt: daysAgo(11),
    lastErrorAt: null,
    lastErrorMessage: null,
    outstanding: [
      "Accorder l'autorisation de messagerie a @lesmillesaveursducapbon",
      "Confirmer la page Facebook liée",
    ],
    reviewNote:
      "Seuls les comptes professionnels peuvent etre connectes. Les boites personnelles Instagram ne sont disponibles pour aucun produit, y compris celui-ci.",
    eventsThisWeek: 0,
    setupGuideHref: "/help#instagram",
  },
  {
    id: "cn_facebook",
    channelId: "facebook",
    accountLabel: "Les Saveurs du Cap Bon, page Facebook",
    status: "error",
    summary: "Les commandes qui commencent sur votre page Facebook arrivent dans la liste avec la conversation jointe.",
    requires: "Une page Facebook administree par vous",
    permissions: ["pages_messaging", "pages_manage_metadata", "pages_read_engagement"],
    lastSyncAt: daysAgo(7),
    lastEventAt: daysAgo(7),
    lastErrorAt: hoursAgo(3),
    lastErrorMessage: "L'autorisation de la page a été retirée. Les messages envoyés depuis n'ont pas été reçus.",
    outstanding: ["Reconnecter la page et accorder a nouveau l'autorisation de messagerie"],
    reviewNote: null,
    eventsThisWeek: 0,
    setupGuideHref: "/help#facebook",
  },
  {
    id: "cn_google_ads",
    channelId: "google",
    accountLabel: "Google Ads Les Saveurs",
    status: "warning",
    summary:
      "Les commandes issues d'un formulaire Google Ads arrivent ici avec la campagne qui les a generees.",
    requires: "Un compte Google Ads avec au moins une extension de formulaire",
    permissions: ["adwords"],
    lastSyncAt: hoursAgo(2),
    lastEventAt: hoursAgo(3),
    lastErrorAt: hoursAgo(9),
    lastErrorMessage: "Deux notifications de prospects ont été refusees car la clé webhook ne correspondait pas.",
    outstanding: ["Mettre a jour la clé webhook dans Google Ads"],
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
      "Les commandes et les demandes qui arrivent par votre fiche Google Business. Tenue a part de Google Ads, pour qu'un avis ne soit jamais compte comme une commande.",
    requires: "Une fiche Google Business vérifiée",
    permissions: ["business.manage"],
    lastSyncAt: null,
    lastEventAt: null,
    lastErrorAt: null,
    lastErrorMessage: null,
    outstanding: ["Prévu pour une version ulterieure"],
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
      "Transforme les commandes envoyées par e-mail a l'adresse de la boutique en vraies commandes. Un connecteur distinct de Google Ads et de votre fiche Business.",
    requires: "Un compte Google Workspace ou Gmail",
    permissions: ["gmail.readonly", "gmail.send"],
    lastSyncAt: null,
    lastEventAt: null,
    lastErrorAt: null,
    lastErrorMessage: null,
    outstanding: ["Prévu pour une version ulterieure"],
    reviewNote: null,
    eventsThisWeek: 0,
    setupGuideHref: "/help#gmail",
    planned: true,
  },
  {
    id: "cn_manual",
    channelId: "manual",
    accountLabel: "Saisi par votre équipe",
    status: "connected",
    summary:
      "Les commandes que vous prenez par téléphone ou au comptoir. Toujours disponible, et jamais confondu avec une plateforme utilisée par un client.",
    requires: "Rien",
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
