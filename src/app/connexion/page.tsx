import { enterAs } from "./actions";
import { getRepositories } from "@/lib/repositories";
import { STORE } from "@/lib/mock/core";
import type { TeamRole } from "@/lib/domain/types";
import { hiddenFor } from "@/lib/session";

export const metadata = { title: "Connexion, Les Saveurs du Cap Bon" };

const ROLE_LABEL: Record<TeamRole, string> = {
  owner: "Propriétaire",
  manager: "Responsable",
  agent: "Agent",
};

const ROLE_SUMMARY: Record<TeamRole, string> = {
  owner:
    "Voit tout : chaque commande, chaque conversation, les chiffres et la configuration des canaux.",
  manager:
    "Répartit le travail, suit les conversations et les commandes, consulte les statistiques. Ne voit pas le budget ni la boutique.",
  agent:
    "Traite les conversations et les commandes qui lui sont attribuées. Ne voit ni les chiffres de la boutique ni la configuration.",
};

export default async function ConnexionPage() {
  const team = await getRepositories().workspace.team();

  return (
    <main className="min-h-screen bg-canvas px-4 py-10 sm:py-16">
      <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6">
        <header className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-[11px] bg-primary font-display text-sm font-bold text-white">
              {STORE.initials}
            </span>
            <div>
              <p className="font-display text-lg font-bold leading-tight">{STORE.name}</p>
              <p className="text-xs text-muted">{STORE.city}</p>
            </div>
          </div>
          <h1 className="text-2xl leading-tight">Qui ouvre l&apos;espace de travail ?</h1>
          <p className="max-w-[62ch] text-sm text-muted">
            Choisissez une personne pour entrer avec ses droits. Chaque rôle ne voit pas la même
            chose, et l&apos;écran vous dit lesquels sont masqués.
          </p>
          <p className="inline-flex w-fit items-center gap-2 rounded-full border border-accent-line bg-accent-soft px-3 py-1 text-xs font-semibold text-accent-ink">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent" />
            Démonstration, aucun mot de passe et aucun compte réel
          </p>
        </header>

        <ul className="grid gap-3 sm:grid-cols-2">
          {team.map((member) => {
            const hidden = hiddenFor(member.role);
            return (
              <li key={member.id} className="os-card flex flex-col gap-3 p-4">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-primary-soft font-display text-[13px] font-bold text-primary">
                    {member.initials}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold leading-tight">{member.name}</span>
                    <span className="block text-[11.5px] text-muted">{ROLE_LABEL[member.role]}</span>
                  </span>
                </div>

                <p className="text-[12.5px] leading-relaxed text-muted">{ROLE_SUMMARY[member.role]}</p>

                <p className="text-[11.5px] text-faint">
                  {hidden.length === 0
                    ? "Aucun écran masqué."
                    : `${hidden.length} écrans masqués pour ce rôle.`}
                </p>

                <form action={enterAs} className="mt-auto">
                  <input type="hidden" name="memberId" value={member.id} />
                  <button
                    type="submit"
                    className="w-full rounded-[var(--radius-md)] bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hi"
                  >
                    Entrer comme {member.name.split(" ")[0]}
                  </button>
                </form>
              </li>
            );
          })}
        </ul>

        <p className="max-w-[70ch] text-xs text-muted">
          Les vrais comptes, avec mot de passe, arrivent avec la base de données. Tant qu&apos;elle
          n&apos;est pas en place, rien de ce que vous faites ici n&apos;est enregistré et aucun
          compte Instagram, WhatsApp, Facebook ou Google n&apos;est connecté.
        </p>
      </div>
    </main>
  );
}
