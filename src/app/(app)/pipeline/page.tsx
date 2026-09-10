import Link from "next/link";
import { PipelineBoard } from "@/components/pipeline/PipelineBoard";
import { PipelineList } from "@/components/pipeline/PipelineList";
import type { PipelineCard } from "@/components/pipeline/types";
import { ChannelDot } from "@/components/ui/badges";
import { Card, CardHead, DemoChip, EmptyState, PageHeader } from "@/components/ui/surfaces";
import { buildAttributionIndex, resolveSource } from "@/lib/domain/attribution";
import { CHANNEL_ORDER, channel } from "@/lib/domain/channels";
import type { ChannelId } from "@/lib/domain/types";
import { formatDate, formatTND, isOverdue, relativeTime, timeAgo } from "@/lib/format";
import { DEMO_NOW } from "@/lib/mock/time";
import { getRepositories } from "@/lib/repositories";
import { currentSession } from "@/lib/session";

export const metadata = { title: "Pipeline, Les Saveurs du Cap Bon" };

// The demo clock moves with the visit, so the age on every card is worked out per
// request rather than frozen into the build.
export const dynamic = "force-dynamic";

type Params = Promise<Record<string, string | string[] | undefined>>;

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

const DAY = 24 * 60 * 60 * 1000;

function leadCount(n: number): string {
  return n === 1 ? "1 prospect" : `${n} prospects`;
}

/** How old the lead is, which is the question an owner actually asks about it. */
function ageLabel(iso: string): string {
  const days = Math.floor((DEMO_NOW.getTime() - new Date(iso).getTime()) / DAY);
  if (days <= 0) return "Ouvert aujourd'hui";
  if (days === 1) return "Ouvert il y a 1 jour";
  return `Ouvert il y a ${days} jours`;
}

