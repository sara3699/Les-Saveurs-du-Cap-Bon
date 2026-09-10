export interface NavItem {
  href: string;
  label: string;
  glyph: string;
  /** Key of the count passed in from the server, when the item carries one. */
  badge?: "inbox" | "orders" | "tasks" | "integrations";
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

/**
 * Two groups, because the owner thinks in two modes: running the shop, and
 * answering the people who write to it. Settings sits on its own so it is never
 * hunted for inside either.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Boutique",
    items: [
      { href: "/dashboard", label: "Tableau de bord", glyph: "⌂" },
      { href: "/orders", label: "Commandes", glyph: "◈", badge: "orders" },
      { href: "/products", label: "Produits", glyph: "▦" },
      { href: "/upsells", label: "Ventes additionnelles", glyph: "↗" },
      { href: "/statistics", label: "Statistiques", glyph: "▥" },
      { href: "/calculator", label: "Calculateur", glyph: "＋" },
      { href: "/budget", label: "Gestion du budget", glyph: "◒" },
      { href: "/team", label: "Équipe", glyph: "◎" },
      { href: "/store", label: "Boutique", glyph: "▱" },
    ],
  },
  {
    title: "Parcours client",
    items: [
      { href: "/inbox", label: "Boîte de réception", glyph: "✦", badge: "inbox" },
      { href: "/contacts", label: "Contacts", glyph: "◌" },
      { href: "/pipeline", label: "Prospects", glyph: "⌁" },
      { href: "/tasks", label: "Tâches", glyph: "✓", badge: "tasks" },
      { href: "/integrations", label: "Intégrations", glyph: "⌘", badge: "integrations" },
    ],
  },
  {
    title: "Espace de travail",
    items: [
      { href: "/settings", label: "Paramètres", glyph: "⚙" },
      { href: "/help", label: "Besoin d’aide ?", glyph: "?" },
    ],
  },
];

/** The five destinations that fit across the bottom of a phone. */
export const MOBILE_NAV: NavItem[] = [
  { href: "/dashboard", label: "Accueil", glyph: "⌂" },
  { href: "/orders", label: "Commandes", glyph: "◈", badge: "orders" },
  { href: "/inbox", label: "Messages", glyph: "✦", badge: "inbox" },
  { href: "/tasks", label: "Tâches", glyph: "✓", badge: "tasks" },
  { href: "/integrations", label: "Connexion", glyph: "⌘", badge: "integrations" },
];
