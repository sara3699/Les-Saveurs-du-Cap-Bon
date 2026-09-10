import { enterAs } from "./actions";
import { SignInForm } from "@/components/connexion/SignInForm";
import { getRepositories } from "@/lib/repositories";
import { STORE } from "@/lib/mock/core";
import type { TeamRole } from "@/lib/domain/types";

export const metadata = { title: "Connexion, Les Saveurs du Cap Bon" };

const ROLE_LABEL: Record<TeamRole, string> = {
  owner: "Propriétaire",
  manager: "Responsable",
  agent: "Agent",
};

export default async function ConnexionPage() {
  const team = await getRepositories().workspace.team();

  return (
    <main className="grid min-h-screen place-items-center bg-canvas px-4 py-10">
      <div className="flex w-full max-w-[420px] flex-col gap-5">
        <header className="flex flex-col items-center gap-3 text-center">
          <span className="grid h-11 w-11 place-items-center rounded-[12px] bg-primary font-display text-base font-bold text-white">
            {STORE.initials}
          </span>
          <div>
            <h1 className="font-display text-xl font-bold leading-tight">{STORE.name}</h1>
            <p className="mt-0.5 text-xs text-muted">{STORE.city}</p>
          </div>
        </header>

        <SignInForm />

        <details className="os-card px-4 py-3">
          <summary className="cursor-pointer list-none text-[13px] font-semibold">
            Ou entrer en démonstration, sans compte
            <span className="mt-0.5 block text-[12px] font-normal text-muted">
              Pour montrer l&apos;espace de travail. Vous voyez tout, rien n&apos;est enregistré.
            </span>
          </summary>

          <ul className="mt-3 flex flex-col gap-1.5 border-t border-line pt-3">
            {team.map((member) => (
              <li key={member.id}>
                <form action={enterAs}>
                  <input type="hidden" name="memberId" value={member.id} />
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] border border-line bg-surface-2 px-2.5 py-2 text-left hover:border-line-strong"
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[8px] bg-primary-soft font-display text-[11px] font-bold text-primary">
                      {member.initials}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-semibold">{member.name}</span>
                      <span className="block text-[11px] text-muted">{ROLE_LABEL[member.role]}</span>
                    </span>
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </details>

        <p className="text-center text-[11.5px] leading-relaxed text-muted">
          Aucun compte Instagram, WhatsApp, Facebook ou Google n&apos;est connecté à cet espace.
          Les commandes et les clients que vous voyez sont des données d&apos;exemple.
        </p>
      </div>
    </main>
  );
}
