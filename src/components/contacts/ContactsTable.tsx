import Link from "next/link";
import { Pill, SourceBadge } from "@/components/ui/badges";
import { EmptyState } from "@/components/ui/surfaces";
import { channel } from "@/lib/domain/channels";
import type { ChannelId, PipelineStage } from "@/lib/domain/types";

/** The tones Pill accepts. badges.tsx keeps its own union private, so this
 *  repeats it the way the customer détail page does. */
type PillTone = "success" | "danger" | "accent" | "muted" | "primary";

/**
 * The stage wording the owner uses out loud. "Proposal" is a quote she has
 * already sent, so it is marked as money waiting to land rather than as
 * another neutral step.
 */
export const STAGE_COPY: Record<PipelineStage, { label: string; tone: PillTone }> = {
  new: { label: "Nouveau", tone: "muted" },
  contacted: { label: "Contacté", tone: "muted" },
  qualified: { label: "Qualifié", tone: "primary" },
  proposal: { label: "Devis envoyé", tone: "accent" },
  won: { label: "Gagné", tone: "success" },
  lost: { label: "Perdu", tone: "danger" },
};

export interface ContactRow {
  id: string;
  name: string;
  href: string;
  firstTouch: ChannelId;
  firstAccount: string | null;
  latestTouch: ChannelId;
  latestAccount: string | null;
  /** True when the customer arrived on one channel and now writes on another. */
  moved: boolean;
  city: string | null;
  phone: string | null;
  stage: PipelineStage;
  lifetimeLabel: string;
  spent: boolean;
  owner: string | null;
  /** Set when another record holds the same phone number or email address. */
  duplicateNote: string | null;
}

export function ContactsTable({ rows }: { rows: ContactRow[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="Aucun client ne correspond a ces filtres"
        body="Retirez un filtre pour elargir la liste. La recherche porte sur le nom, le numéro de téléphone et l'adresse e-mail, donc un numéro partiel retrouve aussi la fiche."
        action={{ label: "Effacer les filtres", href: "/contacts" }}
      />
    );
  }

  return (
    <div className="os-scroll">
      <table className="w-full min-w-[1040px] border-collapse text-sm">
        <thead>
          <tr>
            <th className="os-label pb-2.5 pr-3 text-left font-normal">Client</th>
            <th className="os-label pb-2.5 pr-3 text-left font-normal">Premier contact</th>
            <th className="os-label pb-2.5 pr-3 text-left font-normal">Plus recent</th>
            <th className="os-label pb-2.5 pr-3 text-left font-normal">Ville</th>
            <th className="os-label pb-2.5 pr-3 text-left font-normal">Téléphone</th>
            <th className="os-label pb-2.5 pr-3 text-left font-normal">Étape</th>
            <th className="os-label pb-2.5 pr-3 text-right font-normal">Total dépense, TND</th>
            <th className="os-label pb-2.5 text-left font-normal">Responsable</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-line align-top hover:bg-surface-2">
              <td className="py-2.5 pr-3">
                <Link href={row.href} className="text-[13px] font-semibold text-primary hover:underline">
                  {row.name}
                </Link>
                {row.duplicateNote ? (
                  <span className="mt-1 flex items-center gap-1.5 text-[10.5px] font-semibold text-accent-ink">
                    <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    {row.duplicateNote}
                  </span>
                ) : null}
              </td>
              <td className="py-2.5 pr-3">
                <SourceBadge channelId={row.firstTouch} account={row.firstAccount} size="sm" />
              </td>
              <td className="py-2.5 pr-3">
                <SourceBadge channelId={row.latestTouch} account={row.latestAccount} size="sm" />
                {row.moved ? (
                  <span className="mt-1 block text-[10.5px] font-semibold text-primary">
                    Arrive par {channel(row.firstTouch).label}
                  </span>
                ) : null}
              </td>
              <td className="py-2.5 pr-3 text-[13px]">
                {row.city ?? <span className="text-faint">Non renseignee</span>}
              </td>
              <td className="py-2.5 pr-3">
                {row.phone ? (
                  <span className="os-num text-[12.5px]">{row.phone}</span>
                ) : (
                  <span className="text-[12.5px] text-faint">Pas encore de numéro</span>
                )}
              </td>
              <td className="py-2.5 pr-3">
                <Pill tone={STAGE_COPY[row.stage].tone}>{STAGE_COPY[row.stage].label}</Pill>
              </td>
              <td className="py-2.5 pr-3 text-right">
                <span className={`os-num text-[12.5px] ${row.spent ? "" : "text-faint"}`}>
                  {row.lifetimeLabel}
                </span>
              </td>
              <td className="py-2.5 text-[13px] text-muted">
                {row.owner ?? <span className="text-faint">Personne pour l'instant</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
