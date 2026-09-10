"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { MOBILE_NAV, NAV_GROUPS, type NavItem } from "@/lib/nav";
import { ChannelDot } from "@/components/ui/badges";
import type { ChannelId } from "@/lib/domain/types";

export interface SearchEntry {
  id: string;
  kind: "Contact" | "Conversation" | "Order";
  label: string;
  sub: string;
  href: string;
  channelId: ChannelId;
}

export interface HealthNotice {
  id: string;
  title: string;
  detail: string;
  href: string;
  severity: "warning" | "error";
}

export interface ChromeProps {
  storeName: string;
  storeCity: string;
  storeInitials: string;
  userName: string;
  userInitials: string;
  userRole: string;
  counts: Partial<Record<"inbox" | "orders" | "tasks" | "integrations", number>>;
  /** Screens this person's role cannot open, hidden from both navigations. */
  hiddenHrefs: string[];
  /** False for the demonstration door, where the database refuses every write. */
  canWrite: boolean;
  search: SearchEntry[];
  notices: HealthNotice[];
  /** Server action that clears the demo session and returns to the sign-in screen. */
  signOut: () => void;
  children: React.ReactNode;
}

/**
 * SearchEntry.kind is a set of ids the server side sets. These are the words a
 * reader sees next to a search result.
 */
const KIND_LABEL: Record<SearchEntry["kind"], string> = {
  Contact: "Contact",
  Conversation: "Conversation",
  Order: "Commande",
};

function badgeValue(item: NavItem, counts: ChromeProps["counts"]): number | null {
  if (!item.badge) return null;
  const value = counts[item.badge];
  return value && value > 0 ? value : null;
}

