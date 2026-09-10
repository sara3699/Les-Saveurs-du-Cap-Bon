import { redirect } from "next/navigation";
import { AppChrome } from "@/components/shell/AppChrome";
import { signOut } from "@/app/connexion/actions";
import { loadChrome } from "@/lib/workspace";
import { currentSession, hiddenFor } from "@/lib/session";
import type { TeamRole } from "@/lib/domain/types";

const ROLE_LABEL: Record<TeamRole, string> = {
  owner: "Propriétaire",
  manager: "Responsable",
  agent: "Agent",
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Nobody signed in and nobody chosen means nobody to show the workspace as.
  const session = await currentSession();
  if (!session) redirect("/connexion");

  const chrome = await loadChrome();

  return (
    <AppChrome
      {...chrome}
      userName={session.member.name}
      userInitials={session.member.initials}
      userRole={ROLE_LABEL[session.member.role]}
      hiddenHrefs={hiddenFor(session.member.role)}
      canWrite={session.canWrite}
      signOut={signOut}
    >
      {children}
    </AppChrome>
  );
}
