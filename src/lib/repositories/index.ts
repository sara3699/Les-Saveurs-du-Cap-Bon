import { mockRepositories } from "./mock";
import { supabaseRepositories } from "./supabase";
import { supabaseConfigured } from "@/lib/supabase/env";
import type { Repositories } from "./types";

/**
 * One decision, made once. With a database configured the screens read and write
 * it. Without one they read the demo files, so the project still runs for anyone
 * who clones it and has no Supabase project of their own.
 */
export function getRepositories(): Repositories {
  return supabaseConfigured() ? supabaseRepositories() : mockRepositories;
}

export const DEMO_MODE = !supabaseConfigured();

export type * from "./types";