export function AppChrome(props: ChromeProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [panel, setPanel] = useState<"none" | "search" | "notices" | "user">("none");
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  // Panels close when the reader goes somewhere, which is a click, not a side
  // effect of the route changing. Closing them here keeps render free of state
  // updates and keeps the back button behaving.
  const closeAll = () => {
    setMenuOpen(false);
    setPanel("none");
  };

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return props.search
      .filter((e) => e.label.toLowerCase().includes(q) || e.sub.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, props.search]);

  const errorCount = props.notices.filter((n) => n.severity === "error").length;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside
        className={`${menuOpen ? "block" : "hidden"} os-glass-rail p-3 lg:block`}
      >
        <div className="sticky top-3 flex flex-col gap-5">
          <div className="os-rail-brand flex items-center gap-2.5 rounded-[var(--radius-md)] p-2.5">
            <span className="os-rail-mark grid h-9 w-9 shrink-0 place-items-center rounded-[10px] font-display text-xs font-bold text-white">
              {props.storeInitials}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-semibold leading-tight text-white">{props.storeName}</span>
              <span className="block text-[11px] text-white/65">{props.storeCity} · espace du propriétaire</span>
            </span>
          </div>

          <div className="os-rail-caption px-2">Centre de commande</div>
          <nav aria-label="Navigation principale" className="os-rail-nav">
            {NAV_GROUPS.map((group) => (
              <div key={group.title} className="mb-4">
                <p className="os-rail-group px-2 pb-1.5 pt-1">{group.title}</p>
                {group.items.filter((item) => !props.hiddenHrefs.includes(item.href)).map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const count = badgeValue(item, props.counts);
                  const warn = item.badge === "integrations" && errorCount > 0;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      onClick={closeAll}
                      className={`os-rail-item flex items-center justify-between gap-2 rounded-[var(--radius-sm)] px-2 py-2 text-[13px] ${
                        active ? "font-semibold text-white" : "text-white/72"
                      }`}
                      data-active={active}
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        <span className="os-rail-icon grid h-6 w-6 shrink-0 place-items-center rounded-[7px] text-[13px]" aria-hidden>
                          {item.glyph}
                        </span>
                        <span className="truncate">{item.label}</span>
                      </span>
                      {warn ? (
                        <span
                          aria-label={`${errorCount} problème${errorCount > 1 ? "s" : ""} de connexion`}
                          className="h-1.5 w-1.5 rounded-full bg-danger"
                        />
                      ) : count ? (
                        <span
                          className={`os-num rounded-full px-1.5 text-[11px] ${
                            active ? "bg-white/20 text-white" : "bg-white/12 text-white/85"
                          }`}
                        >
                          {count}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
          <div className="rounded-[var(--radius-md)] border border-white/12 bg-white/7 px-3 py-2.5 text-[11px] leading-relaxed text-white/65">
            <span className="mb-1 block font-semibold text-white/90">Un espace, tous les canaux</span>
            Les commandes du site, de WhatsApp, Instagram, Facebook, Google et du comptoir gardent leur source jusqu'au paiement.
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col pb-16 lg:pb-0">
        <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-line bg-canvas/85 px-3 py-2.5 backdrop-blur sm:px-5">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            className="rounded-[var(--radius-md)] border border-line bg-surface px-2.5 py-2 text-xs font-semibold lg:hidden"
          >
            Menu
          </button>

          <div className="relative min-w-0 flex-1">
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPanel("search");
              }}
              onFocus={() => setPanel("search")}
              placeholder="Rechercher un client, une conversation ou une commande"
              aria-label="Rechercher"
              className="w-full rounded-[var(--radius-md)] border border-line bg-surface px-3 py-2 text-[13px] placeholder:text-faint"
            />
            {panel === "search" && query.trim().length >= 2 ? (
              <div className="absolute left-0 right-0 top-11 z-30 overflow-hidden rounded-[var(--radius-md)] border border-line bg-surface shadow-[var(--shadow-card)]">
                {results.length === 0 ? (
                  <p className="px-3 py-3 text-[13px] text-muted">
                    Aucun résultat pour « {query.trim()} » dans les données d'exemple.
                  </p>
                ) : (
                  results.map((r) => (
                    <Link
                      key={r.id}
                      href={r.href}
                      onClick={closeAll}
                      className="flex items-center gap-2.5 border-b border-line px-3 py-2 last:border-b-0 hover:bg-surface-2"
                    >
                      <ChannelDot channelId={r.channelId} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium">{r.label}</span>
                        <span className="block truncate text-[11.5px] text-muted">{r.sub}</span>
                      </span>
                      <span className="os-label">{KIND_LABEL[r.kind]}</span>
                    </Link>
                  ))
                )}
              </div>
            ) : null}
          </div>

          <Link
            href="/help"
            className="hidden rounded-[var(--radius-md)] border border-line bg-surface px-3 py-2 text-xs font-semibold sm:block"
          >
            Aide
          </Link>

          <div className="relative">
            <button
              type="button"
              onClick={() => setPanel(panel === "notices" ? "none" : "notices")}
              aria-expanded={panel === "notices"}
              className="relative rounded-[var(--radius-md)] border border-line bg-surface px-3 py-2 text-xs font-semibold"
            >
              Alertes
              {props.notices.length > 0 ? (
                <span
                  className={`absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-bold text-white ${
                    errorCount > 0 ? "bg-danger" : "bg-accent text-accent-ink"
                  }`}
                >
                  {props.notices.length}
                </span>
              ) : null}
            </button>
            {panel === "notices" ? (
              <div className="absolute right-0 top-11 z-30 w-[300px] overflow-hidden rounded-[var(--radius-md)] border border-line bg-surface shadow-[var(--shadow-card)]">
                {props.notices.length === 0 ? (
                  <p className="px-3 py-3 text-[13px] text-muted">Rien ne demande votre attention.</p>
                ) : (
                  props.notices.map((n) => (
                    <Link
                      key={n.id}
                      href={n.href}
                      onClick={closeAll}
                      className="flex gap-2.5 border-b border-line px-3 py-2.5 last:border-b-0 hover:bg-surface-2"
                    >
                      <span
                        className={`mt-0.5 w-0.5 shrink-0 self-stretch rounded ${
                          n.severity === "error" ? "bg-danger" : "bg-accent"
                        }`}
                      />
                      <span>
                        <span className="block text-[13px] font-semibold">{n.title}</span>
                        <span className="block text-[11.5px] text-muted">{n.detail}</span>
                      </span>
                    </Link>
                  ))
                )}
              </div>
            ) : null}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setPanel(panel === "user" ? "none" : "user")}
              aria-expanded={panel === "user"}
              className="flex items-center gap-2 rounded-[var(--radius-md)] border border-line bg-surface py-1.5 pl-1.5 pr-3 text-[13px]"
            >
              <span className="grid h-6 w-6 place-items-center rounded-full bg-accent text-[11px] font-bold text-accent-ink">
                {props.userInitials}
              </span>
              <span className="hidden sm:inline">{props.userName}</span>
            </button>
            {panel === "user" ? (
              <div className="absolute right-0 top-11 z-30 w-[248px] rounded-[var(--radius-md)] border border-line bg-surface p-3 shadow-[var(--shadow-card)]">
                <p className="text-[13px] font-semibold">{props.userName}</p>
                <p className="text-[11.5px] text-muted">{props.userRole}, {props.storeName}</p>
                <div className="mt-3 flex flex-col gap-1.5">
                  {props.hiddenHrefs.includes("/settings") ? null : (
                    <Link href="/settings" onClick={closeAll} className="rounded-[var(--radius-sm)] border border-line px-2.5 py-1.5 text-[13px] hover:bg-surface-2">
                      Paramètres
                    </Link>
                  )}
                  <form action={props.signOut}>
                    <button
                      type="submit"
                      className="w-full rounded-[var(--radius-sm)] border border-line px-2.5 py-1.5 text-left text-[13px] hover:bg-surface-2"
                    >
                      Changer de personne
                    </button>
                  </form>
                  <span className="rounded-[var(--radius-sm)] border border-line bg-surface-2 px-2.5 py-1.5 text-[12px] text-muted">
                    {props.canWrite
                      ? "Compte réel. Ce que vous faites ici est enregistré."
                      : "Entrée de démonstration. Vous pouvez tout consulter, rien n'est enregistré."}
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        </header>

        {panel !== "none" ? (
          <button
            type="button"
            aria-label="Fermer le panneau ouvert"
            onClick={() => setPanel("none")}
            className="fixed inset-0 z-10 cursor-default"
          />
        ) : null}

        <main className="min-w-0 flex-1 px-3 py-4 sm:px-5 sm:py-6">{props.children}</main>
      </div>

      <nav
        aria-label="Navigation principale, compacte"
        className="fixed bottom-0 left-0 right-0 z-20 grid grid-cols-5 border-t border-line bg-surface lg:hidden"
      >
        {MOBILE_NAV.filter((item) => !props.hiddenHrefs.includes(item.href)).map((item) => {
          const active = pathname.startsWith(item.href);
          const count = badgeValue(item, props.counts);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              onClick={closeAll}
              className={`flex flex-col items-center gap-0.5 py-2 text-[11px] ${
                active ? "font-semibold text-primary" : "text-muted"
              }`}
            >
              <span>{item.label}</span>
              {count ? <span className="os-num text-[10px] text-primary">{count}</span> : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
