import { mockRepositories } from "./mock";
import type { Repositories } from "./types";

/**
 * The single place the product decides where its data comes from. Today it is
 * the demo set; when Supabase is switched on this returns a different object and
 * no screen changes.
 */
export function getRepositories(): Repositories {
  return mockRepositories;
}

export const DEMO_MODE = true;

export type * from "./types";
