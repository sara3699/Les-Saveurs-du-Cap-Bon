import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase/server";
import type {
  ContactRepository,
  ConversationRepository,
  IntegrationRepository,
  OrderRepository,
  ReceiptRepository,
  Repositories,
  WorkspaceRepository,
} from "../types";
import { supabaseContacts } from "./contacts";
import { supabaseConversations } from "./conversations";
import { supabaseIntegrations } from "./integrations";
import { supabaseOrders } from "./orders";
import { supabaseReceipts } from "./receipts";
import { supabaseWorkspace } from "./workspace";

/**
 * A read that has to be newer than the records it explains, and so must not be
 * shared with another reader.
 *
 * Next.js memoises fetch GETs by URL and options across the whole component tree,
 * so a layout and the page inside it that ask the same question get one answer,
 * taken whenever the first of them asked. For the attributions that is wrong.
 * loadChrome reads the orders and only then the attributions, on purpose, but
 * memoisation can hand it the snapshot the page took earlier, before those orders
 * existed. resolveSource then throws on an order whose source is missing, and the
 * shell takes every screen down with it.
 *
 * A header nobody reads makes the options differ, so this read is its own. The
 * cost is one request per reader rather than one per render; the alternative is a
 * screen that crashes whenever an order arrives while somebody is looking.
 */
const FRESH_READS = new Set(["attributions"]);

/**
 * The repositories are handed out synchronously, the way the screens already call
 * them, but a Supabase client can only be built inside a request. So each method
 * builds one when it is called and passes it to the real implementation. The cost
 * is one cheap object per call; the gain is that no screen had to change.
 */
function lazy<T extends object>(build: (client: SupabaseClient) => T): T {
  return new Proxy({} as T, {
    get(_target, prop) {
      return async (...args: unknown[]) => {
        const headers = FRESH_READS.has(prop as string)
          ? { "x-read": crypto.randomUUID() }
          : undefined;
        const client = (await supabaseServer(headers)) as unknown as SupabaseClient;
        const real = build(client) as Record<string | symbol, (...a: unknown[]) => unknown>;
        return real[prop](...args);
      };
    },
  });
}

export function supabaseRepositories(): Repositories {
  return {
    conversations: lazy<ConversationRepository>(supabaseConversations),
    contacts: lazy<ContactRepository>(supabaseContacts),
    orders: lazy<OrderRepository>(supabaseOrders),
    integrations: lazy<IntegrationRepository>(supabaseIntegrations),
    workspace: lazy<WorkspaceRepository>(supabaseWorkspace),
    receipts: lazy<ReceiptRepository>(supabaseReceipts),
  };
}
