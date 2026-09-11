# Architecture

## Product shape

This is an order workspace for a small food and gourmet business. The owner should be able to see orders, customer conversations, team activity, and connector health without switching between six provider dashboards.

The core product promise is:

> Every request keeps its source from the first message to the paid order, while the team works from one inbox and one order list.

The current application is a professional mock-first build. It uses realistic repository interfaces and demo data so the screens can be reviewed before real provider credentials and customer data are introduced.

## Current stack

- Next.js App Router with React and TypeScript.
- Tailwind CSS v4 through the project PostCSS setup.
- Repository interfaces in `src/lib/repositories`.
- Mock repositories backed by deterministic demo fixtures.
- Vitest for domain and metrics tests.
- Playwright for browser-level order journeys.
- A jade-green visual system with accessible channel colors and subtle glass navigation.

## Request-to-order flow

```text
Provider webhook or website form
        ↓
Source attribution record
        ↓
Conversation + contact + campaign context
        ↓
Qualification / call / team assignment
        ↓
Order with the same attribution id
        ↓
Dashboard, team conversion, delivery and revenue views
```

The source is never copied as a loose string onto an order. Orders point to a source attribution record, and screens resolve that record through `src/lib/domain/attribution.ts`. This prevents known Instagram, WhatsApp, Facebook, Google, Website, and Manual orders from becoming an ambiguous “Online” source.

## Main domains

### Channels and integrations

`src/lib/domain/channels.ts` defines the six source channels:

- Website
- WhatsApp Business
- Instagram professional account
- Facebook Page Messenger
- Google Ads lead forms
- Manual or counter entry

`ChannelConnection` keeps the operational state separate from order attribution. A connector can be connected, require setup, be warning-level, be broken, or not exist yet. The integrations screen and the dashboard channel hub use this state to explain what is receiving events and what needs action.

### Orders and attribution

Orders retain their attribution id, customer, owner, payment status, delivery status, totals, and timestamps. The order list shows the resolved source badge, while the order detail view can explain the provider account, campaign, referring page, and conversation that produced the order.

### Customer flow

Conversations, contacts, pipeline leads, tasks, and calls share customer identity where possible. Team conversion metrics measure the business journey from calls received to customers reached, customers won, rejected customers, orders placed, and revenue.

### Workspace shell

`src/components/shell/AppChrome.tsx` provides:

- Glass command rail navigation.
- Search across contacts, conversations, and orders.
- Alert notices for broken connections, unassigned requests, and overdue follow-ups.
- Owner profile menu.
- Responsive mobile navigation.

## Screen responsibilities

- **Dashboard:** health summary, revenue and order KPIs, channel mix, channel connection hub, operational attention, delivery, and conversion funnel.
- **Orders:** source-aware order filtering and order detail attribution.
- **Inbox:** unified customer conversations with channel-aware reply rules.
- **Contacts:** customer identity, duplicate warnings, channel history, and activity.
- **Pipeline:** lead stages and assignment.
- **Tasks:** follow-up ownership and overdue work.
- **Team:** workload and call-to-order performance by team member.
- **Integrations:** provider setup, permissions, sync health, and plain-language blockers.
- **Products and Store:** catalog, stock, bundles, and future storefront surfaces.

## Repository boundary

Screens call `getRepositories()` and use interfaces from `src/lib/repositories/types.ts`. The mock implementation is the current provider. A future Supabase implementation should preserve those interfaces so the UI does not need to know whether the data comes from fixtures or production tables.

Recommended production repository modules:

```text
src/lib/repositories/
  types.ts
  index.ts
  mock.ts
  supabase.ts
  integrations/
    meta.ts
    google.ts
    website.ts
```

## Receipts and expenses

Money going out, added on 2026-09-10. The full account is in `docs-receipts.md`; this is the
shape of it.

