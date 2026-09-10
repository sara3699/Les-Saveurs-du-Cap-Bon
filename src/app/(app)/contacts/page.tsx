import Link from "next/link";
import { ContactsTable, STAGE_COPY, type ContactRow } from "@/components/contacts/ContactsTable";
import { DuplicateNotice, type DuplicatePair } from "@/components/contacts/DuplicateNotice";
import { ImportWalkthrough } from "@/components/contacts/ImportWalkthrough";
import { ChannelDot } from "@/components/ui/badges";
import { Card, CardHead, DemoChip, PageHeader } from "@/components/ui/surfaces";
import { buildAttributionIndex, resolveSource, touchSummary } from "@/lib/domain/attribution";
import { CHANNEL_ORDER, channel } from "@/lib/domain/channels";
import type { ChannelId, Contact, PipelineStage, SourceAttribution } from "@/lib/domain/types";
import { formatTND } from "@/lib/format";
import { getRepositories } from "@/lib/repositories";

export const metadata = { title: "Contacts, Les Saveurs du Cap Bon" };

type Params = Promise<Record<string, string | string[] | undefined>>;

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

const STAGES: PipelineStage[] = ["new", "contacted", "qualified", "proposal", "won", "lost"];

function digitsOf(value: string): string {
  return value.replace(/\D/g, "");
}

