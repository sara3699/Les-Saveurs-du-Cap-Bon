import { CONNECTIONS, PRODUCTS, TAGS, TEAM, TEAM_CONVERSION_METRICS } from "@/lib/mock/core";
import { BUDGETS, BUDGET_LINES, BUNDLES, LEADS, LOST_REASONS } from "@/lib/mock/operations";
import { ORDERS, ORDER_ATTRIBUTIONS, TASKS } from "@/lib/mock/commerce";
import {
  CONTACTS,
  CONVERSATIONS,
  CONVERSATION_ATTRIBUTIONS,
  MESSAGES,
} from "@/lib/mock/people";
import { RECEIPTS, RECEIPT_EVENTS } from "@/lib/mock/receipts";
import type { SourceAttribution } from "@/lib/domain/types";
import type {
  ContactRepository,
  ConversationFilter,
  ConversationRepository,
  IntegrationRepository,
  OrderFilter,
  OrderRepository,
  ReceiptFilter,
  ReceiptRepository,
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

const receipts: ReceiptRepository = {
  async list(filter: ReceiptFilter = {}) {
    return RECEIPTS.filter((receipt) => {
      if (filter.statuses?.length && !filter.statuses.includes(receipt.status)) return false;
      if (filter.categories?.length && !filter.categories.includes(receipt.category)) return false;
      if (filter.merchantKey && receipt.merchantKey !== filter.merchantKey) return false;
      if (filter.uploadedById && receipt.uploadedById !== filter.uploadedById) return false;
      if (filter.from && (receipt.purchaseDate ?? "") < filter.from) return false;
      if (filter.to && (receipt.purchaseDate ?? "9999-12-31") > filter.to) return false;
      if (filter.search) {
        const haystack = [receipt.merchantName, receipt.receiptNumber, receipt.note]
          .filter(Boolean)
          .join(" ");
        if (!matches(haystack, filter.search)) return false;
      }
      return true;
    });
  },
  async byId(id) {
    return RECEIPTS.find((receipt) => receipt.id === id) ?? null;
  },
  async fingerprints() {
    return RECEIPTS.map((receipt) => ({
      id: receipt.id,
      // The demonstration set has no files behind it, so there is no hash to compare.
      fileHash: null,
      merchantName: receipt.merchantName,
      receiptNumber: receipt.receiptNumber,
      purchaseDate: receipt.purchaseDate,
      totalAmount: receipt.totalAmount,
      currency: receipt.currency,
    }));
  },
  async events(receiptId) {
    return RECEIPT_EVENTS[receiptId] ?? [];
  },
};

export const mockRepositories: Repositories = {
  conversations,
  contacts,
  orders,
  integrations,
  workspace,
  receipts,
};
