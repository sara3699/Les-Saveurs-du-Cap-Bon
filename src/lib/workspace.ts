import { getRepositories } from "@/lib/repositories";
import { buildAttributionIndex, resolveSource } from "@/lib/domain/attribution";
import { STORE, TEAM } from "@/lib/mock/core";
import { DEMO_NOW } from "@/lib/mock/time";
import { isOverdue } from "@/lib/format";
import type { HealthNotice, SearchEntry } from "@/components/shell/AppChrome";

/**
 * Everything the shell needs, gathered once on the server. Relative timestamps
 * and totals are computed here so client components receive plain strings.
 */
export async function loadChrome() {
  const repos = getRepositories();
  const [conversations, contacts, orders, connections, tasks] = await Promise.all([
    repos.conversations.list(),
    repos.contacts.list(),
    repos.orders.list({ sinceDays: 40 }),
    repos.integrations.list(),
    repos.workspace.tasks(),
  ]);

  // Read last, on purpose, and never alongside the records above.
  //
  // A record and its attribution row are written in one transaction, so the two
  // never disagree on disk. Separate queries, though, each see the database at
  // their own moment. An order the website posts mid-read would land in the
  // orders query while missing from an attributions query that had already gone
  // out, and resolveSource is right to throw at an order whose source it cannot
  // find. Asking afterwards keeps this snapshot no older than the records it has
  // to explain. The cost is one round trip; the rule stays untouched.
  //
  // Ordering alone is not enough. Next.js memoises fetch GETs across the whole
  // tree, so without the matching change in the repositories this line can still
  // be handed the snapshot the page took earlier. See FRESH_READS there.
  const attributions = await repos.workspace.attributions();

  const index = buildAttributionIndex(attributions, connections);
  const contactName = new Map(contacts.map((c) => [c.id, c.name]));

  const startOfDay = new Date(DEMO_NOW);
  startOfDay.setHours(0, 0, 0, 0);
  const ordersToday = orders.filter((o) => new Date(o.placedAt) >= startOfDay).length;

  const unread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
  const openTasks = tasks.filter((t) => !t.completedAt && isOverdue(t.dueAt, DEMO_NOW)).length;
  const brokenConnections = connections.filter(
    (c) => c.status === "error" || c.status === "warning",
  );

  const notices: HealthNotice[] = [
    ...brokenConnections.map((c) => ({
      id: `cn_${c.id}`,
      title:
        c.status === "error"
          ? `${c.accountLabel} ne reçoit plus`
          : `${c.accountLabel} est a vérifier`,
      detail: c.lastErrorMessage ?? "Ouvrez le connecteur pour voir ce qui a change.",
      href: "/integrations",
      severity: c.status === "error" ? ("error" as const) : ("warning" as const),
    })),
  ];

  const unassigned = conversations.filter((c) => !c.assigneeId && c.status !== "resolved");
  if (unassigned.length > 0) {
    notices.push({
      id: "unassigned",
      title: `${unassigned.length} demandes sans responsable`,
      detail: "La plus ancienne attend depuis son arrivée.",
      href: "/inbox",
      severity: "warning",
    });
  }
  if (openTasks > 0) {
    notices.push({
      id: "overdue",
      title: `${openTasks} relances sont en retard`,
      detail: "Ouvrez Tâches pour voir qui s'en occupe.",
      href: "/tasks",
      severity: "warning",
    });
  }

  const search: SearchEntry[] = [
    ...contacts.map((c) => ({
      id: `s_${c.id}`,
      kind: "Contact" as const,
      label: c.name,
      sub: [c.city, c.phone].filter(Boolean).join(", "),
      href: `/contacts/${c.id}`,
      channelId: c.latestTouchChannel,
    })),
    ...conversations.map((c) => ({
      id: `s_${c.id}`,
      kind: "Conversation" as const,
      label: contactName.get(c.contactId) ?? "Inconnu",
      sub: c.subject,
      href: `/inbox?c=${c.id}`,
      channelId: resolveSource(c.attributionId, index).channelId,
    })),
    ...orders.slice(0, 60).map((o) => ({
      id: `s_${o.id}`,
      kind: "Order" as const,
      label: o.reference,
      sub: contactName.get(o.contactId) ?? "Inconnu",
      href: `/orders?q=${o.reference}`,
      channelId: resolveSource(o.attributionId, index).channelId,
    })),
  ];

  const owner = TEAM.find((m) => m.role === "owner")!;

  return {
    storeName: STORE.name,
    storeCity: STORE.city,
    storeInitials: STORE.initials,
    userName: owner.name,
    userInitials: owner.initials,
    userRole: "Propriétaire",
    counts: {
      inbox: unread,
      orders: ordersToday,
      tasks: openTasks,
      integrations: brokenConnections.length,
    },
    search,
    notices,
  };
}
