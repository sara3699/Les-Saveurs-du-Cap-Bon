import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Conversation, SourceAttribution } from "@/lib/domain/types";
import { getRepositories } from "@/lib/repositories";
import { mockRepositories } from "@/lib/repositories/mock";
import type { Repositories } from "@/lib/repositories/types";
import { loadChrome } from "./workspace";

vi.mock("@/lib/repositories", () => ({ getRepositories: vi.fn(), DEMO_MODE: true }));

/**
 * A request that reaches the shop while the shell is already reading.
 *
 * The database writes a record and its attribution row in one transaction, so
 * the two never disagree on disk. Only the reading can be out of step: an
 * attribution query that lands a moment before the conversation query builds an
 * index that predates the arrival, and resolveSource is right to throw at a
 * conversation whose source it cannot find. The fixture below forces that
 * ordering rather than waiting for it to happen by chance, which on a real
 * database it does perhaps once in a full end-to-end run.
 */
const ARRIVAL_ATTRIBUTION: SourceAttribution = {
  id: "at_arrivee",
  channelId: "website",
  connectionId: "cn_website_form",
  externalId: "form_arrivee",
  receivedAt: new Date().toISOString(),
  campaign: null,
  referrer: "Page panier Les Saveurs",
  conversationId: "cv_arrivee",
  contactId: "ct_rania",
};

const ARRIVAL_CONVERSATION: Conversation = {
  id: "cv_arrivee",
  contactId: "ct_rania",
  attributionId: ARRIVAL_ATTRIBUTION.id,
  subject: "Livraison à Monastir",
  status: "new",
  priority: false,
  unreadCount: 1,
  assigneeId: null,
  tags: [],
  lastMessageAt: new Date().toISOString(),
};

interface Racing {
  repositories: Repositories;
  /** What the conversations query actually answered, whenever it landed. */
  served: () => Conversation[];
}

/** The demo data, with one arrival staged to commit in the gap between the reads. */
async function racing(): Promise<Racing> {
  let conversations = await mockRepositories.conversations.list();
  let attributions = await mockRepositories.workspace.attributions();
  let served: Conversation[] = [];
  let arrived = false;

  function commitArrival() {
    if (arrived) return;
    arrived = true;
    attributions = [ARRIVAL_ATTRIBUTION, ...attributions];
    conversations = [ARRIVAL_CONVERSATION, ...conversations];
  }

  return {
    served: () => served,
    repositories: {
      ...mockRepositories,
      conversations: {
        ...mockRepositories.conversations,
        // Lands a turn later than the attributions query and answers from the
        // rows as they stand by then.
        async list() {
          await Promise.resolve();
          await Promise.resolve();
          served = conversations;
          return conversations;
        },
      },
      workspace: {
        ...mockRepositories.workspace,
        // Answers from the rows as they stood when the query was sent. The
        // arrival commits the instant afterwards, so an index built on this
        // snapshot is already one record behind.
        async attributions() {
          const snapshot = attributions;
          commitArrival();
          return snapshot;
        },
      },
    },
  };
}

/**
 * The demo data plus a conversation that has no attribution row anywhere, at any
 * moment. That is a broken record rather than a stale read, and reordering the
 * queries must not have turned it into something the shell quietly swallows.
 */
async function withABrokenRecord(): Promise<Repositories> {
  const conversations = [ARRIVAL_CONVERSATION, ...(await mockRepositories.conversations.list())];
  return {
    ...mockRepositories,
    conversations: {
      ...mockRepositories.conversations,
      async list() {
        return conversations;
      },
    },
  };
}

describe("the shell's own read", () => {
  beforeEach(() => {
    vi.mocked(getRepositories).mockReset();
  });

  it("still renders when a request arrives between the two reads", async () => {
    const { repositories } = await racing();
    vi.mocked(getRepositories).mockReturnValue(repositories);

    const chrome = await loadChrome();

    expect(chrome.search.length).toBeGreaterThan(0);
    expect(chrome.storeName).toBeTruthy();
  });

  it("carries every conversation it read into the search list, dropping none", async () => {
    const { repositories, served } = await racing();
    vi.mocked(getRepositories).mockReturnValue(repositories);

    const chrome = await loadChrome();

    // Skipping the entry whose source the index cannot explain would also stop
    // the crash, and would quietly lose the order that had just come in.
    const listed = chrome.search.filter((entry) => entry.kind === "Conversation");
    expect(listed).toHaveLength(served().length);
  });

  it("still refuses a record whose source is genuinely missing", async () => {
    vi.mocked(getRepositories).mockReturnValue(await withABrokenRecord());

    await expect(loadChrome()).rejects.toThrow(/No source attribution found/);
  });
});
