import type { SupabaseClient } from "@supabase/supabase-js";

import type { DeliveryStatus, Order, OrderItem, PaymentStatus } from "@/lib/domain/types";
import type { OrderFilter, OrderRepository } from "../types";

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
const ORDER_COLUMNS =
  "id, reference, contact_id, attribution_id, conversation_id, placed_at, payment_status, delivery_status, assignee_member_id, delivery_fee, total, order_items(id, product_id, name, quantity, unit_price)";

/**
 * An order has no channel of its own; the attribution it points at holds it. The
 * join is inner because the demo repository drops an order whose attribution is
 * missing, and an inner join is that rule expressed in SQL.
 */
const ORDER_WITH_CHANNEL =
  "id, reference, contact_id, attribution_id, conversation_id, placed_at, payment_status, delivery_status, assignee_member_id, delivery_fee, total, order_items(id, product_id, name, quantity, unit_price), source_attributions!inner(channel)";

/**
 * PostgREST stops at a thousand rows unless it is told otherwise, and half the
 * screens here add every order in the period up rather than showing a page of
 * them. Three months of trading is a few hundred orders, so this ceiling is
 * years away and a truncated total is not.
 */
const MAX_ORDERS = 5_000;

const PAYMENT_STATUSES: PaymentStatus[] = [
  "paid",
  "cash_on_delivery",
  "pending",
  "refused",
  "refunded",
];

const DELIVERY_STATUSES: DeliveryStatus[] = [
  "preparing",
  "dispatched",
  "delivered",
  "returned",
  "cancelled",
];

interface OrderItemRow {
  id: string;
  product_id: string | null;
  name: string | null;
  quantity: number | string | null;
  unit_price: number | string | null;
}

interface OrderRow {
  id: string;
  reference: string;
  contact_id: string;
  attribution_id: string;
  conversation_id: string | null;
  placed_at: string;
  payment_status: PaymentStatus;
  delivery_status: DeliveryStatus;
  assignee_member_id: string | null;
  delivery_fee: number | string | null;
  total: number | string | null;
  order_items: OrderItemRow[] | null;
}

/** PostgREST hands numerics back as strings, and a NaN on a total is worse than a zero. */
function num(value: unknown): number {
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

/**
 * The filter takes payment and delivery states as free strings while the columns
 * are Postgres enums. An unfamiliar state has to be dropped rather than sent: it
 * would fail the whole query, where the demo repository simply matched nothing
 * with it and kept on filtering with the rest.
 */
function known<T extends string>(
  values: string[] | undefined,
  allowed: readonly T[],
): T[] | undefined {
  if (!values?.length) return undefined;
  return allowed.filter((value) => values.includes(value));
}

function toOrderItem(row: OrderItemRow): OrderItem {
  return {
    id: row.id,
    // Null once the product behind the line has been deleted. The line keeps the
    // name and the price it was sold at, which is what a receipt has to show.
    productId: row.product_id ?? "",
    name: row.name ?? "",
    quantity: num(row.quantity),
    unitPrice: num(row.unit_price),
  };
}

function toOrder(row: OrderRow): Order {
  return {
    id: row.id,
    reference: row.reference,
    contactId: row.contact_id,
    attributionId: row.attribution_id,
    conversationId: row.conversation_id,
    placedAt: iso(row.placed_at),
    paymentStatus: row.payment_status,
    deliveryStatus: row.delivery_status,
    assigneeId: row.assignee_member_id,
    items: (row.order_items ?? []).map(toOrderItem),
    deliveryFee: num(row.delivery_fee),
    total: num(row.total),
  };
}

export function supabaseOrders(client: SupabaseClient): OrderRepository {
  return {
    async list(filter: OrderFilter = {}) {
      const payments = known(filter.paymentStatuses, PAYMENT_STATUSES);
      const deliveries = known(filter.deliveryStatuses, DELIVERY_STATUSES);
      // Asking only for states this shop has never recorded is an answer, not a
      // reason to send an empty in.() list the database would refuse.
      if (payments?.length === 0 || deliveries?.length === 0) return [];

      let query = client.from("orders").select(ORDER_WITH_CHANNEL);

      if (filter.channels?.length) {
        query = query.in("source_attributions.channel", filter.channels);
      }
      if (payments) {
        query = query.in("payment_status", payments);
      }
      if (deliveries) {
        query = query.in("delivery_status", deliveries);
      }
      if (filter.assigneeId !== undefined) {
        query =
          filter.assigneeId === null
            ? query.is("assignee_member_id", null)
            : query.eq("assignee_member_id", filter.assigneeId);
      }
      // Both of these reach the repository from the address bar, so both can
      // arrive as NaN. The demo repository compared with NaN and kept every row;
      // the honest reading of that is no filter at all.
      if (filter.minTotal !== undefined && Number.isFinite(filter.minTotal)) {
        query = query.gte("total", filter.minTotal);
      }
      if (filter.sinceDays && Number.isFinite(filter.sinceDays)) {
        const cutoff = new Date(Date.now() - filter.sinceDays * 86_400_000);
        query = query.gte("placed_at", cutoff.toISOString());
      }

      if (filter.search) {
        const pattern = likePattern(filter.search);

        /**
         * The one filter that cannot be written as a single query. PostgREST
         * refuses a top level or() that mixes a column of this table with a
         * column of a joined one, so the contacts whose name matches are read
         * first and the search becomes "this reference, or one of those people".
         * The set is small: it is the shop's own address book.
         */
        const { data: named } = await client
          .from("contacts")
          .select("id")
          .ilike("name", pattern)
          .returns<{ id: string }[]>();

        const contactIds = (named ?? []).map((contact) => contact.id);
        const clauses = [`reference.ilike.${quoted(pattern)}`];
        if (contactIds.length) clauses.push(`contact_id.in.(${contactIds.join(",")})`);
        query = query.or(clauses.join(","));
      }

      const { data, error } = await query
        .order("placed_at", { ascending: false })
        // Orders placed in the same second would otherwise swap places between
        // page loads, and so would the lines inside one order.
        .order("id", { ascending: true })
        .order("id", { referencedTable: "order_items", ascending: true })
        .limit(MAX_ORDERS)
        .returns<OrderRow[]>();

      if (error || !data) return [];
      return data.map(toOrder);
    },

    async byReference(reference: string) {
      const { data, error } = await client
        .from("orders")
        .select(ORDER_COLUMNS)
        .eq("reference", reference)
        .order("id", { referencedTable: "order_items", ascending: true })
        // The demo repository took the first match. A reference is the shop's own
        // counter and does not repeat, but one order was asked for and one is
        // what the caller gets either way.
        .limit(1)
        .maybeSingle<OrderRow>();

      // Asked for one named record: a failure here is worth surfacing, while an
      // order that simply is not there is an answer of null.
      if (error) throw new Error(`Order ${reference} could not be read: ${error.message}`);
      return data ? toOrder(data) : null;
    },
  };
}
