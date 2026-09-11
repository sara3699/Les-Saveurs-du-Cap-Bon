# Environment guide

## Prerequisites

- Node.js 20 or newer.
- npm.
- A local terminal with access to the repository.
- Optional: a browser for the local preview.

## Local setup

From this repository:

```bash
npm install
npm run dev
```

The local app runs on port `3100`.

Useful checks:

```bash
npm run lint
npm test
npm run build
npm run test:e2e
```

The current project uses demo repositories, so the local app does not require Supabase, Meta, Google, Stripe, or other provider credentials to render the dashboard.

## Current environment variables

There are no required environment variables for the mock-first dashboard. This is intentional: the project must remain safe to review without asking the business owner to paste credentials into a terminal or chat.

Do not add real tokens to:

- `.env` files committed to Git.
- `README.md` or Markdown docs.
- Mock fixtures.
- Browser-exposed `NEXT_PUBLIC_*` variables.

## Recommended production variables

When the real backend is introduced, keep the names in a deployment secret manager and document only the purpose, not the values.

```text
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OCR_PROVIDER
GOOGLE_VISION_API_KEY
META_APP_ID
META_APP_SECRET
META_WEBHOOK_VERIFY_TOKEN
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_WEBHOOK_SECRET
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
```

## The demonstration accounts

`DEMO_OWNER_EMAIL`, `DEMO_OWNER_PASSWORD`, `DEMO_AGENT_EMAIL` and `DEMO_AGENT_PASSWORD` in
`.env.local` are what the tests and the seeding script sign in as. They are read by
`e2e/accounts.ts` and by the two scripts, and they appear in no file git tracks.

These two passwords were written out in full across ten files in the public repository
until 2026-09-11. The owner's account can write, so anyone who read them could have
signed in and changed the shop's data. Both were changed and the published ones are
refused. Change them again with:

```bash
node scripts/rotate-demo-passwords.mjs
```

It signs in as each person, sets a new password, proves the new one works before
recording it, and writes it into `.env.local` without printing it. The other demonstration
members, Khaled and Yassine, never had their passwords published and were left alone.

## The website intake key

`WEBSITE_INTAKE_KEY` in `.env.local` holds the key the shop's own website posts orders
with. It belongs to whoever runs that website's server, and it is never read by this
application: the intake endpoint takes the key from the request, not from an environment
variable. It lives here so the browser tests can use it without writing it into a file
git tracks.

Issue a new one with `node scripts/rotate-intake-key.mjs`, which signs in as the owner,
asks the database for a key, and writes it straight into `.env.local` without printing
it. Issuing a new one makes the previous one stop working immediately.

## Reading receipts

Two variables, both optional and both server-only. `OCR_PROVIDER=google` together with
`GOOGLE_VISION_API_KEY` turns on Google Cloud Vision. With either missing, receipts are read by
the demonstration reader, which invents its figures from the file's hash and says so on every
screen that shows them. There is no silent half-configured state.

`GOOGLE_VISION_API_KEY` must never be prefixed `NEXT_PUBLIC_`. It is read in
`src/lib/ocr/index.ts` and nowhere else. The whole receipts feature, file upload included, runs
as the person signed in, so it needs no service-role key. See `docs-receipts.md`.

Only `NEXT_PUBLIC_*` values are safe for browser delivery. Service-role keys, OAuth secrets, webhook verification tokens, and payment secrets must stay in server-only code and deployment secrets.

## Production setup order

1. Create a Supabase project for the target environment.
2. Apply the schema and enable RLS on every workspace-owned table.
3. Create the first owner account through managed authentication.
4. Add the workspace and membership records.
5. Configure server-side OAuth callbacks for Meta and Google.
6. Register signed webhook endpoints.
7. Add an authorized Website intake form.
8. Run provider verification and test with a non-customer account.
9. Import only the approved catalog and stock data.
10. Switch the repository provider after idempotency and access tests pass.

## Provider connection checklist

### Instagram and Facebook

- Use a Professional Instagram account.
- Confirm the Instagram account is linked to the correct Facebook Page.
- Request only the permissions the product needs.
- Verify signed webhook payloads.
- Test inbound messages, comment-to-lead behavior, and reconnect behavior.
- Never present the connector as live until a real event is received and stored.

### WhatsApp Business

- Use an approved business account and phone number.
- Keep template approval status visible.
- Store provider message ids for retry protection.
- Enforce the provider's conversation window rules.

### Google

- Keep Google Ads lead forms separate from Google Business Profile events.
- Store campaign and form ids for attribution.
- Reject and surface invalid webhook keys.
- Never count reviews as orders.

## Testing environments

Use three separate environments:

- **Local:** demo data or a disposable sandbox account.
- **Preview:** isolated Supabase project and provider test assets.
- **Production:** production database, production OAuth apps, and approved business accounts.

Never reuse production webhook secrets in local development. For provider work, use a test workspace with fake contacts and clearly labeled sample orders.

## Deployment notes

The app is a Next.js application and can be deployed to Vercel or another Node-compatible platform. Configure the build command as `npm run build`, keep the runtime on Node 20+, and set the application URL before registering OAuth callbacks.

### How this copy deploys

The published demonstration is the Vercel project `omnishop`, served at
`https://omnishop-ten.vercel.app`.

Until 2026-09-10 that project had no repository connected to it, so pushing changed
nothing and every deployment had to be run by hand. It was easy to miss: the site kept
working, it simply kept serving an older commit, and at one point it sat four commits
behind `main` without any sign on the screen. The repository is connected now, so a push
to `main` builds and deploys on its own.

`npx vercel --prod` still works and is the fallback when a deployment has to go out
without a push, or when the connection has to be checked.

Before launch, verify:

- Authenticated users cannot read another workspace.
- Webhook retries do not duplicate orders or messages.
- A disconnected connector stops sending and explains why.
- Background jobs report failures visibly.
- The dashboard labels demo or live data clearly.
- Secrets are present only in the deployment secret store.