A receipt arrives as a file. `POST /api/receipts` checks its extension, its declared type and
its first bytes, hashes it, takes a `draft` row through `register_receipt`, then stores the file
in a private bucket under `<organization-id>/<year>/<uuid>.<ext>`. A second request,
`POST /api/receipts/[id]/process`, reads it: an OCR provider returns text, `extractReceipt`
turns that text into fields with a confidence each, and `apply_receipt_extraction` writes them.
A person then corrects anything on the review screen, and the owner confirms it.

Three things are load-bearing:

- **Only a verified receipt counts.** Every figure on the expenses screen comes from
  `status = 'verified'`. A reading nobody confirmed is visible and worth nothing.
- **Reading is behind an interface.** `src/lib/ocr/` chooses a provider; the knowledge of what
  a French or Tunisian receipt looks like stays in `src/lib/receipts/extract.ts`, where it can
  be tested without a network and kept when the provider changes.
- **The finances are the owner's.** The team files receipts; the owner sees the totals and is
  the only one who can verify. Enforced in row level security for a signed-in account, and in
  the application for the demonstration shop, which signs nobody in.

The QR code is decoded in the browser for speed and parsed on the server for safety. Nothing
opens it, fetches it, or trusts it.

## Production data model

The first production migration should include:

- `workspaces`
- `workspace_members`
- `team_members`
- `channel_connections`
- `source_attributions`
- `contacts`
- `conversations`
- `messages`
- `products`
- `orders`
- `order_items`
- `tasks`
- `call_events`
- `team_conversion_metrics`
- `audit_events`

Every tenant-owned table needs a `workspace_id`. Provider event tables should have a unique key on `(channel_connection_id, external_id)` so webhook retries are idempotent.

## Security and permissions

The production version should use managed authentication and Postgres row-level security. Every query must be scoped to the authenticated workspace, and provider tokens must stay server-side in an encrypted secrets store. The browser should receive status, labels, and safe summaries, never access tokens or webhook secrets.

Suggested roles:

- **Owner:** billing, settings, integrations, team and all records.
- **Manager:** orders, inbox, team performance, products and tasks.
- **Agent:** assigned inbox, calls, tasks, and permitted order updates.
- **Viewer:** read-only dashboards and reports.

## Integration lifecycle

1. Create a pending connection for the workspace.
2. Start the provider authorization flow on the server.
3. Store encrypted tokens and provider asset ids.
4. Verify webhook signatures before accepting events.
5. Normalize the event into an attribution, conversation, contact, or order.
6. Record sync health, provider errors, and last successful event.
7. Surface the next action in Integrations and the dashboard alert list.

## Observability

Track these production signals:

- Webhook received, rejected, retried, and normalized.
- Provider token refresh failures.
- Orders created by source and duplicate prevention decisions.
- Message send success, failure, and provider response code.
- Connector last event time and stale-connection threshold.
- Team conversion funnel changes over time.

Keep customer message content out of ordinary application logs. Use a correlation id for a webhook-to-order journey so support can investigate without exposing unnecessary personal data.

## Deliberate current limitations

Corrected 2026-09-10. Sign-in, the database, row level security and the website intake connector
were built after this document was first written, and the list below now says so.

- No real social account is connected: WhatsApp, Instagram, Facebook and Google all wait on the
  client's own accounts and, for Meta, on their review.
- No provider credential is stored in the project.
- Prices, stock, and SKUs are placeholders until an authorized catalog import is available.
- Selling something does not reduce its stock, so the low-stock warning is not yet real.
- Nothing notifies anyone when they are not looking at the screen.
- Receipts: no server-side QR decode, no HEIC conversion, no background queue, and the Google
  Cloud Vision adapter has never been run against the live service. See `docs-receipts.md`.

Built, and no longer follow-up work: email and password sign-in with three roles, a Supabase
database behind every screen, row level security proved by `npm run test:isolation`, the website
form connector, orders taken by hand, and receipts and expenses.
