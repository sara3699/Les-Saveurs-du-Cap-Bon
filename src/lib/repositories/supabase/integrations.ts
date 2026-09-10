import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChannelConnection, ChannelId, ConnectionStatus } from "@/lib/domain/types";
import type { IntegrationRepository } from "../types";

/**
 * The connectors, read from `channel_connections` instead of the demo file.
 * Row level security already narrows every read to the caller's organisation,
 * so nothing below filters by organization_id; doing it twice would only hide
 * the day the policy stops working.
 */

/** Selected by name: `created_at` is only ever ordered by, never returned. */
const COLUMNS =
  "id, channel, account_label, status, summary, requires, permissions, outstanding, " +
  "review_note, last_sync_at, last_event_at, last_error_at, last_error_message, " +
  "events_this_week, setup_guide_href, planned";

interface ConnectionRow {
  id: string;
  channel: string;
  account_label: string;
  status: string;
  summary: string | null;
  requires: string | null;
  permissions: string[] | null;
  outstanding: string[] | null;
  review_note: string | null;
  last_sync_at: string | null;
  last_event_at: string | null;
  last_error_at: string | null;
  last_error_message: string | null;
  events_this_week: number | string | null;
  setup_guide_href: string | null;
  planned: boolean | null;
}

/**
 * PostgREST returns timestamptz with a numeric offset, and the settings screen
 * sorts these strings against each other directly. Normalising to a UTC ISO
 * string is what keeps that lexical sort telling the truth.
 */
function isoOrNull(value: string | null): string | null {
  if (!value) return null;
  const at = new Date(value);
  return Number.isNaN(at.getTime()) ? null : at.toISOString();
}

/** Numeric columns can arrive as strings; a NaN counter would render as "NaN". */
function count(value: number | string | null): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * The `channel_id` and `connection_status` enums carry exactly the six channels
 * and five states the domain unions declare, so these casts rename rather than
 * widen. If a value is ever added to one enum, it belongs in domain/types.ts
 * first.
 */
function toConnection(row: ConnectionRow): ChannelConnection {
  return {
    id: row.id,
    channelId: row.channel as ChannelId,
    accountLabel: row.account_label,
    status: row.status as ConnectionStatus,
    summary: row.summary ?? "",
    requires: row.requires ?? "",
    permissions: row.permissions ?? [],
    lastSyncAt: isoOrNull(row.last_sync_at),
    lastEventAt: isoOrNull(row.last_event_at),
    lastErrorAt: isoOrNull(row.last_error_at),
    lastErrorMessage: row.last_error_message,
    outstanding: row.outstanding ?? [],
    reviewNote: row.review_note,
    eventsThisWeek: count(row.events_this_week),
    setupGuideHref: row.setup_guide_href ?? "/help",
    planned: row.planned ?? false,
  };
}

export function supabaseIntegrations(client: SupabaseClient): IntegrationRepository {
  return {
    async list() {
      const { data, error } = await client
        .from("channel_connections")
        .select(COLUMNS)
        // A seeded set is written in one transaction, so every row shares the
        // same now(). The id breaks that tie and makes the order repeatable
        // between requests; deciding which connector needs attention first is
        // the screen's job, not this one's.
        .order("created_at", { ascending: true })
        .order("id", { ascending: true });

      // Every page reads this list for the sidebar badge, so a failure here
      // degrades to "no connectors" rather than taking the whole app down.
      if (error || !data) return [];
      return (data as unknown as ConnectionRow[]).map(toConnection);
    },

    async byId(id) {
      const { data, error } = await client
        .from("channel_connections")
        .select(COLUMNS)
        .eq("id", id)
        .maybeSingle();

      if (error) {
        // 22P02 is Postgres refusing a malformed uuid. That is an id nobody
        // owns, which is the same answer the demo set gave: null, not a crash.
        if (error.code === "22P02") return null;
        throw error;
      }

      return data ? toConnection(data as unknown as ConnectionRow) : null;
    },
  };
}
