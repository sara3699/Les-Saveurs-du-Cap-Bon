import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseEnv } from "./env";

/**
 * The client every server component and server action uses. It carries whatever
 * session the visitor has, which is what the database's row level security reads.
 * A visitor with no session is anonymous, and anonymous can read the demonstration
 * shop and write nothing.
 */
export async function supabaseServer(headers?: Record<string, string>) {
  const { url, key } = supabaseEnv();
  const jar = await cookies();

  return createServerClient(url, key, {
    // Extra headers exist for one reason: to keep a read out of React's fetch
    // memoisation, which keys on the URL and the options together. See the note on
    // FRESH_READS in the repositories, and never add a header here for any other
    // purpose.
    global: headers ? { headers } : undefined,
    cookies: {
      getAll() {
        return jar.getAll();
      },
      setAll(items) {
        try {
          for (const { name, value, options } of items) jar.set(name, value, options);
        } catch {
          // Called from a server component, where cookies cannot be written. The
          // middleware refreshes the session instead, so this is safe to ignore.
        }
      },
    },
  });
}
