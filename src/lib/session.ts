import { cookies } from "next/headers";
import { getRepositories } from "@/lib/repositories";
import type { TeamMember, TeamRole } from "@/lib/domain/types";

/**
 * A démonstration sign-in, not a real one.
 *
 * There is no password, no account and no database. Choosing a person writes one
 * cookie holding their id, so the workspace can show what that person would see.
 * Every screen says so. Real accounts arrive with the database, and this file is
 * the piece that gets replaced when they do.
 */
export const SESSION_COOKIE = "saveurs_demo_member";

export async function currentMember(): Promise<TeamMember | null> {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  if (!id) return null;
  const team = await getRepositories().workspace.team();
  return team.find((m) => m.id === id) ?? null;
}

/** What each role is allowed to open. The owner sees everything. */
const HIDDEN_FOR: Record<TeamRole, string[]> = {
  owner: [],
  manager: ["/budget", "/store"],
  agent: ["/budget", "/store", "/statistics", "/settings", "/team", "/upsells", "/calculator"],
};

export function canOpen(role: TeamRole, href: string): boolean {
  return !HIDDEN_FOR[role].includes(href);
}

export function hiddenFor(role: TeamRole): string[] {
  return HIDDEN_FOR[role];
}