export default async function PipelinePage({ searchParams }: { searchParams: Params }) {
  const params = await searchParams;
  const source = one(params.source) as ChannelId | undefined;
  const owner = one(params.owner);
  const view = one(params.view) === "list" ? "list" : "board";

  const repos = getRepositories();
  // The board writes its moves, so it has to know which of the two doors this
  // visitor came through. The action checks the session again for itself.
  const session = await currentSession();
  const canWrite = session?.canWrite ?? false;

  const [leads, contacts, team, tasks, attributions, connections] = await Promise.all([
    repos.workspace.leads(),
    repos.contacts.list(),
    repos.workspace.team(),
    repos.workspace.tasks(),
    repos.workspace.attributions(),
    repos.integrations.list(),
  ]);

  const index = buildAttributionIndex(attributions, connections);
  const contactById = new Map(contacts.map((c) => [c.id, c]));
  const teamById = new Map(team.map((m) => [m.id, m]));
  const taskById = new Map(tasks.map((t) => [t.id, t]));

  // Who owns a lead is kept beside the cards rather than inside them: the board
  // shows a name, and the filter has to match on the person's id.
  const ownerOf = new Map(leads.map((lead) => [lead.id, lead.ownerId]));

  const bySource: PipelineCard[] = leads
    .map((lead) => {
      const contact = contactById.get(lead.contactId)!;
      // The channel comes from the lead's attribution, so a lead that arrived on
      // Instagram is still an Instagram lead after four stage changes.
      const from = resolveSource(lead.attributionId, index);
      const task = lead.nextTaskId ? taskById.get(lead.nextTaskId) ?? null : null;
      const late = task ? isOverdue(task.dueAt, DEMO_NOW) : false;

      return {
        id: lead.id,
        stage: lead.stage,
        contactName: contact.name,
        contactHref: `/contacts/${contact.id}`,
        channelId: from.channelId,
        account: from.accountLabel,
        value: lead.value,
        valueLabel: formatTND(lead.value),
        ageLabel: ageLabel(lead.createdAt),
        openedLabel: formatDate(lead.createdAt),
        owner: lead.ownerId ? teamById.get(lead.ownerId)?.name ?? null : null,
        nextStep: task
          ? {
              title: task.title,
              dueLabel: late ? timeAgo(task.dueAt, DEMO_NOW) : relativeTime(task.dueAt, DEMO_NOW),
              overdue: late,
            }
          : null,
        lostReason: lead.lostReason,
      };
    })
    .filter((card) => (source ? card.channelId === source : true))
    .sort((a, b) => b.value - a.value);

  const cards = bySource.filter((card) => {
    if (!owner) return true;
    const heldBy = ownerOf.get(card.id) ?? null;
    return owner === "none" ? heldBy === null : heldBy === owner;
  });

  // A card moved on the board changes which column it counts in, so the figure
  // up here is the one a move cannot contradict: what the whole set is worth.
  // How much of it is still open is counted on the board itself, where it stays
  // true after a move.
  const boardValue = cards.reduce((sum, card) => sum + card.value, 0);

  // Counted the same way the filter matches, off the owner id rather than off the
  // name, so the number on the chip is always the number of cards it brings back.
  const unowned = bySource.filter((card) => (ownerOf.get(card.id) ?? null) === null).length;

  const subtitle =
    cards.length === 0
      ? "Aucun prospect ne correspond aux filtres choisis. Retirez-en un pour les faire revenir."
      : `${leadCount(cards.length)} sur le tableau, soit ${formatTND(boardValue)} au total si chacun aboutit. Chaque carte garde le canal par lequel elle est arrivée.`;

  const keep = (extra: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const merged: Record<string, string | undefined> = {
      source,
      owner,
      view: view === "list" ? "list" : undefined,
      ...extra,
    };
    for (const [key, value] of Object.entries(merged)) if (value) next.set(key, value);
    const qs = next.toString();
    return qs ? `/pipeline?${qs}` : "/pipeline";
  };

  const viewLink = (target: "board" | "list", label: string) => (
    <Link
      href={keep({ view: target === "list" ? "list" : undefined })}
      aria-current={view === target ? "true" : undefined}
      className={`px-3 py-1.5 ${view === target ? "bg-primary text-white" : "text-muted hover:text-ink"}`}
    >
      {label}
    </Link>
  );

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Pipeline"
        subtitle={subtitle}
        actions={
          <>
            <span className="flex overflow-hidden rounded-full border border-line bg-surface-2 text-xs font-semibold">
              {viewLink("board", "Tableau")}
              {viewLink("list", "Liste")}
            </span>
            <DemoChip />
          </>
        }
      />

      <Card>
        <div
          role="group"
          aria-labelledby="pipeline-source-filter"
          className="flex flex-wrap items-center gap-1.5"
        >
          <span id="pipeline-source-filter" className="os-label mr-1">
            Source
          </span>
          <Link
            href={keep({ source: undefined })}
            aria-current={source ? undefined : "true"}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
              source ? "border-line bg-surface-2 text-muted" : "border-primary bg-primary text-white"
            }`}
          >
            Toutes les sources
          </Link>
          {CHANNEL_ORDER.map((id) => {
            const active = source === id;
            return (
              <Link
                key={id}
                href={keep({ source: active ? undefined : id })}
                aria-current={active ? "true" : undefined}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  active ? "border-primary bg-primary text-white" : "border-line bg-surface-2 text-muted"
                }`}
              >
                <ChannelDot channelId={id} size={7} />
                {channel(id).label}
              </Link>
            );
          })}
        </div>

        <div
          role="group"
          aria-labelledby="pipeline-owner-filter"
          className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-line pt-3"
        >
          <span id="pipeline-owner-filter" className="os-label mr-1">
            Responsable
          </span>
          <Link
            href={keep({ owner: undefined })}
            aria-current={owner ? undefined : "true"}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
              owner ? "border-line bg-surface-2 text-muted" : "border-primary bg-primary text-white"
            }`}
          >
            Tout le monde
          </Link>
          {team.map((member) => (
            <Link
              key={member.id}
              href={keep({ owner: owner === member.id ? undefined : member.id })}
              aria-current={owner === member.id ? "true" : undefined}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                owner === member.id
                  ? "border-primary bg-primary text-white"
                  : "border-line bg-surface-2 text-muted"
              }`}
            >
              {member.name}
            </Link>
          ))}
          <Link
            href={keep({ owner: owner === "none" ? undefined : "none" })}
            aria-current={owner === "none" ? "true" : undefined}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
              owner === "none"
                ? "border-primary bg-primary text-white"
                : "border-line bg-surface-2 text-muted"
            }`}
          >
            Personne pour l'instant, <span className="os-num">{unowned}</span>
          </Link>
        </div>
      </Card>

      {cards.length === 0 ? (
        <EmptyState
          title="Aucun prospect ne correspond à ces filtres"
          body="Chaque prospect des données d'exemple est arrivé par l'une des six sources. Un tableau vide veut donc dire que la source et le responsable choisis ne se croisent pas. Retirez l'un des deux."
          action={{
            label: "Retirer les filtres",
            href: keep({ source: undefined, owner: undefined }),
          }}
        />
      ) : view === "list" ? (
        <Card>
          <CardHead
            title="Tous les prospects, étape par étape"
            hint="Les mêmes prospects que sur le tableau, en lignes. Les cartes se déplacent sur le tableau."
          />
          <PipelineList cards={cards} />
        </Card>
      ) : (
        <PipelineBoard cards={cards} canWrite={canWrite} />
      )}

      <p className="max-w-[86ch] text-xs text-muted">
        Un prospect devient une carte dès qu'un premier message ou un formulaire arrive, et la
        source affichée vient de cette arrivée, pas de ce qui est saisi ensuite. La valeur
        correspond à ce que le prospect rapportera s'il aboutit, et non à de l'argent déjà
        encaissé. Sur téléphone, la vue liste est la plus lisible.
      </p>
    </div>
  );
}
