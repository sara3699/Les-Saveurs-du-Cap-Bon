import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  Conversation,
  ConversationStatus,
  Message,
  MessageAttachment,
  MessageDirection,
} from "@/lib/domain/types";
import type { ConversationFilter, ConversationRepository } from "../types";

/**
 * The demo repository is the specification for this file: the same filters, the
 * same ordering, the same empty answers. Only the place the work happens moves.
 *
 * Nothing below filters by organization_id. Row level security already limits
 * every row to the caller's shop, and a hand-written tenant filter here would be
 * a second, weaker copy of that rule waiting to drift from it.
 */

/**
 * Written out rather than assembled from pieces: the client reads the select
 * string as a literal type to work out the shape it returns, and a string built
 * with + or a template widens to plain string and loses that.
 */
const CONVERSATION_COLUMNS =
  "id, contact_id, attribution_id, subject, status, priority, unread_count, assignee_member_id, tags, last_message_at";

/**
 * A conversation has no channel of its own; the attribution it points at holds
 * it. The join is inner because the demo repository drops a conversation whose
 * attribution is missing, and an inner join is that rule expressed in SQL.
 */
const CONVERSATION_WITH_CHANNEL =
  "id, contact_id, attribution_id, subject, status, priority, unread_count, assignee_member_id, tags, last_message_at, source_attributions!inner(channel)";

const MESSAGE_COLUMNS =
  "id, conversation_id, direction, body, sent_at, author_member_id, external_id, message_attachments(id, kind, filename, size_label)";

interface ConversationRow {
  id: string;
  contact_id: string;
  attribution_id: string;
  subject: string | null;
  status: ConversationStatus;
  priority: boolean | null;
  unread_count: number | string | null;
  assignee_member_id: string | null;
  tags: string[] | null;
  last_message_at: string;
}

interface AttachmentRow {
  id: string;
  kind: string;
  filename: string | null;
  size_label: string | null;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  direction: MessageDirection;
  body: string | null;
  sent_at: string;
  author_member_id: string | null;
  external_id: string | null;
  message_attachments: AttachmentRow[] | null;
}

/** PostgREST hands numerics back as strings often enough to be worth one guard. */
function count(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Screens sort and format these as dates. Postgres writes an offset form
 * ("+00:00") where the demo set wrote a "Z" one, so both sides are normalised
 * here rather than in every component that reads a timestamp.
 */
function iso(value: string): string {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? value : new Date(parsed).toISOString();
}

const ATTACHMENT_KINDS: MessageAttachment["kind"][] = ["image", "document", "audio"];

/**
 * The column is free text while the domain type is three values. An unfamiliar
 * kind is shown as a document, which is the neutral case, rather than reaching a
 * screen that has no icon for it and drawing nothing at all.
 */
function attachmentKind(value: string): MessageAttachment["kind"] {
  const known = ATTACHMENT_KINDS.find((kind) => kind === value);
  return known ?? "document";
}

/** LIKE reads % and _ as wildcards; the demo repository matched them literally. */
function likePattern(search: string): string {
  return `%${search.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

/**
 * A value inside or() may hold a comma or a parenthesis only while quoted, and
 * the quoted form escapes its own backslashes and quotes. A customer searching
 * for "coffret (12)" would otherwise break the filter tree rather than the query
 * simply finding nothing.
 */
function quoted(pattern: string): string {
  return `"${pattern.replace(/[\\"]/g, (char) => `\\${char}`)}"`;
}

function toConversation(row: ConversationRow): Conversation {
  return {
    id: row.id,
    contactId: row.contact_id,
    attributionId: row.attribution_id,
    subject: row.subject ?? "",
    status: row.status,
    priority: Boolean(row.priority),
    unreadCount: count(row.unread_count),
    assigneeId: row.assignee_member_id,
    tags: Array.isArray(row.tags) ? row.tags : [],
    lastMessageAt: iso(row.last_message_at),
  };
}

function toMessage(row: MessageRow): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    direction: row.direction,
    body: row.body ?? "",
    sentAt: iso(row.sent_at),
    authorId: row.author_member_id,
    externalId: row.external_id,
    attachments: (row.message_attachments ?? []).map((attachment) => ({
      id: attachment.id,
      kind: attachmentKind(attachment.kind),
      filename: attachment.filename ?? "",
      sizeLabel: attachment.size_label ?? "",
    })),
  };
}

export function supabaseConversations(client: SupabaseClient): ConversationRepository {
  return {
    async list(filter: ConversationFilter = {}) {
      let query = client.from("conversations").select(CONVERSATION_WITH_CHANNEL);

      if (filter.channels?.length) {
        query = query.in("source_attributions.channel", filter.channels);
      }
      if (filter.statuses?.length) {
        query = query.in("status", filter.statuses);
      }
      if (filter.unreadOnly) {
        // The demo repository drops a count of exactly zero, not everything at or below it.
        query = query.neq("unread_count", 0);
      }
      if (filter.assigneeId !== undefined) {
        query =
          filter.assigneeId === null
            ? query.is("assignee_member_id", null)
            : query.eq("assignee_member_id", filter.assigneeId);
      }

      if (filter.search) {
        const pattern = likePattern(filter.search);

        /**
         * The one filter that cannot be written as a single query. PostgREST
         * refuses a top level or() that mixes a column of this table with a
         * column of a joined one, so the contacts whose name matches are read
         * first and the search becomes "this subject, or one of those people".
         * The set is small: it is the shop's own address book.
         */
        const { data: named } = await client
          .from("contacts")
          .select("id")
          .ilike("name", pattern)
          .returns<{ id: string }[]>();

        const contactIds = (named ?? []).map((contact) => contact.id);
        const clauses = [`subject.ilike.${quoted(pattern)}`];
        if (contactIds.length) clauses.push(`contact_id.in.(${contactIds.join(",")})`);
        query = query.or(clauses.join(","));
      }

      const { data, error } = await query
        .order("last_message_at", { ascending: false })
        // Two conversations touched in the same second would otherwise swap places
        // between page loads.
        .order("id", { ascending: true })
        .returns<ConversationRow[]>();

      if (error || !data) return [];
      return data.map(toConversation);
    },

    async byId(id: string) {
      const { data, error } = await client
        .from("conversations")
        .select(CONVERSATION_COLUMNS)
        .eq("id", id)
        .maybeSingle<ConversationRow>();

      // Asked for one named record: a failure here is worth surfacing, while a
      // conversation that simply is not there is an answer of null.
      if (error) throw new Error(`Conversation ${id} could not be read: ${error.message}`);
      return data ? toConversation(data) : null;
    },

    async messages(conversationId: string) {
      const { data, error } = await client
        .from("messages")
        .select(MESSAGE_COLUMNS)
        .eq("conversation_id", conversationId)
        .order("sent_at", { ascending: true })
        // Messages a second apart are common in a chat, and a thread that
        // reshuffles itself on refresh reads as lost messages.
        .order("created_at", { ascending: true })
        .returns<MessageRow[]>();

      if (error || !data) return [];
      return data.map(toMessage);
    },
  };
}
