import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivityTimeline, type TimelineEntry } from "@/components/contact-detail/ActivityTimeline";
import { DuplicateBanner, type DuplicateMatch } from "@/components/contact-detail/DuplicateBanner";
// The stage pill reads the same wording and the same tone the contacts list
// reads, so one record cannot be "Won" on the list and something else here.
import { STAGE_COPY } from "@/components/contacts/ContactsTable";
import { ChannelDot, Pill, SourceBadge, TagChip } from "@/components/ui/badges";
import { Card, CardHead, DemoChip, PageHeader, Stat } from "@/components/ui/surfaces";
import {
  buildAttributionIndex,
  orderSource,
  resolveSource,
  totalsByChannel,
  touchSummary,
} from "@/lib/domain/attribution";
import { channel } from "@/lib/domain/channels";
import type { ChannelId, ConversationStatus, Message, Order } from "@/lib/domain/types";
import {
  formatDate,
  formatDateTime,
  formatTND,
  formatTNDCompact,
  isOverdue,
  relativeTime,
  timeAgo,
} from "@/lib/format";
import { DEMO_NOW } from "@/lib/mock/time";
import { getRepositories } from "@/lib/repositories";

type Params = Promise<{ id: string }>;

// The demo clock moves with the visit, so this page is rendered per request
// rather than frozen into the build.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Params }) {
  const { id } = await params;
  const contact = await getRepositories().contacts.byId(decodeURIComponent(id));
  return { title: contact ? `${contact.name}, Les Saveurs du Cap Bon` : "Client, Les Saveurs du Cap Bon" };
}

const CONVERSATION_STATE: Record<ConversationStatus, string> = {
  new: "Nouveau, personne n'a répondu",
  open: "Ouvert",
  waiting: "En attente du client",
  resolved: "Résolu",
  snoozed: "Reporté",
};

