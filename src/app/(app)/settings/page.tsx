import Link from "next/link";
import { ChannelDot, ConnectionPill, Pill, SourceBadge } from "@/components/ui/badges";
import { Card, CardHead, DemoChip, EmptyState, PageHeader } from "@/components/ui/surfaces";
import { CHANNEL_ORDER, channel } from "@/lib/domain/channels";
import type {
  ChannelConnection,
  ChannelId,
  ConnectionStatus,
  Order,
  TeamRole,
} from "@/lib/domain/types";
import { formatDateTime, formatTND, isOverdue, timeAgo } from "@/lib/format";
import { STORE } from "@/lib/mock/core";
import { DEMO_NOW } from "@/lib/mock/time";
import { getRepositories } from "@/lib/repositories";

export const metadata = { title: "Paramètres, Les Saveurs du Cap Bon" };

// The demo clock moves with the visit, so what is waiting right now is counted
// per request rather than frozen into the build.
export const dynamic = "force-dynamic";

const SECTIONS = [
  { id: "workspace", label: "Espace de travail" },
  { id: "regional", label: "Regional" },
  { id: "notifications", label: "Notifications" },
  { id: "data", label: "Données et confidentialite" },
  { id: "accounts", label: "Comptes connectes" },
];

const ROLE_COPY: Record<TeamRole, { label: string; can: string; settings: string }> = {
  owner: {
    label: "Propriétaire",
    can: "Voit toute la boutique, les chiffres d'argent compris, et c'est la seule personne qui peut ajouter quelqu'un ou le retirer.",
    settings: "Les modifie, le jour ou elles seront modifiables",
  },
  manager: {
    label: "Responsable",
    can: "Attribue le travail et lit les rapports. Voit toutes les conversations et toutes les commandes, mais pas la facturation.",
    settings: "Les consulte",
  },
  agent: {
    label: "Agent",
    can: "Travaille sur les conversations et les commandes qui lui sont attribuées, et ne voit rien en dehors.",
    settings: "Aucun accès",
  },
};

const NOTIFY_EVENTS = [
  {
    id: "silent",
    title: "Un canal n'apporte plus rien",
    body: "WhatsApp, Instagram, Facebook, Google ou le formulaire de votre site se tait alors qu'il ne devrait pas. C'est le seul cas qui merite d'interrompre votre journee, parce que rien ne s'accumule tant que la panne dure.",
    reaches: "Vous, dès que c'est constate",
  },
  {
    id: "waiting",
    title: "Une demande attend depuis deux heures sans personne dessus",
    body: "Quelqu'un a ecrit, personne ne l'a prise, et deux heures ont passe. Compte a partir du dernier message de la demande, pas du moment ou l'un de vous a ouvert la liste pour la première fois.",
    reaches: "Vous et votre responsable",
  },
  {
    id: "overdue",
    title: "Une relance depasse son échéance",
    body: "Un appel ou un prix a envoyer promis pour aujourd'hui n'est toujours pas fait.",
    reaches: "La personne qui en est responsable, puis vous le lendemain matin",
  },
  {
    id: "stock",
    title: "Un produit atteint son seuil de stock faible",
    body: "Le seuil se règle sur chaque produit, donc un article qui se vend a trente par mois peut alerter plus tot qu'un article qui se vend a douze par an.",
    reaches: "Vous",
  },
];

const STORED = [
  { label: "Nom", why: "Pour qu'une réponse commence par le bon nom." },
  { label: "Numéro de téléphone", why: "La societe de livraison le demande, et ici la plupart des clients repondent plus vite au téléphone que par email." },
  { label: "Email", why: "Conserve uniquement quand le client en a donne un, et utilisé pour la confirmation de commande." },
  { label: "Ville", why: "Determine les frais de livraison et le nombre de jours que prend la livraison." },
  { label: "Messages, reçus et envoyés", why: "Pour que la personne qui repond ensuite puisse lire ce qui a déjà été promis." },
  { label: "Commandes et leur contenu", why: "Votre trace de la vente, et la base de tous les chiffres de Statistiques." },
  { label: "Notes ecrites par votre équipe", why: "Ce qui a été convenu au téléphone, garde la ou la personne suivante ira regarder." },
  { label: "Le canal par lequel le client est arrive", why: "Pour qu'un client WhatsApp reste un client WhatsApp, et que vous voyiez quel canal est rentable." },
];

