import type {
  ChannelId,
  Product,
  SourceAttribution,
  Tag,
  Task,
  TeamConversionMetric,
  TeamMember,
} from "@/lib/domain/types";
import type { Budget, BudgetLine, Bundle, Lead } from "@/lib/mock/operations";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { WorkspaceRepository } from "../types";

/**
 * The workspace side of the demo dataset, read from Postgres instead of the
 * TypeScript files. Row level security decides which organisation the caller
 * sees, so not one query here filters by organization_id.
 */

/** PostgREST hands numerics back as strings, and a NaN on a price is worse than a zero. */
function num(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Postgres writes "+00:00" where the domain types hold "Z". Screens sort due
 * dates by comparing the strings, so the two spellings are settled here rather
 * than in the one screen that happens to notice.
 */
function iso(value: string): string {
  const at = new Date(value);
  return Number.isNaN(at.getTime()) ? value : at.toISOString();
}

function isoOrNull(value: string | null): string | null {
  return value === null ? null : iso(value);
}

/**
 * The member list both team() and conversionMetrics() are built on. Archived
 * members are left out: they hold no open work and belong on no leaderboard.
 * Ordering by the role column is ordering by the enum's own declaration,
 * owner then manager then agent, which is the order the screens read in.
 */
async function listMembers(client: SupabaseClient) {
  const { data } = await client
    .from("organization_members")
    .select("id, display_name, initials, role")
    .is("archived_at", null)
    .order("role")
    .order("display_name");

  return (data ?? []) as { id: string; display_name: string; initials: string; role: string }[];
}

/**
 * PostgREST has no group by, so a count per member arrives as one column of ids
 * and is tallied here. Only that column is selected, so the payload stays small
 * whatever the row count.
 */
function countByMember(rows: { assignee_member_id: string | null }[] | null): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows ?? []) {
    if (!row.assignee_member_id) continue;
    counts.set(row.assignee_member_id, (counts.get(row.assignee_member_id) ?? 0) + 1);
  }
  return counts;
}

