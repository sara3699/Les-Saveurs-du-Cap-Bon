import { CONNECTIONS, PRODUCTS, TAGS, TEAM, TEAM_CONVERSION_METRICS } from "@/lib/mock/core";
import { BUDGETS, BUDGET_LINES, BUNDLES, LEADS, LOST_REASONS } from "@/lib/mock/operations";
import { ORDERS, ORDER_ATTRIBUTIONS, TASKS } from "@/lib/mock/commerce";
import {
  CONTACTS,
  CONVERSATIONS,
  CONVERSATION_ATTRIBUTIONS,
  MESSAGES,
} from "@/lib/mock/people";
import type { SourceAttribution } from "@/lib/domain/types";
import type {
  ContactRepository,
  ConversationFilter,
  ConversationRepository,
  IntegrationRepository,
  OrderFilter,
  OrderRepository,
  Repositories,
  WorkspaceRepository,
} from "./types";

const ALL_ATTRIBUTIONS: SourceAttribution[] = [
  ...CONVERSATION_ATTRIBUTIONS,
  ...ORDER_ATTRIBUTIONS,
];

const attributionById = new Map(ALL_ATTRIBUTIONS.map((a) => [a.id, a]));

function matches(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

const conversations: ConversationRepository = {
  async list(filter: ConversationFilter = {}) {
    const contactName = new Map(CONTACTS.map((c) => [c.id, c.name]));
    return CONVERSATIONS.filter((conversation) => {
      const attribution = attributionById.get(conversation.attributionId);
      if (!attribution) return false;
      if (filter.channels?.length && !filter.channels.includes(attribution.channelId)) return false;
      if (filter.statuses?.length && !filter.statuses.includes(conversation.status)) return false;
      if (filter.unreadOnly && conversation.unreadCount === 0) return false;
      if (filter.assigneeId !== undefined && conversation.assigneeId !== filter.assigneeId) return false;
      if (filter.search) {
        const name = contactName.get(conversation.contactId) ?? "";
        if (!matches(name, filter.search) && !matches(conversation.subject, filter.search)) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
  },
  async byId(id) {
    return CONVERSATIONS.find((c) => c.id === id) ?? null;
  },
  async messages(conversationId) {
    return MESSAGES.filter((m) => m.conversationId === conversationId).sort(
      (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
    );
  },
};

const contacts: ContactRepository = {
  async list() {
    return [...CONTACTS].sort((a, b) => a.name.localeCompare(b.name));
  },
  async byId(id) {
    return CONTACTS.find((c) => c.id === id) ?? null;
  },
  async duplicates() {
    const buckets = new Map<string, string[]>();
    for (const contact of CONTACTS) {
      for (const value of [contact.phone, contact.email]) {
        if (!value) continue;
        const key = value.toLowerCase();
        buckets.set(key, [...(buckets.get(key) ?? []), contact.id]);
      }
    }
    return [...buckets.entries()]
      .filter(([, ids]) => ids.length > 1)
      .map(([value, contactIds]) => ({ value, contactIds }));
  },
};

const orders: OrderRepository = {
  async list(filter: OrderFilter = {}) {
    const contactName = new Map(CONTACTS.map((c) => [c.id, c.name]));
    const cutoff = filter.sinceDays
      ? Date.now() - filter.sinceDays * 86_400_000
      : null;

    return ORDERS.filter((order) => {
      const attribution = attributionById.get(order.attributionId);
      if (!attribution) return false;
      if (filter.channels?.length && !filter.channels.includes(attribution.channelId)) return false;
      if (filter.paymentStatuses?.length && !filter.paymentStatuses.includes(order.paymentStatus)) return false;
      if (filter.deliveryStatuses?.length && !filter.deliveryStatuses.includes(order.deliveryStatus)) return false;
      if (filter.assigneeId !== undefined && order.assigneeId !== filter.assigneeId) return false;
      if (filter.minTotal !== undefined && order.total < filter.minTotal) return false;
      if (cutoff && new Date(order.placedAt).getTime() < cutoff) return false;
      if (filter.search) {
        const name = contactName.get(order.contactId) ?? "";
        if (!matches(order.reference, filter.search) && !matches(name, filter.search)) return false;
      }
      return true;
    });
  },
  async byReference(référence) {
    return ORDERS.find((o) => o.reference === référence) ?? null;
  },
};

const integrations: IntegrationRepository = {
  async list() {
    return CONNECTIONS;
  },
  async byId(id) {
    return CONNECTIONS.find((c) => c.id === id) ?? null;
  },
};

const workspace: WorkspaceRepository = {
  async attributions() {
    return ALL_ATTRIBUTIONS;
  },
  async team() {
    return TEAM;
  },
  async conversionMetrics() {
    return TEAM_CONVERSION_METRICS;
  },
  async tags() {
    return TAGS;
  },
  async products() {
    return PRODUCTS;
  },
  async tasks() {
    return TASKS;
  },
  async leads() {
    return LEADS;
  },
  async budgets() {
    return { budgets: BUDGETS, lines: BUDGET_LINES };
  },
  async bundles() {
    return BUNDLES;
  },
  async lostReasons() {
    return LOST_REASONS;
  },
};

export const mockRepositories: Repositories = {
  conversations,
  contacts,
  orders,
  integrations,
  workspace,
};