const RETENTION = [
  {
    label: "Messages",
    value: "24 mois",
    why: "Assez long pour retrouver ce qui a été promis la saison dernière, assez court pour que les vieux echanges ne restent pas ici pour toujours.",
  },
  {
    label: "Commandes et factures",
    value: "10 ans",
    why: "Votre comptabilite doit etre conservee, donc une commande reste même après la suppression du client qui est derriere.",
  },
  {
    label: "Photos et fichiers envoyés dans un message",
    value: "12 mois",
    why: "C'est ce qui pese le plus lourd dans ce qui est conserve, et ce qu'on rouvre le moins souvent.",
  },
  {
    label: "Contacts",
    value: "Jusqu'à ce que le client demande sa suppression",
    why: "Un client qui n'a pas ecrit depuis un an reste un client, donc rien n'est supprime au bout d'un délai.",
  },
];

const DELETION_REMOVES = [
  "Nom, numéro de téléphone, email et ville",
  "Tous les messages de toutes les conversations avec lui, sur tous les canaux",
  "Les notes que votre équipe a ecrites a son sujet",
  "Sa place dans le pipeline, ses etiquettes et son score du prospect",
];

const DELETION_KEEPS = [
  "La commande elle-même, sa date, son montant et son contenu, avec le client remplace par un numéro de référence, parce que votre comptabilite doit tomber juste",
  "Le nombre de commandes sur chaque canal, qui est un chiffre et non plus une personne",
];

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

function Avatar({ initials }: { initials: string }) {
  return (
    <span
      aria-hidden
      className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary-soft text-[11px] font-bold text-primary"
    >
      {initials}
    </span>
  );
}

function SettingRow({
  label,
  value,
  note,
  state,
  mono = false,
}: {
  label: string;
  value: string;
  note: string;
  state?: string;
  mono?: boolean;
}) {
  return (
    <div className="grid gap-1.5 border-t border-line py-3 first:border-t-0 first:pt-0 last:pb-0 sm:grid-cols-[150px_1fr] sm:gap-4">
      <dt className="os-label sm:pt-1">{label}</dt>
      <dd className="flex flex-col gap-1.5">
        <span className="flex flex-wrap items-center gap-2">
          <span className={`text-[14px] font-semibold ${mono ? "os-num" : ""}`}>{value}</span>
          {state ? <Pill tone="muted">{state}</Pill> : null}
        </span>
        <span className="max-w-[62ch] text-[12.5px] leading-relaxed text-muted">{note}</span>
      </dd>
    </div>
  );
}

function Placeholder({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-auto rounded-[var(--radius-sm)] border border-line bg-surface-2 px-3 py-2 text-[12px] leading-relaxed text-muted">
      <span className="font-semibold text-ink">Ecrit, pas encore applique. </span>
      {children}
    </p>
  );
}

interface ChannelSummary {
  channelId: ChannelId;
  accounts: number;
  statuses: ConnectionStatus[];
  lastEventAt: string | null;
  thisWeek: number;
  planned: number;
}

function summarise(connections: ChannelConnection[]): ChannelSummary[] {
  return CHANNEL_ORDER.map((channelId) => {
    const mine = connections.filter((c) => c.channelId === channelId);
    const stamps = mine
      .map((c) => c.lastEventAt)
      .filter((s): s is string => Boolean(s))
      .sort();
    return {
      channelId,
      accounts: mine.length,
      statuses: [...new Set(mine.map((c) => c.status))],
      lastEventAt: stamps.length ? stamps[stamps.length - 1] : null,
      thisWeek: mine.reduce((sum, c) => sum + c.eventsThisWeek, 0),
      planned: mine.filter((c) => c.planned).length,
    };
  }).filter((row) => row.accounts > 0);
}

