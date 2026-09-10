import { daysAgo } from "./time";

/** The shop's own détails, edited on the Store screen. */
export const STORE_PROFILE = {
  legalName: "Les Saveurs du Cap Bon SARL",
  displayName: "Les Saveurs du Cap Bon",
  tagline: "Epicerie fine, Cap Bon",
  addressLines: ["Adresse pas encore renseignee", "Nabeul, Cap Bon"],
  phone: "+216 00 000 000",
  email: "contact@lesmillesaveursducapbon.com",
  website: "lesmillesaveursducapbon.com",
  currency: "TND",
  currencyNote: "Dinar tunisien, ecrit avec trois decimales",
  vatNumber: "Pas encore renseigne",
  freeDeliveryFrom: 200,
  standardDeliveryFee: 7.5,
  preparationDays: 1,
  themes: [
    { id: "th_pistache", name: "Pistache", state: "Utilisé" },
    { id: "th_amande", name: "Amande", state: "Reserve" },
    { id: "th_grenade", name: "Grenade", state: "Reserve" },
  ],
  deliveryZones: [
    { id: "dz_tunis", name: "Grand Tunis", fee: 7.5, days: "1 a 2 jours", cities: "Tunis, Ariana, Ben Arous, La Marsa" },
    { id: "dz_north", name: "Nord", fee: 8.5, days: "2 jours", cities: "Bizerte, Nabeul, Beja" },
    { id: "dz_sahel", name: "Sahel", fee: 9, days: "2 a 3 jours", cities: "Sousse, Monastir, Mahdia" },
    { id: "dz_south", name: "Sud", fee: 12, days: "3 jours", cities: "Sfax, Gabes, Djerba" },
  ],
};

export interface Bundle {
  id: string;
  name: string;
  kind: "bundle" | "recommendation" | "threshold" | "discount";
  description: string;
  productIds: string[];
  /** What the customer pays instead of the sum of the parts. */
  bundlePrice: number | null;
  active: boolean;
  timesShown: number;
  timesTaken: number;
  revenueAdded: number;
}

/**
 * Rules that raise the value of an order. Impact figures are demo data, and the
 * screen says so, because a rule that claims revenue it did not earn is worse
 * than no rule at all.
 */
export const BUNDLES: Bundle[] = [
  {
    id: "bd_pair", name: "Duo pistache", kind: "bundle",
    description: "Propose quand un client ajouté la creme de pistache et le dessert a la pistache. Le duo coute moins cher que les deux pris separement.",
    productIds: ["pr_pistachio_cream", "pr_pistachio_dessert"], bundlePrice: 99, active: true,
    timesShown: 214, timesTaken: 47, revenueAdded: 14053,
  },
  {
    id: "bd_gift", name: "Coffret cadeau avec assortiment de desserts", kind: "bundle",
    description: "Ajoute un assortiment de desserts au coffret gourmand a prix groupe pour les clients qui prennent plus d'un coffret.",
    productIds: ["pr_gourmet_box", "pr_dessert_assortment"], bundlePrice: 214, active: true,
    timesShown: 88, timesTaken: 19, revenueAdded: 20349,
  },
  {
    id: "bd_dairy", name: "Beurre avec chaque sélection laitière", kind: "recommendation",
    description: "Affiche sous la sélection laitière. Rien n'est ajouté automatiquement, le client choisit.",
    productIds: ["pr_dairy_sélection", "pr_artisan_butter"], bundlePrice: null, active: true,
    timesShown: 163, timesTaken: 38, revenueAdded: 4484,
  },
  {
    id: "bd_discovery", name: "Assortiment decouverte avec le coffret de desserts", kind: "recommendation",
    description: "Propose a la fin de la commande, avant le paiement.",
    productIds: ["pr_discovery_assortment", "pr_pistachio_dessert"], bundlePrice: null, active: false,
    timesShown: 41, timesTaken: 4, revenueAdded: 296,
  },
  {
    id: "bd_free", name: "Livraison offerte à partir de 200 TND", kind: "threshold",
    description: "Le client voit combien il lui manque pour atteindre la livraison offerte pendant qu'il choisit.",
    productIds: [], bundlePrice: null, active: true,
    timesShown: 402, timesTaken: 131, revenueAdded: 8940,
  },
  {
    id: "bd_ramadan", name: "Dix pour cent à partir de trois articles", kind: "discount",
    description: "Ne s'applique qu'a la gamme Ramadan, et s'arrete d'elle-même a la fin de la gamme.",
    productIds: ["pr_seasonal_jar", "pr_dessert_assortment", "pr_artisan_butter"], bundlePrice: null, active: false,
    timesShown: 0, timesTaken: 0, revenueAdded: 0,
  },
];

export interface BudgetLine {
  id: string;
  budgetId: string;
  label: string;
  planned: number;
  used: number;
  note: string | null;
}

export interface Budget {
  id: string;
  name: string;
  period: string;
  planned: number;
  used: number;
}

