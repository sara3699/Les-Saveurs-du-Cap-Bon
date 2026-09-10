import { cookies } from "next/headers";
import { getRepositories } from "@/lib/repositories";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/env";
import type { TeamMember, TeamRole } from "@/lib/domain/types";

/**
 * Two ways into the workspace, and the difference between them matters.
 *
 * Signed in with an email and a password: a real account, and what you do is
 * written to the database.
 *
 * Entered through the demonstration door: no account, no password. The database
 * lets anyone read the demonstration shop and lets nobody write to it, so this
 * visit can look at everything and change nothing. Every screen says so.
 */
export const DEMO_COOKIE = "saveurs_demo_member";

export interface Session {
  member: TeamMember;
  /** True only for a real signed in account. */
  canWrite: boolean;
  email: string | null;
}

export async function currentSession(): Promise<Session | null> {
  const team = await getRepositories().workspace.team();

  if (supabaseConfigured()) {
    const db = await supabaseServer();
    const { data } = await db.auth.getUser();
    const user = data.user;
    if (user) {
      const { data: row } = await db
        .from("organization_members")
        .select("id, display_name, initials, role")
        .eq("profile_id", user.id)
        .is("archived_at", null)
        .maybeSingle();
      if (row) {
        const member =
          team.find((m) => m.id === row.id) ??
          ({
            id: row.id as string,
            name: row.display_name as string,
            initials: row.initials as string,
            role: row.role as TeamRole,
            openConversations: 0,
            tasksDue: 0,
          } satisfies TeamMember);
        return { member, canWrite: true, email: user.email ?? null };
      }
    }
  }

  const jar = await cookies();
  const demoId = jar.get(DEMO_COOKIE)?.value;
  if (!demoId) return null;
  const member = team.find((m) => m.id === demoId);
  return member ? { member, canWrite: false, email: null } : null;
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
