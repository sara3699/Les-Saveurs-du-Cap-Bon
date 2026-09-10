import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChannelId, Contact, ContactNote, PipelineStage } from "@/lib/domain/types";
import type { ContactRepository } from "../types";

/**
 * Contacts read from the shop's own rows. Row level security already decides
 * which shop those are, so nothing here ever mentions organization_id: adding
 * the filter by hand would only hide the day the policy stops working.
 */

/** Everything a Contact needs, and nothing a contact list has to pay for twice. */
const CONTACT_COLUMNS = `
  id, name, phone, email, city, language,
  first_touch_channel, latest_touch_channel, first_contact_at,
  stage, lead_score, lead_score_reasons, lifetime_value, owner_member_id,
  contact_tags(tags(label)),
  contact_notes(id, author_member_id, created_at, body)
`;

interface TagJoinRow {
  tags: { label: string } | { label: string }[] | null;
}

interface NoteRow {
  id: string;
  author_member_id: string | null;
  created_at: string;
  body: string;
}

interface ContactRow {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  language: string;
  first_touch_channel: string;
  latest_touch_channel: string;
  first_contact_at: string;
  stage: string;
  lead_score: number | string | null;
  lead_score_reasons: string[] | null;
  lifetime_value: number | string | null;
  owner_member_id: string | null;
  contact_tags: TagJoinRow[] | null;
  contact_notes: NoteRow[] | null;
}

interface DuplicateRow {
  id: string;
  phone: string | null;
  email: string | null;
}

/** PostgREST returns numeric as a string, and a lifetime value of "NaN TND" is worse than zero. */
function num(value: number | string | null | undefined): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * The domain holds ISO strings and the demo set wrote them in UTC. Postgres
 * returns an offset form instead, so it is normalised here rather than in each
 * screen. An unparseable value is passed through, because toISOString throws
 * and one bad row should not take a page down.
 */
function iso(value: string): string {
  const at = new Date(value);
  return Number.isNaN(at.getTime()) ? value : at.toISOString();
}

function toLabels(rows: TagJoinRow[] | null): string[] {
  const labels = (rows ?? []).flatMap((row) => {
    const tag = row.tags;
    if (!tag) return [];
    return Array.isArray(tag) ? tag.map((t) => t.label) : [tag.label];
  });
  // contact_tags carries no order of its own, so the screen gets a stable one
  // instead of whatever order the join happened to return.
  return labels.sort((a, b) => a.localeCompare(b));
}

function toNotes(rows: NoteRow[] | null): ContactNote[] {
  return (rows ?? []).map((row) => ({
    id: row.id,
    // A note whose author left the team keeps its body and loses its name. The
    // domain type has no room for a missing author, and inventing a member id
    // would attach the words to someone who never wrote them.
    authorId: row.author_member_id ?? "",
    createdAt: iso(row.created_at),
    body: row.body,
  }));
}

function toContact(row: ContactRow): Contact {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    city: row.city,
    language: row.language,
    firstTouchChannel: row.first_touch_channel as ChannelId,
    latestTouchChannel: row.latest_touch_channel as ChannelId,
    firstContactAt: iso(row.first_contact_at),
    stage: row.stage as PipelineStage,
    tags: toLabels(row.contact_tags),
    leadScore: num(row.lead_score),
    leadScoreReasons: row.lead_score_reasons ?? [],
    lifetimeValue: num(row.lifetime_value),
    ownerId: row.owner_member_id,
    notes: toNotes(row.contact_notes),
  };
}

export function supabaseContacts(client: SupabaseClient): ContactRepository {
  return {
    async list() {
      const { data } = await client
        .from("contacts")
        .select(CONTACT_COLUMNS)
        // A Contact cannot say it was archived, so an archived one shown on the
        // list would look like a live customer nobody has called yet.
        .is("archived_at", null)
        // Ordered by the database collation rather than localeCompare; the two
        // agree on this alphabet and only the database can order the whole set.
        .order("name", { ascending: true })
        .order("created_at", { referencedTable: "contact_notes", ascending: false });

      return ((data ?? []) as unknown as ContactRow[]).map(toContact);
    },

    async byId(id) {
      const { data, error } = await client
        .from("contacts")
        .select(CONTACT_COLUMNS)
        .eq("id", id)
        .order("created_at", { referencedTable: "contact_notes", ascending: false })
        .maybeSingle();

      // The caller named one record. A failed query has to say so rather than
      // come back as a contact that does not exist. An archived contact still
      // answers here: whoever asked for it by id already knows which one it is.
      if (error) throw error;
      return data ? toContact(data as unknown as ContactRow) : null;
    },

    async duplicates() {
      const { data } = await client
        .from("contacts")
        .select("id, phone, email")
        .is("archived_at", null)
        .order("name", { ascending: true });

      // One pass over the shop's contacts, not a query per contact. Phone and
      // email share a single bucket exactly as the demo set did, because what
      // the screen warns about is a repeated value, whichever column holds it.
      const buckets = new Map<string, string[]>();
      for (const row of (data ?? []) as unknown as DuplicateRow[]) {
        for (const value of [row.phone, row.email]) {
          if (!value) continue;
          const key = value.toLowerCase();
          buckets.set(key, [...(buckets.get(key) ?? []), row.id]);
        }
      }

      return [...buckets.entries()]
        .filter(([, ids]) => ids.length > 1)
        .map(([value, contactIds]) => ({ value, contactIds }));
    },
  };
}
