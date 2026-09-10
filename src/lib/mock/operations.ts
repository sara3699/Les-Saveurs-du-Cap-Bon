import { daysAgo } from "./time";

/** The shop's own details, edited on the Store screen. */
export const STORE_PROFILE = {
  legalName: "Les Saveurs du Cap Bon SARL",
  displayName: "Les Saveurs du Cap Bon",
  tagline: "Epicerie fine, Cap Bon",
  addressLines: ["Address not set yet", "Nabeul, Cap Bon"],
  phone: "+216 00 000 000",
  email: "contact@lesmillesaveursducapbon.com",
  website: "lesmillesaveursducapbon.com",
  currency: "TND",
  currencyNote: "Tunisian dinar, written with three decimals",
  vatNumber: "Not set yet",
  freeDeliveryFrom: 200,
  standardDeliveryFee: 7.5,
  preparationDays: 1,
  themes: [
    { id: "th_pistache", name: "Pistache", state: "In use" },
    { id: "th_amande", name: "Amande", state: "Placeholder" },
    { id: "th_grenade", name: "Grenade", state: "Placeholder" },
  ],
  deliveryZones: [
    { id: "dz_tunis", name: "Grand Tunis", fee: 7.5, days: "1 to 2 days", cities: "Tunis, Ariana, Ben Arous, La Marsa" },
    { id: "dz_north", name: "North", fee: 8.5, days: "2 days", cities: "Bizerte, Nabeul, Beja" },
    { id: "dz_sahel", name: "Sahel", fee: 9, days: "2 to 3 days", cities: "Sousse, Monastir, Mahdia" },
    { id: "dz_south", name: "South", fee: 12, days: "3 days", cities: "Sfax, Gabes, Djerba" },
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
    id: "bd_pair", name: "Pistachio pair together", kind: "bundle",
    description: "Offered when someone adds pistachio cream and the pistachio dessert. The pair costs less than the two on their own.",
    productIds: ["pr_pistachio_cream", "pr_pistachio_dessert"], bundlePrice: 99, active: true,
    timesShown: 214, timesTaken: 47, revenueAdded: 14053,
  },
  {
    id: "bd_gift", name: "Gift box with dessert assortment", kind: "bundle",
    description: "Adds a dessert assortment to the gourmet box at a bundle price for customers buying more than one box.",
    productIds: ["pr_gourmet_box", "pr_dessert_assortment"], bundlePrice: 214, active: true,
    timesShown: 88, timesTaken: 19, revenueAdded: 20349,
  },
  {
    id: "bd_dairy", name: "Butter with every dairy selection", kind: "recommendation",
    description: "Shown under the dairy selection. Nothing is added automatically, the customer chooses.",
    productIds: ["pr_dairy_selection", "pr_artisan_butter"], bundlePrice: null, active: true,
    timesShown: 163, timesTaken: 38, revenueAdded: 4484,
  },
  {
    id: "bd_discovery", name: "Discovery assortment with the dessert box", kind: "recommendation",
    description: "Suggested at the end of the order, before payment.",
    productIds: ["pr_discovery_assortment", "pr_pistachio_dessert"], bundlePrice: null, active: false,
    timesShown: 41, timesTaken: 4, revenueAdded: 296,
  },
  {
    id: "bd_free", name: "Free delivery from 200 TND", kind: "threshold",
    description: "The customer sees how much is left to reach free delivery while they are choosing.",
    productIds: [], bundlePrice: null, active: true,
    timesShown: 402, timesTaken: 131, revenueAdded: 8940,
  },
  {
    id: "bd_ramadan", name: "Ten percent on three or more", kind: "discount",
    description: "Runs on the Ramadan range only, and stops on its own when the range ends.",
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
  { id: "bg_marketing", name: "Marketing", period: "September 2026", planned: 4200, used: 3610 },
  { id: "bg_delivery", name: "Delivery", period: "September 2026", planned: 2600, used: 2489 },
  { id: "bg_operations", name: "Operations", period: "September 2026", planned: 3100, used: 1740 },
];

export const BUDGET_LINES: BudgetLine[] = [
  { id: "bl_ads_meta", budgetId: "bg_marketing", label: "Meta ads", planned: 2200, used: 2040, note: null },
  { id: "bl_ads_google", budgetId: "bg_marketing", label: "Google Ads", planned: 1400, used: 1310, note: "Lead forms only" },
  { id: "bl_photo", budgetId: "bg_marketing", label: "Product photography", planned: 600, used: 260, note: null },
  { id: "bl_couriers", budgetId: "bg_delivery", label: "Courier runs", planned: 2100, used: 2094, note: "Close to the limit" },
  { id: "bl_packaging", budgetId: "bg_delivery", label: "Packaging", planned: 500, used: 395, note: null },
  { id: "bl_rent", budgetId: "bg_operations", label: "Workshop rent", planned: 1800, used: 1800, note: null },
  { id: "bl_wages", budgetId: "bg_operations", label: "Part time help", planned: 900, used: 640, note: null },
  { id: "bl_tools", budgetId: "bg_operations", label: "Tools and repairs", planned: 400, used: 300, note: null },
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
  { id: "ld_12", contactId: "ct_walid", attributionId: "at_c12", stage: "lost", value: 412, ownerId: "tm_yassine", createdAt: daysAgo(8), nextTaskId: "tk_09", lostReason: "Price above budget" },
  { id: "ld_13", contactId: "ct_sonia", attributionId: "at_c11", stage: "contacted", value: 124, ownerId: "tm_mouna", createdAt: daysAgo(48), nextTaskId: null, lostReason: null },
];

export const LOST_REASONS = [
  { reason: "Price above budget", count: 6 },
  { reason: "Went quiet", count: 4 },
  { reason: "Wanted a delivery date we could not hit", count: 3 },
  { reason: "Bought elsewhere", count: 2 },
];