export function supabaseWorkspace(client: SupabaseClient): WorkspaceRepository {
  return {
    async attributions() {
      // The attribution row records the channel and nothing about what was made
      // from it, so the conversation and the customer are read back from the two
      // kinds of record that point at it, in the same request rather than a
      // second round trip per attribution.
      const { data } = await client
        .from("source_attributions")
        .select(
          "id, channel, connection_id, external_id, received_at, campaign, referrer, conversations(id, contact_id), orders(contact_id)",
        )
        .order("received_at", { ascending: false });

      return (data ?? []).map((row): SourceAttribution => {
        const conversation = row.conversations?.[0] ?? null;
        const order = row.orders?.[0] ?? null;

        return {
          id: row.id,
          channelId: row.channel as ChannelId,
          connectionId: row.connection_id,
          externalId: row.external_id,
          receivedAt: iso(row.received_at),
          campaign: row.campaign,
          referrer: row.referrer,
          conversationId: conversation?.id ?? null,
          // A conversation names the customer first hand; an order attribution
          // has no conversation and names them itself.
          contactId: conversation?.contact_id ?? order?.contact_id ?? null,
        };
      });
    },

    async team() {
      // Three queries, not one per member: the member list, every unresolved
      // conversation's owner, every unfinished task's owner.
      const [members, conversations, tasks] = await Promise.all([
        listMembers(client),
        client
          .from("conversations")
          .select("assignee_member_id")
          .neq("status", "resolved")
          .not("assignee_member_id", "is", null),
        client
          .from("tasks")
          .select("assignee_member_id")
          .is("completed_at", null)
          .not("assignee_member_id", "is", null),
      ]);

      const open = countByMember(conversations.data);
      const due = countByMember(tasks.data);

      return members.map(
        (member): TeamMember => ({
          id: member.id,
          name: member.display_name,
          initials: member.initials,
          role: member.role as TeamMember["role"],
          openConversations: open.get(member.id) ?? 0,
          tasksDue: due.get(member.id) ?? 0,
        }),
      );
    },

    async conversionMetrics() {
      const [members, calls] = await Promise.all([
        listMembers(client),
        client.from("calls").select("member_id, reached, outcome, order_value"),
      ]);

      // Seeded from the member list rather than from the calls, so somebody who
      // took no calls this period comes back as zeros instead of vanishing from
      // the leaderboard. The totals have no row of their own in the database, so
      // each one carries the member's id rather than an id invented here.
      const totals = new Map<string, TeamConversionMetric>(
        members.map((member) => [
          member.id,
          {
            id: member.id,
            teamMemberId: member.id,
            callsReceived: 0,
            customersReached: 0,
            customersWon: 0,
            customersRejected: 0,
            ordersPlaced: 0,
            revenue: 0,
          },
        ]),
      );

      for (const call of calls.data ?? []) {
        const metric = totals.get(call.member_id);
        // A call left by a member who has since been archived. It belongs to
        // nobody on the current team, so it is counted for nobody.
        if (!metric) continue;

        metric.callsReceived += 1;
        if (call.reached) metric.customersReached += 1;
        if (call.outcome === "won") metric.customersWon += 1;
        if (call.outcome === "rejected") metric.customersRejected += 1;
        // An order value is the only evidence the call produced an order.
        if (call.order_value !== null && call.order_value !== undefined) {
          metric.ordersPlaced += 1;
          metric.revenue += num(call.order_value);
        }
      }

      return [...totals.values()];
    },

    async tags() {
      const { data } = await client.from("tags").select("id, label").order("label");

      return (data ?? []).map(
        (row): Tag => ({
          id: row.id,
          label: row.label,
        }),
      );
    },

    async products() {
      const { data } = await client
        .from("products")
        .select("id, name, sku, price, cost, stock, low_stock_at, units_sold")
        .is("archived_at", null)
        .order("name");

      return (data ?? []).map(
        (row): Product => ({
          id: row.id,
          name: row.name,
          sku: row.sku,
          price: num(row.price),
          cost: num(row.cost),
          stock: num(row.stock),
          lowStockAt: num(row.low_stock_at),
          unitsSold: num(row.units_sold),
        }),
      );
    },

    async tasks() {
      const { data } = await client
        .from("tasks")
        .select(
          "id, title, type, contact_id, conversation_id, assignee_member_id, due_at, priority, completed_at",
        )
        .order("due_at");

      return (data ?? []).map(
        (row): Task => ({
          id: row.id,
          title: row.title,
          type: row.type as Task["type"],
          contactId: row.contact_id,
          conversationId: row.conversation_id,
          // The screens hold an owner on every follow-up and say so when the
          // owner has left the team. An unowned task keeps that empty owner
          // rather than being dropped from the list nobody would then chase.
          assigneeId: row.assignee_member_id ?? "",
          dueAt: iso(row.due_at),
          priority: row.priority as Task["priority"],
          completedAt: isoOrNull(row.completed_at),
        }),
      );
    },

    async leads() {
      const { data } = await client
        .from("leads")
        .select(
          "id, contact_id, attribution_id, stage, value, owner_member_id, created_at, next_task_id, lost_reason",
        )
        .order("created_at", { ascending: false });

      return (data ?? []).map(
        (row): Lead => ({
          id: row.id,
          contactId: row.contact_id,
          attributionId: row.attribution_id,
          stage: row.stage as Lead["stage"],
          value: num(row.value),
          ownerId: row.owner_member_id,
          createdAt: iso(row.created_at),
          nextTaskId: row.next_task_id,
          lostReason: row.lost_reason,
        }),
      );
    },

    async budgets() {
      const [budgets, lines] = await Promise.all([
        client.from("budgets").select("id, name, period, planned, used").order("name"),
        client
          .from("budget_lines")
          .select("id, budget_id, label, planned, used, note")
          .order("budget_id")
          .order("label"),
      ]);

      return {
        budgets: (budgets.data ?? []).map(
          (row): Budget => ({
            id: row.id,
            name: row.name,
            period: row.period,
            planned: num(row.planned),
            used: num(row.used),
          }),
        ),
        lines: (lines.data ?? []).map(
          (row): BudgetLine => ({
            id: row.id,
            budgetId: row.budget_id,
            label: row.label,
            planned: num(row.planned),
            used: num(row.used),
            note: row.note,
          }),
        ),
      };
    },

    async bundles() {
      const { data } = await client
        .from("bundles")
        .select(
          "id, name, kind, description, product_ids, bundle_price, active, times_shown, times_taken, revenue_added",
        )
        .order("name");

      return (data ?? []).map(
        (row): Bundle => ({
          id: row.id,
          name: row.name,
          kind: row.kind as Bundle["kind"],
          description: row.description,
          productIds: row.product_ids ?? [],
          // Null is the rule saying "no set price", which is not the same rule as
          // a price of zero, so it stays null.
          bundlePrice: row.bundle_price === null ? null : num(row.bundle_price),
          active: row.active,
          timesShown: num(row.times_shown),
          timesTaken: num(row.times_taken),
          revenueAdded: num(row.revenue_added),
        }),
      );
    },

    async lostReasons() {
      const { data } = await client
        .from("leads")
        .select("lost_reason")
        .eq("stage", "lost")
        .not("lost_reason", "is", null);

      // The database filters and the tally happens here, because PostgREST has
      // no group by and the set left after the filter is one reason per lost lead.
      const counts = new Map<string, number>();
      for (const row of data ?? []) {
        if (!row.lost_reason) continue;
        counts.set(row.lost_reason, (counts.get(row.lost_reason) ?? 0) + 1);
      }

      return [...counts.entries()]
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count);
    },
  };
}
