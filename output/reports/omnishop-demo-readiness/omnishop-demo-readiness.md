# OmniShop Demo Readiness Review

Prepared for the Les Mille Saveurs du Cap Bon customer demo.

## Executive view

The demo is strong enough to show a customer now. It communicates the main idea quickly: orders from several channels arrive in one workspace, each order keeps its source, and the owner can see operations, team performance, and connector health.

It is not yet a production application. The current build is a mock-first preview with realistic records, repository boundaries, and connector states, but no real database, authentication, provider webhooks, or live social accounts.

The best positioning is:

> “This is the working product experience and operating model. The next phase connects your real accounts and protects your real customer data.”

## What already feels professional

- The Orders page is easy to scan: source, payment, delivery, owner, value, and time are visible in one table.
- Source colors make Website, WhatsApp, Instagram, Facebook, Google, and Manual easy to distinguish.
- The glass command rail gives the product a recognizable visual identity without overwhelming the business information.
- The dashboard and Team page explain the call-to-order funnel in business terms: calls received, customers reached, customers won, rejected customers, orders, and revenue.
- The Integrations page is honest about setup, warnings, errors, and planned connectors.
- The demo workspace is clearly labeled as sample data rather than pretending the customer’s live accounts are already connected.

## Improvements made for this demo

- Changed the badge to “Preview workspace · sample data” and added a plain-language explanation that the preview does not send messages or create live orders.
- Reworded the Orders page so the current filtered view is explained before the revenue number.
- Replaced fake-looking website, phone, and advertising account details with safe business labels.
- Changed the connector metric label from “Orders this week” to “Events this week” so it does not confuse provider events with confirmed orders.
- Kept the real Instagram handle only where the account identity is intentionally part of the setup flow.

## What to show during the customer demo

### 1. Start with the promise

Open Dashboard and say: “This is the one place where the team sees orders and requests from every channel.” Point to the channel hub, not the technical connector details first.

### 2. Follow one order

Open an Instagram or WhatsApp order, show its source badge, customer, products, payment, delivery, and attribution context, then return to Orders. This proves that the source is not lost when the record becomes an order.

### 3. Show the team funnel

Open Team and explain how calls become reached customers, wins, rejected customers, and orders. This makes the product feel like a management tool rather than only an inbox.

### 4. Explain the preview boundary

Say clearly: “The screen is ready; the real connections still need Meta, Google, and database setup.” Do not call a demo connector live just because it appears in the sample workspace.

## Missing before production

### Must-have foundations

1. **Authentication and workspace isolation.** Add managed sign-in, workspace membership, roles, and row-level security. Every tenant-owned record must include a workspace id.
2. **Persistent database.** Move orders, contacts, conversations, products, tasks, team metrics, and integrations from fixtures into Supabase or another managed Postgres service.
3. **Real provider authorization.** Add server-side OAuth for Meta and Google, encrypted token storage, reconnect, disconnect, permission review, and account selection.
4. **Signed webhooks.** Verify provider signatures, reject unknown payloads, record provider event ids, and make processing idempotent so retries cannot create duplicate orders.
5. **Operational audit trail.** Record who changed an order, reassigned a request, changed a product, or disconnected a channel.
6. **Production secrets.** Keep OAuth secrets, service-role keys, webhook verification tokens, and payment secrets in deployment secrets only.

### Business must-haves

- Confirm the exact spelling and public brand name: “Les Mille Saveurs du Cap Bon”.
- Confirm whether the customer has an Instagram Professional account and an administered Facebook Page.
- Confirm the real Website intake destination, WhatsApp Business number, Facebook Page, and Google Ads account.
- Confirm product prices, stock, delivery fees, payment methods, refund rules, and operating hours.
- Decide which team members can see all customers versus only assigned conversations.
- Agree on the definition of conversion rate: won customers divided by reached customers, orders divided by calls, or both.
- Decide whether manual phone orders are counted as a channel or as a separate order-entry method.

## High-value polish still worth adding

### Customer demo polish

- Add a “Demo tour” button with four guided stops: Dashboard, order source, team conversion, and integrations.
- Add a small “What happens next” card on Integrations with the exact three steps needed to connect Instagram and WhatsApp.
- Add a sample product image or tasteful initials tile to the Products page so the catalog feels less text-only.
- Add one priority customer queue for high-value, unanswered, or repeat-buyer conversations.
- Add a date-range selector that keeps the selected period consistent across KPI, source, team, and delivery panels.
- Add a small activity timeline to an order: received, assigned, confirmed, dispatched, delivered.

### Owner workflow polish

- Add quick actions: new manual order, assign conversation, call customer, mark ready, and open connector alert.
- Show the next action beside every warning instead of only showing the status.
- Add a connection health summary with “receiving”, “needs setup”, “warning”, and “not connected”.
- Add low-stock and missing-price checks before a customer can be shown a product as available.
- Add saved filters such as “Instagram orders”, “unassigned today”, and “high-value customers”.

### Team performance polish

- Add response time, follow-up completion, rejection reasons, and conversion by channel.
- Show trends over time instead of ranking people only by one percentage.
- Let managers filter by team member, channel, period, and order outcome.
- Keep rejected customers visible with a reason so the team can improve qualification.

## Production roadmap

### Phase 1: make the preview customer-ready

- Keep the sample-data badge and add the demo tour.
- Confirm branding, prices, product catalog, and delivery rules.
- Add the order activity timeline and saved filters.
- Replace the preview wording only after a real connection is verified.

### Phase 2: connect one real channel safely

- Start with Instagram Professional messaging or WhatsApp Business, not every provider at once.
- Add managed authentication and one workspace.
- Store webhook events and provider ids before creating conversations or orders.
- Test duplicate delivery, disconnect, reconnect, permission removal, and provider errors.

### Phase 3: add the operating system around it

- Add team roles, audit log, customer data export, deletion workflow, and notifications.
- Add catalog import and stock synchronization.
- Add production monitoring and an incident runbook.
- Connect the remaining channels after the first connector is stable.

## Launch acceptance checklist

- [ ] Customer can explain the value in one sentence.
- [ ] Demo sample data is clearly labeled.
- [ ] Every order shows a source and customer.
- [ ] No fake credential, phone, or domain is presented as live.
- [ ] Instagram and WhatsApp account ownership is confirmed.
- [ ] Authentication works for owner, manager, and agent roles.
- [ ] RLS blocks cross-workspace access.
- [ ] Webhook signatures are verified.
- [ ] Duplicate provider events do not duplicate orders.
- [ ] Connector errors show a next action.
- [ ] Orders, messages, and customer changes are auditable.
- [ ] Production secrets are not in the repository.

## Research notes

The production recommendations were checked against the official guidance for the services planned for OmniShop:

- Supabase, “Row Level Security”: https://supabase.com/docs/guides/database/postgres/row-level-security
- Stripe, “Webhooks”: https://docs.stripe.com/webhooks
- Vercel, “Preview Deployments”: https://vercel.com/docs/deployments/preview-deployments
- Vercel, “Environment Variables”: https://vercel.com/docs/environment-variables
- Meta, “Instagram Messaging API”: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/messaging-api

These sources support the security, webhook, deployment, and integration-readiness items above. The visual recommendations are based on the current OmniShop screens and the customer-demo workflow rather than on claims about the customer’s real accounts.
