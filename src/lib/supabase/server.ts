import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseEnv } from "./env";

/**
 * The client every server component and server action uses. It carries whatever
 * session the visitor has, which is what the database's row level security reads.
 * A visitor with no session is anonymous, and anonymous can read the demonstration
 * shop and write nothing.
 */
export async function supabaseServer() {
  const { url, key } = supabaseEnv();
  const jar = await cookies();

  return createServerClient(url, key, {
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
