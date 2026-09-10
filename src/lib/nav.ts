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
    title: "Store",
    items: [
      { href: "/dashboard", label: "Dashboard", glyph: "⌂" },
      { href: "/orders", label: "Orders", glyph: "◈", badge: "orders" },
      { href: "/products", label: "Products", glyph: "▦" },
      { href: "/upsells", label: "Up and cross sells", glyph: "↗" },
      { href: "/statistics", label: "Statistics", glyph: "▥" },
      { href: "/calculator", label: "Calculator", glyph: "＋" },
      { href: "/budget", label: "Budget manager", glyph: "◒" },
      { href: "/team", label: "Team", glyph: "◎" },
      { href: "/store", label: "Store", glyph: "▱" },
    ],
  },
  {
    title: "Customer flow",
    items: [
      { href: "/inbox", label: "Inbox", glyph: "✦", badge: "inbox" },
      { href: "/contacts", label: "Contacts", glyph: "◌" },
      { href: "/pipeline", label: "Pipeline", glyph: "⌁" },
      { href: "/tasks", label: "Tasks", glyph: "✓", badge: "tasks" },
      { href: "/integrations", label: "Integrations", glyph: "⌘", badge: "integrations" },
    ],
  },
  {
    title: "Workspace",
    items: [
      { href: "/settings", label: "Settings", glyph: "⚙" },
      { href: "/help", label: "Need help?", glyph: "?" },
    ],
  },
];

/** The five destinations that fit across the bottom of a phone. */
export const MOBILE_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", glyph: "⌂" },
  { href: "/orders", label: "Orders", glyph: "◈", badge: "orders" },
  { href: "/inbox", label: "Inbox", glyph: "✦", badge: "inbox" },
  { href: "/tasks", label: "Tasks", glyph: "✓", badge: "tasks" },
  { href: "/integrations", label: "Setup", glyph: "⌘", badge: "integrations" },
];
