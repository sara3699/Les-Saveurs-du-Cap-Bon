/**
 * Turns the demo dataset the app already ships into SQL, so the database holds
 * exactly what the mock files hold. One source of truth, re-runnable.
 */
import { CONNECTIONS, PRODUCTS, STORE, TAGS, TEAM } from "@/lib/mock/core";
import { CONTACTS, CONVERSATIONS, CONVERSATION_ATTRIBUTIONS, MESSAGES } from "@/lib/mock/people";
import { FEATURED_ORDERS, ORDER_ATTRIBUTIONS, TASKS } from "@/lib/mock/commerce";
import { BUDGETS, BUDGET_LINES, BUNDLES, LEADS, STORE_PROFILE } from "@/lib/mock/operations";

const q = (v: unknown): string => {
  if (v === null || v === undefined) return "null";
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return `array[${v.map((x) => q(x)).join(",")}]::text[]`;
  return `'${String(v).replace(/'/g, "''")}'`;
};

// Deterministic uuids from the mock ids, so re-running the seed is idempotent.
function uuid(kind: string, key: string): string {
  let h = 0x811c9dc5;
  for (const ch of `${kind}:${key}`) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  const hex = (n: number) => n.toString(16).padStart(8, "0");
  const parts: string[] = [];
  let a = h;
  for (let i = 0; i < 4; i++) {
    a ^= a << 13; a >>>= 0; a ^= a >> 17; a ^= a << 5; a >>>= 0;
    parts.push(hex(a));
  }
  const s = parts.join("");
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-4${s.slice(13, 16)}-a${s.slice(17, 20)}-${s.slice(20, 32)}`;
}

const ORG = uuid("org", "saveurs");
const out: string[] = [];
const push = (s: string) => out.push(s);

push(`insert into organizations (id, name, city, currency, is_demo) values
  ('${ORG}', ${q(STORE.name)}, ${q(STORE.city)}, ${q(STORE.currency)}, true)
  on conflict (id) do update set name = excluded.name, city = excluded.city;`);

push(`insert into store_profiles (organization_id, legal_name, display_name, tagline, address_lines,
  phone, email, website, vat_number, free_delivery_from, standard_delivery_fee, preparation_days) values
  ('${ORG}', ${q(STORE_PROFILE.legalName)}, ${q(STORE_PROFILE.displayName)}, ${q(STORE_PROFILE.tagline)},
   ${q(STORE_PROFILE.addressLines)}, ${q(STORE_PROFILE.phone)}, ${q(STORE_PROFILE.email)},
   ${q(STORE_PROFILE.website)}, ${q(STORE_PROFILE.vatNumber)}, ${STORE_PROFILE.freeDeliveryFrom},
   ${STORE_PROFILE.standardDeliveryFee}, ${STORE_PROFILE.preparationDays})
  on conflict (organization_id) do update set display_name = excluded.display_name;`);

for (const z of STORE_PROFILE.deliveryZones) {
  push(`insert into delivery_zones (id, organization_id, name, fee, days, cities) values
    ('${uuid("zone", z.id)}', '${ORG}', ${q(z.name)}, ${z.fee}, ${q(z.days)}, ${q(z.cities)})
    on conflict (id) do nothing;`);
}

for (const m of TEAM) {
  push(`insert into organization_members (id, organization_id, display_name, initials, role) values
    ('${uuid("member", m.id)}', '${ORG}', ${q(m.name)}, ${q(m.initials)}, ${q(m.role)})
    on conflict (id) do update set display_name = excluded.display_name, role = excluded.role;`);
}

for (const t of TAGS) {
  push(`insert into tags (id, organization_id, label) values
    ('${uuid("tag", t.id)}', '${ORG}', ${q(t.label)}) on conflict (organization_id, label) do nothing;`);
}

for (const p of PRODUCTS) {
  push(`insert into products (id, organization_id, name, sku, price, cost, stock, low_stock_at, units_sold) values
    ('${uuid("product", p.id)}', '${ORG}', ${q(p.name)}, ${q(p.sku)}, ${p.price}, ${p.cost}, ${p.stock},
     ${p.lowStockAt}, ${p.unitsSold}) on conflict (id) do update set stock = excluded.stock;`);
}

for (const c of CONNECTIONS) {
  push(`insert into channel_connections (id, organization_id, channel, account_label, status, summary,
    requires, permissions, outstanding, review_note, last_sync_at, last_event_at, last_error_at,
    last_error_message, events_this_week, setup_guide_href, planned) values
    ('${uuid("conn", c.id)}', '${ORG}', ${q(c.channelId)}, ${q(c.accountLabel)}, ${q(c.status)},
     ${q(c.summary)}, ${q(c.requires)}, ${q(c.permissions)}, ${q(c.outstanding)}, ${q(c.reviewNote)},
     ${q(c.lastSyncAt)}::timestamptz, ${q(c.lastEventAt)}::timestamptz, ${q(c.lastErrorAt)}::timestamptz,
     ${q(c.lastErrorMessage)}, ${c.eventsThisWeek}, ${q(c.setupGuideHref)}, ${c.planned ?? false})
    on conflict (id) do update set status = excluded.status;`);
}

const ownerOf = (memberId: string | null) => (memberId ? `'${uuid("member", memberId)}'` : "null");

for (const c of CONTACTS) {
  push(`insert into contacts (id, organization_id, name, phone, email, city, language,
    first_touch_channel, latest_touch_channel, first_contact_at, stage, lead_score,
    lead_score_reasons, lifetime_value, owner_member_id) values
    ('${uuid("contact", c.id)}', '${ORG}', ${q(c.name)}, ${q(c.phone)}, ${q(c.email)}, ${q(c.city)},
     ${q(c.language)}, ${q(c.firstTouchChannel)}, ${q(c.latestTouchChannel)}, ${q(c.firstContactAt)}::timestamptz,
     ${q(c.stage)}, ${c.leadScore}, ${q(c.leadScoreReasons)}, ${c.lifetimeValue}, ${ownerOf(c.ownerId)})
    on conflict (id) do update set stage = excluded.stage;`);

  for (const label of c.tags) {
    push(`insert into contact_tags (contact_id, tag_id)
      select '${uuid("contact", c.id)}', t.id from tags t
      where t.organization_id = '${ORG}' and t.label = ${q(label)}
      on conflict do nothing;`);
  }
  for (const n of c.notes) {
    push(`insert into contact_notes (id, organization_id, contact_id, author_member_id, body, created_at) values
      ('${uuid("note", n.id)}', '${ORG}', '${uuid("contact", c.id)}', ${ownerOf(n.authorId)}, ${q(n.body)},
       ${q(n.createdAt)}::timestamptz) on conflict (id) do nothing;`);
  }
}

const featuredIds = new Set(FEATURED_ORDERS.map((o) => o.attributionId));
const allAttributions = [...CONVERSATION_ATTRIBUTIONS, ...ORDER_ATTRIBUTIONS.filter((a) => featuredIds.has(a.id))];
for (const a of allAttributions) {
  const conn = a.connectionId ? `'${uuid("conn", a.connectionId)}'` : "null";
  push(`insert into source_attributions (id, organization_id, channel, connection_id, external_id,
    received_at, campaign, referrer) values
    ('${uuid("attr", a.id)}', '${ORG}', ${q(a.channelId)}, ${conn}, ${q(a.externalId)},
     ${q(a.receivedAt)}::timestamptz, ${q(a.campaign)}, ${q(a.referrer)})
    on conflict (id) do nothing;`);
}

for (const c of CONVERSATIONS) {
  push(`insert into conversations (id, organization_id, contact_id, attribution_id, subject, status,
    priority, unread_count, assignee_member_id, last_message_at) values
    ('${uuid("conv", c.id)}', '${ORG}', '${uuid("contact", c.contactId)}', '${uuid("attr", c.attributionId)}',
     ${q(c.subject)}, ${q(c.status)}, ${c.priority}, ${c.unreadCount}, ${ownerOf(c.assigneeId)},
     ${q(c.lastMessageAt)}::timestamptz) on conflict (id) do update set status = excluded.status;`);
}

for (const m of MESSAGES) {
  push(`insert into messages (id, organization_id, conversation_id, direction, body, sent_at,
    author_member_id, external_id) values
    ('${uuid("msg", m.id)}', '${ORG}', '${uuid("conv", m.conversationId)}', ${q(m.direction)}, ${q(m.body)},
     ${q(m.sentAt)}::timestamptz, ${ownerOf(m.authorId)}, ${q(m.externalId)})
    on conflict (id) do nothing;`);
  for (const a of m.attachments) {
    push(`insert into message_attachments (id, message_id, kind, filename, size_label) values
      ('${uuid("att", a.id)}', '${uuid("msg", m.id)}', ${q(a.kind)}, ${q(a.filename)}, ${q(a.sizeLabel)})
      on conflict (id) do nothing;`);
  }
}

for (const o of FEATURED_ORDERS) {
  const conv = o.conversationId ? `'${uuid("conv", o.conversationId)}'` : "null";
  push(`insert into orders (id, organization_id, reference, contact_id, attribution_id, conversation_id,
    placed_at, payment_status, delivery_status, assignee_member_id, delivery_fee, total) values
    ('${uuid("order", o.id)}', '${ORG}', ${q(o.reference)}, '${uuid("contact", o.contactId)}',
     '${uuid("attr", o.attributionId)}', ${conv}, ${q(o.placedAt)}::timestamptz, ${q(o.paymentStatus)},
     ${q(o.deliveryStatus)}, ${ownerOf(o.assigneeId)}, ${o.deliveryFee}, ${o.total})
    on conflict (id) do update set payment_status = excluded.payment_status;`);
  o.items.forEach((it, i) => {
    push(`insert into order_items (id, order_id, product_id, name, quantity, unit_price) values
      ('${uuid("item", `${o.id}:${i}`)}', '${uuid("order", o.id)}', '${uuid("product", it.productId)}',
       ${q(it.name)}, ${it.quantity}, ${it.unitPrice}) on conflict (id) do nothing;`);
  });
}

for (const t of TASKS) {
  push(`insert into tasks (id, organization_id, title, type, contact_id, conversation_id,
    assignee_member_id, due_at, priority, completed_at) values
    ('${uuid("task", t.id)}', '${ORG}', ${q(t.title)}, ${q(t.type)},
     ${t.contactId ? `'${uuid("contact", t.contactId)}'` : "null"},
     ${t.conversationId ? `'${uuid("conv", t.conversationId)}'` : "null"},
     ${ownerOf(t.assigneeId)}, ${q(t.dueAt)}::timestamptz, ${q(t.priority)},
     ${q(t.completedAt)}::timestamptz) on conflict (id) do nothing;`);
}

for (const l of LEADS) {
  push(`insert into leads (id, organization_id, contact_id, attribution_id, stage, value,
    owner_member_id, lost_reason, next_task_id, created_at) values
    ('${uuid("lead", l.id)}', '${ORG}', '${uuid("contact", l.contactId)}', '${uuid("attr", l.attributionId)}',
     ${q(l.stage)}, ${l.value}, ${ownerOf(l.ownerId)}, ${q(l.lostReason)},
     ${l.nextTaskId ? `'${uuid("task", l.nextTaskId)}'` : "null"}, ${q(l.createdAt)}::timestamptz)
    on conflict (id) do update set stage = excluded.stage;`);
}

for (const b of BUDGETS) {
  push(`insert into budgets (id, organization_id, name, period, planned, used) values
    ('${uuid("budget", b.id)}', '${ORG}', ${q(b.name)}, ${q(b.period)}, ${b.planned}, ${b.used})
    on conflict (id) do update set used = excluded.used;`);
}
for (const l of BUDGET_LINES) {
  push(`insert into budget_lines (id, organization_id, budget_id, label, planned, used, note) values
    ('${uuid("bline", l.id)}', '${ORG}', '${uuid("budget", l.budgetId)}', ${q(l.label)}, ${l.planned},
     ${l.used}, ${q(l.note)}) on conflict (id) do nothing;`);
}
for (const b of BUNDLES) {
  const ids = b.productIds.map((p) => `'${uuid("product", p)}'::uuid`);
  push(`insert into bundles (id, organization_id, name, kind, description, product_ids, bundle_price,
    active, times_shown, times_taken, revenue_added) values
    ('${uuid("bundle", b.id)}', '${ORG}', ${q(b.name)}, ${q(b.kind)}, ${q(b.description)},
     array[${ids.join(",")}]::uuid[], ${b.bundlePrice ?? "null"}, ${b.active}, ${b.timesShown},
     ${b.timesTaken}, ${b.revenueAdded}) on conflict (id) do update set active = excluded.active;`);
}

console.log(out.join("\n"));