export default async function ContactsPage({ searchParams }: { searchParams: Params }) {
  const params = await searchParams;
  const source = one(params.source) as ChannelId | undefined;
  const stage = one(params.stage) as PipelineStage | undefined;
  const owner = one(params.owner);
  const query = (one(params.q) ?? "").trim();

  const repos = getRepositories();
  const [contacts, duplicateGroups, team, connections, attributions] = await Promise.all([
    repos.contacts.list(),
    repos.contacts.duplicates(),
    repos.workspace.team(),
    repos.integrations.list(),
    repos.workspace.attributions(),
  ]);

  const index = buildAttributionIndex(attributions, connections);
  const teamById = new Map(team.map((member) => [member.id, member.name]));
  const contactById = new Map(contacts.map((contact) => [contact.id, contact]));

  // Contacts carry the channel itself, but the account behind it lives on the
  // attribution, so the badge can say which WhatsApp number or which page the
  // customer actually reached.
  const attributionsByContact = new Map<string, SourceAttribution[]>();
  for (const attribution of attributions) {
    if (!attribution.contactId) continue;
    const held = attributionsByContact.get(attribution.contactId);
    if (held) held.push(attribution);
    else attributionsByContact.set(attribution.contactId, [attribution]);
  }

  const accountFor = (contactId: string, channelId: ChannelId, latest: boolean): string | null => {
    const matching = (attributionsByContact.get(contactId) ?? [])
      .filter((attribution) => attribution.channelId === channelId)
      .sort((a, b) => new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime());
    if (matching.length === 0) return null;
    const chosen = latest ? matching[matching.length - 1] : matching[0];
    return resolveSource(chosen.id, index).accountLabel;
  };

  const duplicateNotes = new Map<string, string>();
  const groups = duplicateGroups.map((group) => {
    const members = group.contactIds
      .map((id) => contactById.get(id))
      .filter((contact): contact is Contact => Boolean(contact));
    const field = group.value.includes("@") ? "email address" : "phone number";
    const display =
      field === "email address"
        ? members.find((member) => member.email)?.email ?? group.value
        : members.find((member) => member.phone)?.phone ?? group.value;

    for (const member of members) {
      const others = members.filter((other) => other.id !== member.id).map((other) => other.name);
      duplicateNotes.set(member.id, `Shares a ${field} with ${others.join(" and ")}`);
    }

    return { key: group.value, field, display, members };
  });

  const searchDigits = digitsOf(query);
  const needle = query.toLowerCase();
  const filtered = contacts.filter((contact) => {
    if (source && contact.firstTouchChannel !== source) return false;
    if (stage && contact.stage !== stage) return false;
    if (owner === "none" && contact.ownerId !== null) return false;
    if (owner && owner !== "none" && contact.ownerId !== owner) return false;
    if (query) {
      const haystack = [contact.name, contact.email ?? "", contact.phone ?? ""]
        .join(" ")
        .toLowerCase();
      const byText = haystack.includes(needle);
      const byNumber =
        searchDigits.length >= 3 && digitsOf(contact.phone ?? "").includes(searchDigits);
      if (!byText && !byNumber) return false;
    }
    return true;
  });

  const rows: ContactRow[] = filtered.map((contact) => {
    const touch = touchSummary(contact.firstTouchChannel, contact.latestTouchChannel);
    return {
      id: contact.id,
      name: contact.name,
      href: `/contacts/${contact.id}`,
      firstTouch: contact.firstTouchChannel,
      firstAccount: accountFor(contact.id, contact.firstTouchChannel, false),
      latestTouch: contact.latestTouchChannel,
      latestAccount: accountFor(contact.id, contact.latestTouchChannel, true),
      moved: touch.changed,
      city: contact.city,
      phone: contact.phone,
      stage: contact.stage,
      lifetimeLabel: formatTND(contact.lifetimeValue, { withCurrency: false }),
      spent: contact.lifetimeValue > 0,
      owner: contact.ownerId ? teamById.get(contact.ownerId) ?? null : null,
      duplicateNote: duplicateNotes.get(contact.id) ?? null,
    };
  });

  // The duplicate panel names records that a filter may have taken off the
  // screen, so it is told whether every record it names is actually below it.
  const shownIds = new Set(rows.map((row) => row.id));
  const pairs: DuplicatePair[] = groups.map((group) => ({
    id: group.key,
    field: group.field,
    value: group.display,
    members: group.members.map((member) => ({
      id: member.id,
      name: member.name,
      href: `/contacts/${member.id}`,
    })),
  }));
  const allDuplicatesShown = groups.every((group) =>
    group.members.every((member) => shownIds.has(member.id)),
  );

  const movedCount = contacts.filter(
    (contact) => touchSummary(contact.firstTouchChannel, contact.latestTouchChannel).changed,
  ).length;

  const anyFilter = Boolean(source || stage || owner || query);
  const subtitle = anyFilter
    ? `${rows.length} of ${contacts.length} customers match these filters. Across the whole list, ${movedCount} now write on a different channel from the one they arrived on.`
    : `${contacts.length} customers, and ${movedCount} of them now write on a different channel from the one they arrived on.`;

  const keep = (extra: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const merged = { source, stage, owner, q: query || undefined, ...extra };
    for (const [name, value] of Object.entries(merged)) {
      if (value) next.set(name, String(value));
    }
    const qs = next.toString();
    return qs ? `/contacts?${qs}` : "/contacts";
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Contacts"
        subtitle={subtitle}
        actions={<DemoChip />}
      />

      <Card>
        <p className="os-label">Filter by the channel they arrived on</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Link
            href={keep({ source: undefined })}
            aria-current={source ? undefined : "true"}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
              source ? "border-line bg-surface-2 text-muted" : "border-primary bg-primary text-white"
            }`}
          >
            All sources
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

        <form className="mt-3 grid gap-2 border-t border-line pt-3 sm:grid-cols-2 lg:grid-cols-3">
          {source ? <input type="hidden" name="source" value={source} /> : null}
          <label className="flex flex-col gap-1">
            <span className="os-label">Search</span>
            <input
              name="q"
              defaultValue={query}
              placeholder="Name, phone number or email"
              className="rounded-[var(--radius-sm)] border border-line bg-surface-2 px-2.5 py-1.5 text-[13px]"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="os-label">Stage</span>
            <select
              name="stage"
              defaultValue={stage ?? ""}
              className="rounded-[var(--radius-sm)] border border-line bg-surface-2 px-2.5 py-1.5 text-[13px]"
            >
              <option value="">Any stage</option>
              {STAGES.map((value) => (
                <option key={value} value={value}>
                  {STAGE_COPY[value].label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="os-label">Owner</span>
            <span className="flex gap-1.5">
              <select
                name="owner"
                defaultValue={owner ?? ""}
                className="w-full rounded-[var(--radius-sm)] border border-line bg-surface-2 px-2.5 py-1.5 text-[13px]"
              >
                <option value="">Anyone</option>
                <option value="none">Nobody yet</option>
                {team.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-[var(--radius-sm)] bg-primary px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-primary-hi"
              >
                Apply
              </button>
            </span>
          </label>
        </form>
      </Card>

      <DuplicateNotice pairs={pairs} allShown={allDuplicatesShown} />

      <Card>
        <ContactsTable rows={rows} />
        <p className="mt-3 border-t border-line pt-3 text-xs text-muted">
          First touch is the channel a customer arrived on and is never rewritten. Most recent moves
          when the same person writes from somewhere else, which is how you see that Instagram
          brought someone in even though the order was placed on the website.
        </p>
      </Card>

      <Card>
        <CardHead
          title="Import contacts from a file"
          hint="A walkthrough on sample rows, in five steps: the file, the columns, a preview, the checks, then a confirmation you can cancel."
        />
        <ImportWalkthrough
          existing={contacts.map((contact) => ({
            name: contact.name,
            phone: contact.phone,
            email: contact.email,
          }))}
        />
        <p className="mt-4 border-t border-line pt-3 text-xs text-muted">
          Exporting this list to a file is designed and arrives later, so there is no export button
          on this screen yet.
        </p>
      </Card>
    </div>
  );
}