function joinWords(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} et ${items[items.length - 1]}`;
}

function shorten(body: string, limit = 120): string {
  if (body.length <= limit) return body;
  return `${body.slice(0, limit).trimEnd()}...`;
}

function speaker(message: Message, firstName: string, team: Map<string, string>): string {
  const author = message.authorId ? team.get(message.authorId) ?? "Votre équipe" : "Votre équipe";
  if (message.direction === "inbound") return `${firstName} a écrit`;
  if (message.direction === "note") return `${author} a laissé une note`;
  return `${author} a répondu`;
}

export default async function ContactDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const repos = getRepositories();
  const contact = await repos.contacts.byId(decodeURIComponent(id));
  if (!contact) notFound();

  const [contacts, conversations, orders, tasks, team, connections, duplicates] =
    await Promise.all([
      repos.contacts.list(),
      repos.conversations.list(),
      repos.orders.list(),
      repos.workspace.tasks(),
      repos.workspace.team(),
      repos.integrations.list(),
      repos.contacts.duplicates(),
    ]);

  // Read after the records above and never alongside them, so the index is
  // never older than the records it has to explain. loadChrome carries the
  // long note on why a parallel read leaves resolveSource nothing to find.
  const attributions = await repos.workspace.attributions();

  const index = buildAttributionIndex(attributions, connections);
  const teamById = new Map(team.map((member) => [member.id, member.name]));
  const nameById = new Map(contacts.map((other) => [other.id, other.name]));
  const firstName = contact.name.split(" ")[0];

  const theirConversations = conversations.filter((c) => c.contactId === contact.id);
  const theirOrders = orders.filter((o) => o.contactId === contact.id);
  const theirTasks = tasks.filter((t) => t.contactId === contact.id);
  const openTasks = theirTasks.filter((t) => !t.completedAt);
  const overdueTasks = openTasks.filter((t) => isOverdue(t.dueAt, DEMO_NOW));

  const threads = await Promise.all(
    theirConversations.map(async (conversation) => ({
      id: conversation.id,
      messages: await repos.conversations.messages(conversation.id),
    })),
  );
  const lastMessageOf = new Map(
    threads.map((thread) => [thread.id, thread.messages[thread.messages.length - 1] ?? null]),
  );

  const entries: TimelineEntry[] = [];

  for (const conversation of theirConversations) {
    const source = resolveSource(conversation.attributionId, index);
    const message = lastMessageOf.get(conversation.id) ?? null;
    entries.push({
      kind: "conversation",
      id: `thread_${conversation.id}`,
      at: conversation.lastMessageAt,
      stamp: relativeTime(conversation.lastMessageAt, DEMO_NOW),
      exact: formatDateTime(conversation.lastMessageAt),
      channelId: source.channelId,
      account: source.accountLabel,
      subject: conversation.subject,
      href: `/inbox?c=${conversation.id}`,
      state: CONVERSATION_STATE[conversation.status],
      lastLine: message
        ? `${speaker(message, firstName, teamById)} : ${shorten(message.body)}`
        : null,
    });
  }

  for (const order of theirOrders) {
    const source = orderSource(order, index);
    entries.push({
      kind: "order",
      id: `order_${order.id}`,
      at: order.placedAt,
      stamp: relativeTime(order.placedAt, DEMO_NOW),
      exact: formatDateTime(order.placedAt),
      channelId: source.channelId,
      account: source.accountLabel,
      reference: order.reference,
      href: `/orders/${order.reference}`,
      totalLabel: formatTND(order.total),
      payment: order.paymentStatus,
      delivery: order.deliveryStatus,
      contents: order.items.map((item) => `${item.quantity} x ${item.name}`).join(", "),
    });
  }

  for (const task of theirTasks) {
    const done = task.completedAt !== null;
    const at = task.completedAt ?? task.dueAt;
    const overdue = !done && isOverdue(task.dueAt, DEMO_NOW);
    entries.push({
      kind: "task",
      id: `task_${task.id}`,
      at,
      stamp: relativeTime(at, DEMO_NOW),
      exact: formatDateTime(at),
      title: task.title,
      state: done
        ? `Terminée ${timeAgo(at, DEMO_NOW)}`
        : overdue
          ? `En retard, l'échéance était ${timeAgo(task.dueAt, DEMO_NOW)}`
          : `Échéance ${relativeTime(task.dueAt, DEMO_NOW)}`,
      overdue,
      done,
      owner: teamById.get(task.assigneeId) ?? "Personne pour l'instant",
    });
  }

  for (const note of contact.notes) {
    entries.push({
      kind: "note",
      id: `note_${note.id}`,
      at: note.createdAt,
      stamp: relativeTime(note.createdAt, DEMO_NOW),
      exact: formatDateTime(note.createdAt),
      body: note.body,
      author: teamById.get(note.authorId) ?? "Votre équipe",
    });
  }

  entries.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  const touches = touchSummary(contact.firstTouchChannel, contact.latestTouchChannel);
  const stage = STAGE_COPY[contact.stage];
  const owner = contact.ownerId ? teamById.get(contact.ownerId) ?? null : null;
  // The repository makes no promise about the order it returns rows in, so the
  // newest order is worked out here rather than assumed to be the first one.
  // Otherwise the tile could say "last one 4h ago" while the timeline above it
  // shows a newer order.
  const lastOrder = theirOrders.reduce<Order | null>(
    (newest, order) =>
      newest === null || new Date(order.placedAt).getTime() > new Date(newest.placedAt).getTime()
        ? order
        : newest,
    null,
  );
  const unresolvedThreads = theirConversations.filter((c) => c.status !== "resolved").length;

  const channelsUsed: ChannelId[] = [];
  for (const entry of entries) {
    if (entry.kind !== "order" && entry.kind !== "conversation") continue;
    if (!channelsUsed.includes(entry.channelId)) channelsUsed.push(entry.channelId);
  }

  const bySource = totalsByChannel(theirOrders, index).filter((row) => row.orders > 0);
  const offFirstTouch = theirOrders.filter(
    (order) => orderSource(order, index).channelId !== contact.firstTouchChannel,
  ).length;

  const mixLine =
    channelsUsed.length === 0
      ? "Rien n'est encore arrivé sur cette fiche, il n'y a donc aucune source à indiquer."
      : channelsUsed.length === 1
        ? `Tout ce qui figure sur cette fiche est arrivé sur ${channel(channelsUsed[0]).label}.`
        : `Les messages et les commandes de cette fiche sont arrivés sur ${joinWords(
            channelsUsed.map((channelId) => channel(channelId).label),
          )}. Chacun garde la source sur laquelle il est arrivé.`;

  // A record typed in at the counter or over the phone did not arrive on a
  // channel, so it gets its own sentence instead of being told it found the
  // shop on something called Manual.
  const addedByHand = contact.firstTouchChannel === "manual";

  const arrivalLine = addedByHand
    ? touches.changed
      ? `Cette fiche a été saisie à la main plutôt que d'arriver sur un canal, et ${firstName} écrit maintenant sur ${touches.latest}. La fiche garde les deux, il reste donc clair qu'aucun canal connecté n'a amené ce client.`
      : `Cette fiche a été saisie à la main plutôt que d'arriver sur un canal, et rien n'est arrivé depuis sur un canal connecté.`
    : touches.changed
      ? `${firstName} a découvert la boutique sur ${touches.first} et écrit maintenant sur ${touches.latest}. La fiche garde les deux, ${touches.first} reste donc le canal qui a amené ce client.`
      : `${firstName} a découvert la boutique sur ${touches.first}, et c'est toujours le canal le plus récent sur cette fiche.`;

  const matches: DuplicateMatch[] = duplicates
    .filter((entry) => entry.contactIds.includes(contact.id))
    .map((entry) => {
      const isEmail = entry.value.includes("@");
      return {
        id: entry.value,
        field: isEmail ? "adresse e-mail" : "numéro de téléphone",
        value: (isEmail ? contact.email : contact.phone) ?? entry.value,
        others: entry.contactIds
          .filter((other) => other !== contact.id)
          .map((other) => ({ id: other, name: nameById.get(other) ?? "L'autre fiche" })),
      };
    });

  const facts: { label: string; value: React.ReactNode; mono?: boolean }[] = [
    { label: "Téléphone", value: contact.phone ?? <Missing />, mono: contact.phone !== null },
    { label: "E-mail", value: contact.email ?? <Missing /> },
    { label: "Premier contact", value: formatDate(contact.firstContactAt) },
    {
      label: "Responsable",
      value: owner ?? <span className="text-danger">Personne pour l'instant</span>,
    },
    // Written the same way as the tile above. One figure, one label, two places
    // on the page: it has to read identically in both.
    { label: "Valeur totale du client", value: formatTNDCompact(contact.lifetimeValue), mono: true },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href="/contacts" className="text-xs font-semibold text-primary hover:underline">
          Retour aux contacts
        </Link>
      </div>

      <PageHeader
        title={contact.name}
        subtitle={`${[contact.city, `parle ${contact.language}`]
          .filter(Boolean)
          .join(", ")}. Dans votre liste depuis le ${formatDate(contact.firstContactAt)}.`}
        actions={
          <>
            <Pill tone={stage.tone}>{stage.label}</Pill>
            <DemoChip />
          </>
        }
      />

      <DuplicateBanner matches={matches} />

      <Card>
        <CardHead
          title="D'où vient ce client"
          hint="Le premier canal est écrit une seule fois et n'est jamais modifié. Le plus récent suit le client."
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[1fr_1fr_1.2fr]">
          <div>
            <p className="os-label">Premier canal</p>
            <p className="mt-1.5">
              <SourceBadge channelId={contact.firstTouchChannel} />
            </p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
              {addedByHand
                ? `Cette fiche a été saisie à la main le ${formatDate(contact.firstContactAt)}, pas via un canal connecté. Cela reste sur la fiche quel que soit le canal utilisé ensuite.`
                : `Le canal par lequel ${firstName} vous a contacté la première fois, le ${formatDate(contact.firstContactAt)}. Il reste sur la fiche quel que soit le canal utilisé ensuite.`}
            </p>
          </div>

          <div>
            <p className="os-label">Contact le plus récent</p>
            <p className="mt-1.5">
              <SourceBadge channelId={contact.latestTouchChannel} />
            </p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
              Le canal sur lequel pointe cette fiche aujourd'hui. Il change quand le client change
              de canal, et il n'écrase jamais le premier.
            </p>
          </div>

          <div className="rounded-[var(--radius-md)] border border-line bg-surface-2 px-3.5 py-3">
            <div className="flex items-baseline justify-between gap-3">
              <span className="os-label">Score du prospect</span>
              <span className="os-num font-display text-[24px] font-bold leading-none">
                {contact.leadScore}
              </span>
            </div>
            <p className="mt-1 text-[11.5px] text-muted">Sur 100, et voici pourquoi :</p>
            <ul className="mt-2 flex flex-col gap-1 text-[12.5px]">
              {contact.leadScoreReasons.map((reason) => (
                <li key={reason} className="flex gap-2">
                  <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-3 rounded-[var(--radius-sm)] border border-line bg-surface-2 px-3 py-2 text-[12.5px] leading-relaxed text-muted">
          {arrivalLine} {mixLine}
        </p>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Valeur totale du client"
          value={formatTNDCompact(contact.lifetimeValue)}
          detail="Conservée sur la fiche, ce n'est pas la somme des commandes"
          tone="money"
        />
        <Stat
          label="Commandes"
          value={String(theirOrders.length)}
          detail={
            lastOrder
              ? `Dernière commande ${timeAgo(lastOrder.placedAt, DEMO_NOW)}`
              : "Aucune commande sur cette fiche pour l'instant"
          }
        />
        <Stat
          label="Conversations"
          value={String(theirConversations.length)}
          detail={
            theirConversations.length === 0
              ? "Aucune conversation pour l'instant"
              : unresolvedThreads === 0
                ? "Toutes résolues"
                : `${unresolvedThreads} à résoudre`
          }
        />
        <Stat
          label="Tâches en cours"
          value={String(openTasks.length)}
          detail={
            overdueTasks.length > 0
              ? `${overdueTasks.length} en retard`
              : openTasks.length === 0
                ? "Rien de prévu"
                : "Aucune en retard"
          }
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHead
            title="Activité, la plus récente en premier"
            hint="Chaque conversation, commande, tâche et note de ce client, quelle que soit la source d'arrivée."
          />
          <ActivityTimeline entries={entries} name={contact.name} />
        </Card>

        <div className="flex flex-col gap-3">
          <Card>
            <CardHead title="Détails" />
            <dl className="flex flex-col gap-2 text-[13px]">
              {facts.map((fact) => (
                <div
                  key={fact.label}
                  className="flex items-start justify-between gap-3 border-b border-line pb-2 last:border-b-0 last:pb-0"
                >
                  <dt className="shrink-0 text-muted">{fact.label}</dt>
                  {/* An email address is one long unbreakable word, so the value
                      is allowed to break rather than push the page sideways. */}
                  <dd className={`min-w-0 break-words text-right ${fact.mono ? "os-num" : ""}`}>
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-3 border-t border-line pt-3">
              <p className="os-label mb-1.5">Étiquettes</p>
              {contact.tags.length === 0 ? (
                <p className="text-[12.5px] text-muted">
                  Aucune étiquette sur cette fiche. Les étiquettes viennent de la boîte de réception,
                  au fur et à mesure que votre équipe lit les messages.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {contact.tags.map((tag) => (
                    <TagChip key={tag} label={tag} />
                  ))}
                </div>
              )}
            </div>
          </Card>

          <Card>
            <CardHead
              title="Commandes par source"
              hint={
                theirOrders.length === 1
                  ? "1 commande sur cette fiche"
                  : `${theirOrders.length} commandes sur cette fiche`
              }
            />
            {theirOrders.length === 0 ? (
              <p className="text-[13px] text-muted">
                Aucune commande n'a encore été passée sur cette fiche, il n'y a donc rien à répartir
                par source.
              </p>
            ) : (
              <>
                <ul className="flex flex-col gap-2.5">
                  {bySource.map((row) => (
                    <li key={row.channelId}>
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-1.5 text-[13px]">
                          <ChannelDot channelId={row.channelId} />
                          {row.label}
                        </span>
                        <span className="os-num text-[12.5px] text-muted">
                          {row.orders} {row.orders === 1 ? "commande" : "commandes"}
                        </span>
                      </div>
                      <span className="mt-1 block h-1.5 rounded-full bg-surface-2">
                        <span
                          className="block h-1.5 rounded-full bg-primary-mute"
                          style={{ width: `${Math.max(row.share, 4)}%` }}
                        />
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 border-t border-line pt-3 text-[12.5px] leading-relaxed text-muted">
                  {offFirstTouch > 0
                    ? `${offFirstTouch} de ces commandes ${
                        offFirstTouch === 1 ? "est arrivée" : "sont arrivées"
                      } sur un canal autre que ${
                        channel(contact.firstTouchChannel).label
                      }, le canal par lequel ce client est arrivé. Chaque commande garde sa propre source.`
                    : `Toutes les commandes de cette fiche sont arrivées sur ${
                        channel(contact.firstTouchChannel).label
                      }, le canal par lequel ce client est arrivé.`}
                </p>
                <p className="mt-2">
                  <Link
                    href={`/orders?q=${encodeURIComponent(contact.name)}&period=90`}
                    className="text-[13px] font-semibold text-primary hover:underline"
                  >
                    Voir toutes les commandes de {firstName}
                  </Link>
                </p>
              </>
            )}
          </Card>

          <p className="text-xs leading-relaxed text-muted">
            Modifier ce client, fusionner deux fiches en une seule et exporter son historique sont
            conçus mais pas construits. Rien sur cette page ne modifie vos données, et aucun message
            ne quitte Les Saveurs du Cap Bon depuis ici.
          </p>
        </div>
      </div>
    </div>
  );
}

function Missing() {
  return <span className="text-muted">Non renseigné</span>;
}