export default async function SettingsPage() {
  const repos = getRepositories();
  const [team, connections, conversations, tasks, products, orders] = await Promise.all([
    repos.workspace.team(),
    repos.intégrations.list(),
    repos.conversations.list(),
    repos.workspace.tasks(),
    repos.workspace.products(),
    repos.orders.list(),
  ]);

  const roleCount = (role: TeamRole) => team.filter((m) => m.role === role).length;
  const teamShape = [
    plural(roleCount("owner"), "propriétaire", "proprietaires"),
    plural(roleCount("manager"), "responsable", "responsables"),
    plural(roleCount("agent"), "agent", "agents"),
  ].join(", ");

  const receiving = connections.filter((c) => c.status === "connected");
  const attention = connections.filter(
    (c) => !c.planned && (c.status === "setup_required" || c.status === "warning" || c.status === "error"),
  );
  const planned = connections.filter((c) => c.planned);
  const byChannel = summarise(connections);

  // The worked example is a real order rather than a written one, so the three
  // decimals shown here are the same three decimals the order list prints.
  const newestFirst = [...orders].sort(
    (a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime(),
  );
  const moneyExample: Order | undefined =
    newestFirst.find((o) => o.items.length === 1 && o.items[0].quantity === 1 && o.deliveryFee > 0) ??
    newestFirst.find((o) => o.items.length === 1) ??
    newestFirst[0];

  // The four events below are counted from the same records the rest of the
  // product reads, so the screen cannot promise a notice it could not send.
  const twoHours = 2 * 60 * 60 * 1000;
  const unattended = conversations
    .filter(
      (c) =>
        !c.assigneeId &&
        c.status !== "resolved" &&
        DEMO_NOW.getTime() - new Date(c.lastMessageAt).getTime() > twoHours,
    )
    .sort((a, b) => new Date(a.lastMessageAt).getTime() - new Date(b.lastMessageAt).getTime());
  const overdue = tasks.filter((t) => !t.completedAt && isOverdue(t.dueAt, DEMO_NOW));
  const lowStock = products.filter((p) => p.stock <= p.lowStockAt);
  const silent = connections.filter(
    (c) => !c.planned && (c.status === "error" || c.status === "warning"),
  );
  const silentChannels = [...new Set(silent.map((c) => c.channelId))];

  const live: {
    id: string;
    title: string;
    détail: string;
    href: string;
    linkLabel: string;
    channelIds: ChannelId[];
  }[] = [];

  if (silent.length > 0) {
    live.push({
      id: "silent",
      title: `${plural(silent.length, "canal ne reçoit", "canaux ne recoivent")} plus correctement`,
      détail:
        "Tant qu'un canal est dans cet etat, ce qu'un client envoie peut se perdre, et il n'a aucun signe que quelque chose n'a pas fonctionne.",
      href: "/integrations",
      linkLabel: "Voir ce qui ne va pas",
      channelIds: silentChannels,
    });
  }
  if (unattended.length > 0) {
    live.push({
      id: "waiting",
      title: `${plural(unattended.length, "demande attend", "demandes attendent")} depuis plus de deux heures sans personne dessus`,
      détail: `La plus ancienne a recu son dernier message ${timeAgo(unattended[0].lastMessageAt, DEMO_NOW)}, et n'a toujours personne dessus.`,
      href: "/inbox?assignee=none",
      linkLabel: "Ouvrir la boîte de réception",
      channelIds: [],
    });
  }
  if (overdue.length > 0) {
    live.push({
      id: "overdue",
      title: `${plural(overdue.length, "relance est", "relances sont")} maintenant en retard`,
      détail: "Chacune a déjà une personne en face, donc c'est un rappel plutot qu'un nouveau travail.",
      href: "/tasks",
      linkLabel: "Ouvrir les tâches",
      channelIds: [],
    });
  }
  if (lowStock.length > 0) {
    live.push({
      id: "stock",
      title: `${plural(lowStock.length, "produit est", "produits sont")} au seuil de stock faible ou en dessous`,
      détail: `${lowStock
        .slice(0, 2)
        .map((p) => p.name)
        .join(", ")}${lowStock.length > 2 ? ", et d'autres" : ""}.`,
      href: "/products",
      linkLabel: "Ouvrir les produits",
      channelIds: [],
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Paramètres"
        subtitle="Comment cet espace de travail se comporte. Chaque section dit ce qui est règle aujourd'hui, et ce qui reste fige jusqu'à l'arrivee de la connexion et de la base de données."
        actions={<DemoChip />}
      />

      <nav aria-label="Sections de cet écran" className="flex flex-wrap gap-1.5">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-muted hover:border-line-strong hover:text-ink"
          >
            {s.label}
          </a>
        ))}
      </nav>

      {/* Workspace ------------------------------------------------------ */}
      <section id="workspace" aria-labelledby="workspace-heading" className="flex flex-col gap-3">
        <h2 id="workspace-heading" className="os-label">Espace de travail</h2>

        <Card>
          <CardHead
            title="Nom et membres"
            hint={`La boutique a laquelle appartient cet espace de travail, et les ${plural(team.length, "personne", "personnes")} qui peuvent l'ouvrir.`}
          />
          <dl className="flex flex-col">
            {/* The name comes from the shop record the shell reads, so this row
                and the name in the top corner can never drift apart. */}
            <SettingRow
              label="Nom de l'espace de travail"
              value={STORE.name}
              state="Pas encore modifiable"
              note="Le nom de la boutique dont cet espace de travail tient les commandes. C'est le même nom que celui affiche dans le coin superieur de chaque écran. Il devient modifiable avec l'étape de connexion, et vous serez la seule personne a pouvoir le changer."
            />
            <SettingRow
              label="Personnes"
              value={plural(team.length, "personne", "personnes")}
              note={`${teamShape}. Personne en dehors de cette liste ne voit cet espace de travail, et il n'existe aucun lien public vers lui.`}
              mono
            />
          </dl>

          <div className="os-scroll mt-4">
            <table className="w-full min-w-[760px] border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-line">
                  <th className="os-label pb-2 font-normal">Personne</th>
                  <th className="os-label pb-2 font-normal">Role</th>
                  <th className="os-label pb-2 font-normal">Ce que ce role peut faire</th>
                  <th className="os-label pb-2 font-normal">Ces paramètres</th>
                </tr>
              </thead>
              <tbody>
                {team.map((member) => {
                  const role = ROLE_COPY[member.role];
                  return (
                    <tr key={member.id} className="border-b border-line align-top last:border-b-0">
                      <td className="py-3 pr-4">
                        <span className="flex items-center gap-2 font-semibold">
                          <Avatar initials={member.initials} />
                          {member.name}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <Pill tone={member.role === "owner" ? "primary" : "muted"}>{role.label}</Pill>
                      </td>
                      <td className="max-w-[42ch] py-3 pr-4 text-muted">{role.can}</td>
                      <td className="py-3 text-muted">{role.settings}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="mt-3 max-w-[74ch] rounded-[var(--radius-sm)] border border-line bg-surface-2 px-3 py-2 text-[12.5px] leading-relaxed text-muted">
            <span className="font-semibold text-ink">Inviter quelqu'un arrive avec l'étape de connexion. </span>
            Il n'y a pas encore de moyen de se connecter, donc une invitation serait un email qui mene
            a une porte qui ne s'ouvre pas. C'est pour cela qu'il n'y a pas de bouton d'invitation ici,
            plutot qu'un bouton qui echoue.
          </p>
        </Card>
      </section>

      {/* Regional ------------------------------------------------------- */}
      <section id="regional" aria-labelledby="regional-heading" className="flex flex-col gap-3">
        <h2 id="regional-heading" className="os-label">Regional</h2>

        <div className="grid gap-3 lg:grid-cols-[1.35fr_1fr]">
          <Card>
            <CardHead title="Monnaie, langue et heure" hint="Regle pour une boutique qui vend a Tunis." />
            <dl className="flex flex-col">
              <SettingRow
                label="Monnaie"
                value="Dinar tunisien, trois decimales"
                state="Pas encore modifiable"
                note="Chaque montant du produit s'ecrit de la même facon, d'une ligne de commande jusqu'au budget. Une deuxieme monnaie n'est pas prévue, parce que la boutique vend en dinars."
              />
              <SettingRow
                label="Langue"
                value="Francais, sur chaque écran"
                state="Pas encore modifiable"
                note="L'interface est en francais. Ce que vos clients ecrivent reste dans la langue dans laquelle ils l'ont ecrit, francais, arabe ou anglais, et n'est jamais traduit a l'arrivee. Choisir une autre langue d'interface vient plus tard, après la base de données."
              />
              <SettingRow
                label="Fuseau horaire"
                value="Tunis, GMT+1 toute l'année"
                state="Pas encore modifiable"
                note={`La Tunisie ne change pas d'heure en été, donc une commande horodatee a 14:20 a été passee a 14:20 dans la boutique. La démonstration n'a pas de serveur a Tunis derriere elle : elle lit l'horloge de la machine sur laquelle elle tourne, qui indique ${formatDateTime(DEMO_NOW.toISOString())} en ce moment.`}
              />
              <SettingRow
                label="La semaine commence le"
                value="Lundi"
                state="Pas encore modifiable"
                note="Utilisé par tous les chiffres qui parlent de cette semaine, sur le tableau de bord et sur Statistiques."
              />
            </dl>
          </Card>

          <Card className="flex flex-col">
            <CardHead
              title="Comment les montants s'ecrivent ici"
              hint={
                moneyExample
                  ? `Commande ${moneyExample.reference} des données d'exemple, ecrite comme chaque écran l'ecrit.`
                  : "La facon dont chaque écran ecrit un montant."
              }
            />
            {moneyExample ? (
              <>
                <dl className="flex flex-col gap-2 rounded-[var(--radius-md)] border border-accent-line bg-accent-soft px-3.5 py-3 text-[13px] text-accent-ink">
                  {moneyExample.items.map((line) => (
                    <div key={line.id} className="flex items-baseline justify-between gap-4">
                      <dt>
                        {line.name}
                        {line.quantity > 1 ? `, ${line.quantity} unités` : ""}
                      </dt>
                      <dd className="os-num font-semibold">
                        {formatTND(line.unitPrice * line.quantity)}
                      </dd>
                    </div>
                  ))}
                  <div className="flex items-baseline justify-between gap-4">
                    <dt>Livraison</dt>
                    <dd className="os-num font-semibold">{formatTND(moneyExample.deliveryFee)}</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4 border-t border-accent-line pt-2">
                    <dt className="font-semibold">Ce que le client paie</dt>
                    <dd className="os-num text-[15px] font-bold">{formatTND(moneyExample.total)}</dd>
                  </div>
                </dl>
                <Link
                  href={`/orders/${moneyExample.reference}`}
                  className="mt-2 inline-block text-[12.5px] font-semibold text-primary hover:underline"
                >
                  Ouvrir cette commande
                </Link>
              </>
            ) : null}
            <p className="mt-3 max-w-[52ch] text-[12.5px] leading-relaxed text-muted">
              La virgule separe les dinars des millimes, et mille millimes font un dinar, donc un
              montant se lit ici en dinars et jamais en milliers. Les montants sont tenus au millime
              et ne sont jamais arrondis vers le haut pour arriver a un total.
            </p>
          </Card>
        </div>
      </section>

      {/* Notifications -------------------------------------------------- */}
      <section id="notifications" aria-labelledby="notifications-heading" className="flex flex-col gap-3">
        <h2 id="notifications-heading" className="os-label">Notifications</h2>

        <div className="grid gap-3 lg:grid-cols-[1.35fr_1fr]">
          <Card>
            <CardHead
              title="Ce dont la boutique vous avertira"
              hint="Quatre choses qui meritent de vous sortir de ce que vous etiez en train de faire. Tout le reste attend que vous alliez regarder."
            />
            <ul className="flex flex-col">
              {NOTIFY_EVENTS.map((event) => (
                <li key={event.id} className="border-t border-line py-3 first:border-t-0 first:pt-0 last:pb-0">
                  <p className="text-[14px] font-semibold">{event.title}</p>
                  <p className="mt-1 max-w-[68ch] text-[12.5px] leading-relaxed text-muted">{event.body}</p>
                  <p className="mt-1.5 text-[12px] text-faint">Destinataire : {event.reaches}</p>
                </li>
              ))}
            </ul>
            <p className="mt-3 max-w-[74ch] rounded-[var(--radius-sm)] border border-line bg-surface-2 px-3 py-2 text-[12.5px] leading-relaxed text-muted">
              <span className="font-semibold text-ink">Ce sont ces quatre cas que le produit signalera. </span>
              Vous les envoyer, par email ou sur votre téléphone, arrive après l'étape de connexion,
              parce qu'il n'y a encore nulle part ou garder une adresse qui vous appartient. Rien ne
              quitte l'écran aujourd'hui : les trois premiers apparaissent dans le bouton Alertes en
              haut, et celui du stock faible sur Produits et sur le tableau de bord.
            </p>
          </Card>

          <Card className="flex flex-col">
            <CardHead
              title="Ce qui serait envoyé maintenant"
              hint="Compte a partir des données d'exemple avec les memes règles, pour que vous voyiez ce que ces quatre cas attrapent vraiment."
            />
            {live.length === 0 ? (
              <EmptyState
                title="Rien ne vous parviendrait maintenant"
                body="Tous les canaux recoivent correctement, aucune demande n'a attendu deux heures sans personne dessus, aucune relance n'est en retard et aucun produit n'est descendu a son seuil de stock faible."
                action={{ label: "Ouvrir la boîte de réception", href: "/inbox" }}
              />
            ) : (
              <ul className="flex flex-col">
                {live.map((item) => (
                  <li
                    key={item.id}
                    className="border-t border-line py-3 first:border-t-0 first:pt-0 last:pb-0"
                  >
                    <p className="text-[13.5px] font-semibold">{item.title}</p>
                    {item.channelIds.length > 0 ? (
                      <p className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {item.channelIds.map((id) => (
                          <span
                            key={id}
                            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-2 py-0.5 text-[11px] font-semibold"
                          >
                            <ChannelDot channelId={id} size={7} />
                            {channel(id).label}
                          </span>
                        ))}
                      </p>
                    ) : null}
                    <p className="mt-1.5 max-w-[52ch] text-[12.5px] leading-relaxed text-muted">
                      {item.détail}
                    </p>
                    <Link
                      href={item.href}
                      className="mt-1.5 inline-block text-[12.5px] font-semibold text-primary hover:underline"
                    >
                      {item.linkLabel}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </section>

      {/* Data and privacy ------------------------------------------------ */}
      <section id="data" aria-labelledby="data-heading" className="flex flex-col gap-3">
        <h2 id="data-heading" className="os-label">Données et confidentialite</h2>

        <div className="grid gap-3 xl:grid-cols-3">
          <Card className="flex flex-col">
            <CardHead
              title="Ce qui est conserve sur un client"
              hint="Uniquement ce qu'il faut pour lui repondre et pour le livrer."
            />
            <dl className="flex flex-col gap-2 text-[12.5px]">
              {STORED.map((row) => (
                <div key={row.label}>
                  <dt className="font-semibold">{row.label}</dt>
                  <dd className="leading-relaxed text-muted">{row.why}</dd>
                </div>
              ))}
            </dl>
            <p className="my-3 rounded-[var(--radius-sm)] border border-line bg-surface-2 px-3 py-2 text-[12px] leading-relaxed text-muted">
              Aucun numéro de carte n'est jamais conserve ici. Le paiement se fait en especes a la
              livraison ou par la societe de livraison, donc une carte ne passe jamais par Les Saveurs
              du Cap Bon.
            </p>
            <Placeholder>
              C'est la règle telle qu'elle est aujourd'hui, ecrite avant que les données existent.
              Elle commence a s'appliquer le jour ou la base de données est allumee.
            </Placeholder>
          </Card>

          <Card className="flex flex-col">
            <CardHead
              title="Combien de temps les choses sont conservees"
              hint="Un parametre avec une valeur par defaut, une ligne par type d'enregistrement."
            />
            <dl className="flex flex-col">
              {RETENTION.map((row) => (
                <div
                  key={row.label}
                  className="border-t border-line py-2.5 first:border-t-0 first:pt-0"
                >
                  <dt className="flex items-baseline justify-between gap-3 text-[13px] font-semibold">
                    <span>{row.label}</span>
                    <span className="os-num shrink-0 text-[12.5px] text-primary">{row.value}</span>
                  </dt>
                  <dd className="mt-0.5 text-[12px] leading-relaxed text-muted">{row.why}</dd>
                </div>
              ))}
            </dl>
            <p className="my-3 text-[12px] leading-relaxed text-muted">
              Ce sont les valeurs par defaut. Les changer devient un parametre que vous pourrez
              deplacer une fois la base de données en service, et une duree plus courte ne supprimera
              que pour la suite, sans jamais revenir en arriere retirer ce que vous avez déjà.
            </p>
            <Placeholder>
              Rien n'est supprime a échéance aujourd'hui, parce que les données d'exemple vivent dans
              l'application et non dans une base de données.
            </Placeholder>
          </Card>

          <Card className="flex flex-col">
            <CardHead
              title="Si un client demande a etre supprime"
              hint="Ce que vous feriez, et ce que cela retirerait."
            />
            <ol className="flex flex-col gap-1.5 text-[12.5px] leading-relaxed">
              <li className="flex gap-2">
                <span className="os-num shrink-0 font-bold text-primary">1.</span>
                Le client demande, sur n'importe quel canal ou par téléphone. Personne n'a a prouver
                son identite au-dela du numéro ou de l'adresse depuis lesquels il a ecrit.
              </li>
              <li className="flex gap-2">
                <span className="os-num shrink-0 font-bold text-primary">2.</span>
                Vous ouvrez sa fiche contact et vous notez la demande, avec la date.
              </li>
              <li className="flex gap-2">
                <span className="os-num shrink-0 font-bold text-primary">3.</span>
                C'est fait sous trente jours, et vous ecrivez une fois pour dire que c'est fait.
              </li>
            </ol>

            <p className="os-label mt-3">Supprime</p>
            <ul className="mt-1 flex flex-col gap-1 text-[12.5px] leading-relaxed text-muted">
              {DELETION_REMOVES.map((line) => (
                <li key={line} className="flex gap-2">
                  <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                  {line}
                </li>
              ))}
            </ul>

            <p className="os-label mt-3">Conserve</p>
            <ul className="mt-1 mb-3 flex flex-col gap-1 text-[12.5px] leading-relaxed text-muted">
              {DELETION_KEEPS.map((line) => (
                <li key={line} className="flex gap-2">
                  <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-line-strong" />
                  {line}
                </li>
              ))}
            </ul>

            <Placeholder>
              Un bouton sur la fiche contact qui fait tout cela d'un coup est concu, pas construit.
              La demande se note a la main pour le moment.
            </Placeholder>
          </Card>
        </div>
      </section>

      {/* Connected accounts ---------------------------------------------- */}
      <section id="accounts" aria-labelledby="accounts-heading" className="flex flex-col gap-3">
        <h2 id="accounts-heading" className="os-label">Comptes connectes</h2>

        <Card>
          <CardHead
            title="D'ou arrivent vos commandes"
            hint={`${plural(receiving.length, "source apporte", "sources apportent")} des commandes, ${plural(attention.length, "attend", "attendent")} quelque chose de vous, et ${plural(planned.length, "est prévue", "sont prevues")}.`}
            action={
              <Link
                href="/integrations"
                className="rounded-[var(--radius-md)] border border-line bg-surface px-3 py-1.5 text-xs font-semibold hover:border-line-strong"
              >
                Ouvrir Intégrations
              </Link>
            }
          />

          {byChannel.length === 0 ? (
            <EmptyState
              title="Aucune source n'est encore configuree"
              body="Rien n'est liste ici parce qu'aucun connecteur n'a été ajouté a cet espace de travail."
              action={{ label: "Ouvrir Intégrations", href: "/integrations" }}
            />
          ) : (
            <div className="os-scroll">
              <table className="w-full min-w-[620px] border-collapse text-left text-[13px]">
                <thead>
                  <tr className="border-b border-line">
                    <th className="os-label pb-2 font-normal">Source</th>
                    <th className="os-label pb-2 font-normal">Comptes</th>
                    <th className="os-label pb-2 font-normal">Etat</th>
                    <th className="os-label pb-2 font-normal">Dernière commande reçue</th>
                    <th className="os-label pb-2 text-right font-normal">Commandes cette semaine</th>
                  </tr>
                </thead>
                <tbody>
                  {byChannel.map((row) => (
                    <tr key={row.channelId} className="border-b border-line align-middle last:border-b-0">
                      <td className="py-2.5 pr-4">
                        <SourceBadge channelId={row.channelId} size="sm" />
                      </td>
                      <td className="py-2.5 pr-4 text-muted">
                        <span className="os-num">{row.accounts}</span>
                        {row.planned > 0 ? (
                          <span className="ml-1.5 text-[11.5px]">
                            (<span className="os-num">{row.planned}</span> prevus)
                          </span>
                        ) : null}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className="flex flex-wrap gap-1.5">
                          {row.statuses.map((status) => (
                            <ConnectionPill key={status} status={status} />
                          ))}
                        </span>
                      </td>
                      <td className="os-num py-2.5 pr-4 text-[12px] text-muted">
                        {row.lastEventAt ? timeAgo(row.lastEventAt, DEMO_NOW) : "Jamais"}
                      </td>
                      <td className="os-num py-2.5 text-right font-semibold">{row.thisWeek}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="mt-3 max-w-[76ch] text-[12.5px] leading-relaxed text-muted">
            Ce dont chaque compte a besoin, ce qui lui manque encore et ce qui est en panne se
            trouvent sur Intégrations, donc ce n'est pas repete ici. Tous les etats de ce tableau sont
            des données d'exemple : aucun compte WhatsApp, Instagram, Facebook ou Google réel n'est
            rattache a cet espace de travail, et rien de ce que vous faites dans le produit n'atteint
            un client.
          </p>
        </Card>
      </section>
    </div>
  );
}
