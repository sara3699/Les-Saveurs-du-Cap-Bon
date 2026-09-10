import { describe, expect, it } from "vitest";
import { CONNECTIONS, PRODUCTS, TAGS, TEAM } from "./core";
import { ORDERS, TASKS } from "./commerce";
import { CONTACTS, CONVERSATIONS, MESSAGES } from "./people";
import { CHANNEL_ORDER } from "@/lib/domain/channels";
import { buildAttributionIndex, resolveSource } from "@/lib/domain/attribution";
import { CONVERSATION_ATTRIBUTIONS } from "./people";
import { ORDER_ATTRIBUTIONS } from "./commerce";

const index = buildAttributionIndex(
  [...CONVERSATION_ATTRIBUTIONS, ...ORDER_ATTRIBUTIONS],
  CONNECTIONS,
);

/**
 * The demo has to be rich enough to judge the product on. These are the numbers
 * the brief asked for, checked so a later edit cannot quietly thin them out.
 */
describe("the demo workspace", () => {
  it("has enough of everything to be worth looking at", () => {
    expect(CONTACTS.length).toBeGreaterThanOrEqual(12);
    expect(CONVERSATIONS.length).toBeGreaterThanOrEqual(18);
    expect(MESSAGES.length).toBeGreaterThanOrEqual(30);
    expect(TASKS.length).toBeGreaterThanOrEqual(12);
    expect(TAGS.length).toBeGreaterThanOrEqual(8);
    expect(TEAM.length).toBeGreaterThanOrEqual(4);
    expect(PRODUCTS.length).toBeGreaterThanOrEqual(8);
  });

  it("covers all six sources in the conversation list", () => {
    const used = new Set(
      CONVERSATIONS.map((c) => resolveSource(c.attributionId, index).channelId),
    );
    for (const channelId of CHANNEL_ORDER) expect(used.has(channelId)).toBe(true);
  });

  it("covers all six sources in the order list", () => {
    const used = new Set(ORDERS.map((o) => resolveSource(o.attributionId, index).channelId));
    for (const channelId of CHANNEL_ORDER) expect(used.has(channelId)).toBe(true);
  });

  it("shows connectors in a working, a half done and a broken state", () => {
    const states = new Set(CONNECTIONS.map((c) => c.status));
    expect(states.has("connected")).toBe(true);
    expect(states.has("setup_required")).toBe(true);
    expect(states.has("error")).toBe(true);
    expect(states.has("warning")).toBe(true);
  });

  it("gives every task an owner and every message a conversation", () => {
    const conversationIds = new Set(CONVERSATIONS.map((c) => c.id));
    for (const task of TASKS) expect(task.assigneeId).toBeTruthy();
    for (const message of MESSAGES) expect(conversationIds.has(message.conversationId)).toBe(true);
  });

  it("keeps a customer who moved channels, so first touch can be seen working", () => {
    const moved = CONTACTS.filter((c) => c.firstTouchChannel !== c.latestTouchChannel);
    expect(moved.length).toBeGreaterThanOrEqual(3);
  });
});
