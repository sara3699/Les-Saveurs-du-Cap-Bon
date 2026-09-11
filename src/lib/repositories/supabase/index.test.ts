import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The attributions read must not be shared with another reader.
 *
 * Next.js memoises fetch GETs by URL and options across the component tree, so a
 * layout and the page inside it asking the same question get one answer, taken
 * whenever the first of them asked. Every screen reads the attributions after the
 * records they explain, on purpose; memoisation would quietly undo that ordering
 * and hand back a snapshot older than those records. A header nobody reads makes
 * the options differ, so the read is the reader's own.
 */

const headersSeen: (Record<string, string> | undefined)[] = [];

/** Enough of a client for the read-and-order queries this file exercises. */
function fakeClient() {
  return {
    from: () => ({
      select: () => ({
        order: () => Promise.resolve({ data: [], error: null }),
      }),
    }),
  };
}

vi.mock("@/lib/supabase/server", () => ({
  supabaseServer: vi.fn(async (headers?: Record<string, string>) => {
    headersSeen.push(headers);
    return fakeClient();
  }),
}));

const { supabaseRepositories } = await import("./index");

describe("the supabase repositories", () => {
  beforeEach(() => {
    headersSeen.length = 0;
  });

  it("keeps each attributions read out of the shared fetch memo", async () => {
    const repos = supabaseRepositories();

    await repos.workspace.attributions();
    await repos.workspace.attributions();

    const reads = headersSeen.map((h) => h?.["x-read"]);
    expect(reads.every(Boolean)).toBe(true);
    expect(new Set(reads).size).toBe(2);
  });

  it("leaves every other read shareable, so the tree still asks once", async () => {
    const repos = supabaseRepositories();

    await repos.workspace.tags();
    await repos.workspace.tags();

    expect(headersSeen).toEqual([undefined, undefined]);
  });
});
