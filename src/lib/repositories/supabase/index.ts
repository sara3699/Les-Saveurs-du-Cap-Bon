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
 * The repositories are handed out synchronously, the way the screens already call
 * them, but a Supabase client can only be built inside a request. So each method
 * builds one when it is called and passes it to the real implementation. The cost
 * is one cheap object per call; the gain is that no screen had to change.
 */
function lazy<T extends object>(build: (client: SupabaseClient) => T): T {
  return new Proxy({} as T, {
    get(_target, prop) {
      return async (...args: unknown[]) => {
        const client = (await supabaseServer()) as unknown as SupabaseClient;
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