export const BUDGETS: Budget[] = [
  { id: "bg_marketing", name: "Marketing", period: "septembre 2026", planned: 4200, used: 3610 },
  { id: "bg_delivery", name: "Livraison", period: "septembre 2026", planned: 2600, used: 2489 },
  { id: "bg_operations", name: "Fonctionnement", period: "septembre 2026", planned: 3100, used: 1740 },
];

export const BUDGET_LINES: BudgetLine[] = [
  { id: "bl_ads_meta", budgetId: "bg_marketing", label: "Publicites Meta", planned: 2200, used: 2040, note: null },
  { id: "bl_ads_google", budgetId: "bg_marketing", label: "Google Ads", planned: 1400, used: 1310, note: "Formulaires de prospects uniquement" },
  { id: "bl_photo", budgetId: "bg_marketing", label: "Photographie produit", planned: 600, used: 260, note: null },
  { id: "bl_couriers", budgetId: "bg_delivery", label: "Tournees de livraison", planned: 2100, used: 2094, note: "Proche de la limite" },
  { id: "bl_packaging", budgetId: "bg_delivery", label: "Emballage", planned: 500, used: 395, note: null },
  { id: "bl_rent", budgetId: "bg_operations", label: "Loyer de l'atelier", planned: 1800, used: 1800, note: null },
  { id: "bl_wages", budgetId: "bg_operations", label: "Aide a temps partiel", planned: 900, used: 640, note: null },
  { id: "bl_tools", budgetId: "bg_operations", label: "Outils et reparations", planned: 400, used: 300, note: null },
];

export interface Lead {
  id: string;
  contactId: string;
  /** The same attribution the first conversation carries, so a card keeps its source. */
  attributionId: string;
  stage: "new" | "contacted" | "qualified" | "proposal" | "won" | "lost";
  value: number;
  ownerId: string | null;
  createdAt: string;
  nextTaskId: string | null;
  lostReason: string | null;
}

export const LEADS: Lead[] = [
  { id: "ld_01", contactId: "ct_rania", attributionId: "at_c01", stage: "qualified", value: 329.5, ownerId: "tm_sarra", createdAt: daysAgo(26), nextTaskId: "tk_02", lostReason: null },
  { id: "ld_02", contactId: "ct_slim", attributionId: "at_c03", stage: "contacted", value: 124, ownerId: "tm_mouna", createdAt: daysAgo(1), nextTaskId: "tk_03", lostReason: null },
  { id: "ld_03", contactId: "ct_yosr", attributionId: "at_c02", stage: "proposal", value: 89.5, ownerId: "tm_khaled", createdAt: daysAgo(19), nextTaskId: null, lostReason: null },
  { id: "ld_04", contactId: "ct_amine", attributionId: "at_c04", stage: "new", value: 1040, ownerId: null, createdAt: daysAgo(1), nextTaskId: "tk_04", lostReason: null },
  { id: "ld_05", contactId: "ct_leila", attributionId: "at_c10", stage: "proposal", value: 7520, ownerId: "tm_khaled", createdAt: daysAgo(9), nextTaskId: "tk_05", lostReason: null },
  { id: "ld_06", contactId: "ct_mehdi", attributionId: "at_c07", stage: "qualified", value: 888, ownerId: "tm_khaled", createdAt: daysAgo(22), nextTaskId: "tk_08", lostReason: null },
  { id: "ld_07", contactId: "ct_hatem", attributionId: "at_c09", stage: "new", value: 156, ownerId: null, createdAt: daysAgo(2), nextTaskId: "tk_06", lostReason: null },
  { id: "ld_08", contactId: "ct_karim", attributionId: "at_c13", stage: "new", value: 412, ownerId: null, createdAt: daysAgo(4), nextTaskId: "tk_07", lostReason: null },
  { id: "ld_09", contactId: "ct_olfa", attributionId: "at_c06", stage: "contacted", value: 205.5, ownerId: "tm_mouna", createdAt: daysAgo(11), nextTaskId: null, lostReason: null },
  { id: "ld_10", contactId: "ct_nadia", attributionId: "at_c05", stage: "won", value: 304, ownerId: "tm_yassine", createdAt: daysAgo(34), nextTaskId: null, lostReason: null },
  { id: "ld_11", contactId: "ct_ines", attributionId: "at_c08", stage: "won", value: 2080, ownerId: "tm_sarra", createdAt: daysAgo(41), nextTaskId: null, lostReason: null },
  { id: "ld_12", contactId: "ct_walid", attributionId: "at_c12", stage: "lost", value: 412, ownerId: "tm_yassine", createdAt: daysAgo(8), nextTaskId: "tk_09", lostReason: "Prix au-dessus du budget" },
  { id: "ld_13", contactId: "ct_sonia", attributionId: "at_c11", stage: "contacted", value: 124, ownerId: "tm_mouna", createdAt: daysAgo(48), nextTaskId: null, lostReason: null },
];

export const LOST_REASONS = [
  { reason: "Prix au-dessus du budget", count: 6 },
  { reason: "Ne repond plus", count: 4 },
  { reason: "Voulait une date de livraison impossible a tenir", count: 3 },
  { reason: "A acheté ailleurs", count: 2 },
];
