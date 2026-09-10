import { redirect } from "next/navigation";
import { AppChrome } from "@/components/shell/AppChrome";
import { signOut } from "@/app/connexion/actions";
import { loadChrome } from "@/lib/workspace";
import { currentMember, hiddenFor } from "@/lib/session";

const ROLE_LABEL = {
  owner: "Propriétaire",
  manager: "Responsable",
  agent: "Agent",
} as const;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Nobody chosen yet means nobody to show the workspace as, so back to the door.
  const member = await currentMember();
  if (!member) redirect("/connexion");

  const chrome = await loadChrome();

  return (
    <AppChrome
      {...chrome}
      userName={member.name}
      userInitials={member.initials}
      userRole={ROLE_LABEL[member.role]}
      hiddenHrefs={hiddenFor(member.role)}
      signOut={signOut}
    >
      {children}
    </AppChrome>
  );
}
