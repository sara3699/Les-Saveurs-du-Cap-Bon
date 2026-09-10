# Les Saveurs du Cap Bon

Every order, product and customer request, from every channel, in one organised workspace.

This is the order workspace for a small shop: one inbox for requests arriving from a
website form, WhatsApp Business, Instagram, Facebook Messenger, Google Ads lead forms and the
counter, and one order list where each order still says which of those it came from.

This is step 1a of the build. Everything runs on demo data. No provider account is connected, no
credentials are stored, and nothing sent from this app reaches a customer.

## Running it

```bash
npm install
npm run dev
```

The app runs on http://localhost:3100 and opens on the dashboard.

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server on port 3100 |
| `npm run build` | Production build |
| `npm run lint` | ESLint, with the Next.js rules |
| `npm run test` | Vitest, currently the source attribution suite |

## What is built

Four screens are finished, because these four carry the idea the product is built on: a request
keeps its source from the first message to the paid order.

- **Dashboard**: orders today, this week and this month, revenue in dinars, a source panel with
  counts, revenue, share and trend for all six sources, a needs-attention list, a seven day
  confirmed against abandoned chart, delivery outcomes, demand by channel, and a call-to-order
  conversion funnel with team comparison.
- **Orders**: filter by source, period, payment, delivery, owner, value and free text. Every row
  carries a source badge. An order page shows the whole attribution record.
- **Inbox**: three columns on a desktop, three steps on a phone. Channel, status, assignee, unread
  and text filters. Internal notes look nothing like customer replies, and sending is switched off
  on any channel that is not connected, with the reason in the reply box.
- **Team**: live workload counted from the demo records plus calls received, customers reached,
  customers won, rejected customers, orders placed, revenue, and conversion rate per member.
- **Integrations**: one card per connector with its real status, the business account it needs, the
  permissions it asks for, when it last received anything, what is still outstanding, and what the
  provider reviews before it can work.

The other screens in the navigation exist and say what they will hold. They are built in the next
pass.

## Where the demo data lives

| File | What it holds |
| --- | --- |
| `src/lib/mock/core.ts` | The shop, the team, conversion metrics, tags, products, and the eight channel connections with their states |
| `src/lib/mock/people.ts` | 13 contacts, 18 conversations across all six sources, 41 messages |
| `src/lib/mock/commerce.ts` | 12 hand written orders plus a seeded history of 455 more, and 12 tasks |
| `src/lib/mock/time.ts` | Every timestamp, hung off the moment the server starts |

Screens never read those files. They go through `src/lib/repositories`, which today returns the
demo implementation and later returns a Supabase one without any screen changing.

## The rule the product is built on

An order does not store a channel string. It stores the id of a source attribution record, and
every screen resolves it through `src/lib/domain/attribution.ts`. That resolver throws when an
attribution is missing rather than falling back to a friendly word, because an order labelled
"Online" when the truth is known is the failure this product exists to prevent.

The attribution record holds the channel, the connected account, the provider's own id, when
Les Saveurs du Cap Bon received it, the campaign or referring page when the provider supplies one, and the
conversation and contact it produced. A contact keeps both the channel it first arrived on and the
one it uses now, and the first one is never rewritten.

`npm run test` covers that rule: a WhatsApp order stays WhatsApp, a manual order never claims a
connected account, refused and refunded orders stay in the counts but leave revenue, and every
order in the demo data resolves to one of the six sources.

## What is deliberately not here

- No database. Authentication, the real tables and the rules that keep one shop out of another
  shop's data are step 2.
- No provider credentials, tokens or webhook secrets, in the repository or anywhere else.
- Product names are based on visible public signals from `@lesmillesaveursducapbon`; prices, stock,
  and SKUs are placeholders until an authorised catalog import is available.
- No connector that pretends to be live. The Integrations screen shows the real state of each one,
  including the parts that need review by Meta or Google.
- No export button that does nothing. Export is designed, not faked.

## Design tokens

All colour, type and radius tokens are declared once at the top of `src/app/globals.css`. Channel
colours are kept apart from status colours on purpose, so green never means both WhatsApp and paid
inside the same table row.
