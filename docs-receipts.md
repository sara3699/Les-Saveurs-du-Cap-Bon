# Receipts and expenses

How the shop records money going out: photograph a receipt, let the machine read it, correct
what it got wrong, and let the owner confirm it.

Everything below is about the built feature. Where something is not built, it says so.

---

## The rule everything hangs off

**Only a verified receipt counts.** A receipt the machine read but nobody confirmed is visible
on the screen, is counted in "à vérifier", and is worth nothing in any total. That is the point
of the review step, and a total that quietly included unconfirmed readings would undo it.

The second rule, set by Sarra: **only the owner sees the finances, but the team can scan a
receipt into the workspace.**

| | Owner | Manager | Agent |
|---|---|---|---|
| Scan or upload a receipt | yes | yes | yes |
| Review and correct the one they filed | yes | yes | yes |
| See every receipt in the shop | yes | no | no |
| See expense totals, VAT, charts, export | yes | no | no |
| Verify a receipt | yes | no | no |
| Archive a receipt | yes | no | no |

For a signed-in account this is enforced in the database, by row level security and by a role
check inside `save_receipt` and `archive_receipt`. **For the demonstration shop it is enforced
in the application instead**, because the demonstration door signs nobody in and the database
cannot tell a visitor who picked Sarra from one who picked an agent. Every figure in that shop
is invented.

---

## The user's path

1. **Reçus et dépenses** in the navigation. The owner sees the expenses screen; anybody else
   sees "Mes reçus", which is their own uploads and no totals.
2. **Scanner un reçu.** Camera with live QR scanning, camera photo, drag and drop, or file
   picker. JPG, PNG, HEIC, PDF, 15 MB at most.
3. The photograph can be **turned and cropped** in the browser before it is sent. A receipt that
   is straight and fills the frame reads far better than one lying across a counter.
4. **Send.** A progress bar that reports what has actually been sent, and a cancel button.
5. The receipt is **read**, and the person lands on the review screen.
6. **Correct anything.** Every field is editable, every one carries how sure the reader was, and
   a field the reader missed is an empty box with "Non trouvé, à saisir" beside it.
7. **Confirmer et enregistrer.** The owner's press makes it "Vérifié" and it enters the totals.
   Anyone else's makes it "À vérifier" and it waits for her.

Statuses: Brouillon, À vérifier, Vérifié, Erreur, Archivé.

---

## Architecture

```
browser                          server                        database / storage
───────                          ──────                        ──────────────────
choose or photograph a file
decode QR (BarcodeDetector
  or zxing-wasm)
        │
        │ multipart POST         /api/receipts
        └───────────────────────▶ validate extension, declared
                                  type, file signature, size
                                  hash the bytes
                                  build the storage path
                                  parse the QR string
                                       │  register_receipt() ──▶ receipts row, status draft
                                       │                          + receipt_events + audit_logs
                                       └  storage.upload ───────▶ private bucket
        │ POST                   /api/receipts/[id]/process
        └───────────────────────▶ download the file
                                  scanFileForQr(bytes, mime)
                                    PDF: extract pictures, else draw
                                    image: re-read if none was found
                                  ocrProvider().extract()
                                  extractReceipt(text, qr)
                                       │  apply_receipt_extraction()
                                       └────────────────────────▶ fields, items, status to_verify
        │ server action          saveReceipt()
        └───────────────────────▶ save_receipt() ───────────────▶ status verified, or to_verify
```

**Why the upload and the reading are two requests.** A slow or failing reader cannot then lose a
file that was safely received, and a failed read can be tried again without asking anyone to
photograph the receipt a second time.

**Why the row is taken before the file is stored.** A refused upload never leaves a file behind
with nothing pointing at it. If the storage write then fails, `discard_receipt` removes the
draft row so its fingerprint does not block a second attempt.

### Idempotency

Processing is safe to call twice, three times, or after a crash:

- `apply_receipt_extraction` acts only on a receipt whose status is `draft` or `error`. Anything
  else returns `{ok: true, skipped: true}` and changes nothing.
- Line items and field notes are deleted by `receipt_id` and re-inserted, never appended, so a
  retry cannot produce a receipt with every line listed twice.
- `receipts` has a unique index on `(organization_id, file_hash)`. The same file cannot be filed
  twice at all, whatever the application does.

### No queue

There is none. For one shop filing a few receipts a day, a request that waits is the right shape
and an honest one. The processing route is `maxDuration = 120`.

**What would move to a queue at production scale:** the `/api/receipts/[id]/process` body. This
Supabase project already has `pgmq` available (not installed). The shape would be: the upload
route enqueues the receipt id, a worker drains the queue calling the same OCR provider and the
same `apply_receipt_extraction`, and the review screen polls or listens on Realtime for the
status to leave `draft`. Nothing in the current code would need rewriting, only re-hosting,
because the extraction is already a pure function and the write is already idempotent.

---

## The QR code

A QR code printed on a receipt is a string a stranger printed. It is data, never an instruction.

- **Decoded in the browser**, by the browser's own `BarcodeDetector` where it exists (Chrome,
  Edge, Android) and by `zxing-wasm` where it does not (Safari, iOS). The WebAssembly file is
  served from `/zxing/`, copied out of `node_modules` before `dev` and `build` by
  `scripts/copy-zxing.mjs`, so scanning never fetches anything from a CDN.
- **Parsed on the server**, by `parseQrPayload` in `src/lib/receipts/qr.ts`, which is where every
  rule lives: a 4 096 character cap, control characters stripped, https only, no credentials in
  the address, standard port only, and no host on a private network.
- **Stored raw**, in `receipts.qr_payload`, separately from anything parsed out of it.
- **Never opened.** Nothing navigates to a QR address and nothing fetches one.

Shapes it recognises: JSON (mapped onto merchant, total, currency, receipt number, tax number),
a Tunisian matricule fiscal, a payment reference, a bare receipt number, and a verification
address. Anything else is kept verbatim and flagged for a person, with a sentence saying why.

**The server reads it too, and for PDFs the server is the only one that reads it.**
`src/lib/receipts/scan-server.ts` runs on the stored file in the processing route, in two
passes:

1. **Pictures inside the PDF** are pulled out with `unpdf` and read at their own resolution.
   That catches a scanned receipt and anything produced by printing a web page, and is cheap
   because nothing is drawn.
2. **The page is drawn** with PDFium at 200 DPI and read. A code drawn as vector shapes leaves
   no picture to pull out, and that is not a rare shape: the PHP invoicing software common in
   France and North Africa draws it exactly that way. Without this pass those receipts fail
   silently, which is the worst way for them to fail.

The same reader also re-scans a stored **photograph** when the browser found no code, which
covers an old browser or a blocked WebAssembly file. What the browser found always wins: it saw
the paper, and the server is the safety net rather than the authority.

Whatever the server finds goes through `parseQrPayload` unchanged. Finding a code and reading
the receipt are separate successes, so a code found on a receipt whose reading then fails is
kept by `attach_receipt_qr`, a function that writes three columns and touches nothing else.

**Limitations, plainly:**

- **Remote verification against a tax authority is not built.** A verification address is stored
  and displayed as text for a person to copy. The SSRF guard exists so that address was already
  refused at the door if it pointed anywhere dangerous, not because anything fetches it.
- A QR code rarely carries a whole receipt, so the photograph is always needed as well. Finding a
  code during a camera scan keeps the same frame as the picture, so nobody aims twice.

---

## Reading the receipt

Two pieces, deliberately separate.

**The provider** returns text and a confidence. `src/lib/ocr/`:

| | |
|---|---|
| `types.ts` | the interface: `accepts(mime)` and `extract({bytes, mime, fileHash})` |
| `demo.ts` | invents a receipt, deterministically from the file's own hash |
| `google.ts` | Google Cloud Vision |
| `index.ts` | picks one, once |

**The extraction** is ours, in `src/lib/receipts/extract.ts`. What "TOTAL TTC" means, and that
"NET À PAYER" beats "SOUS-TOTAL" when both appear, is knowledge about French and Tunisian
receipts that belongs in a file with tests beside it rather than inside a vendor. It is why
merchant, date, VAT, totals and line items are testable without a network, and why the provider
can be replaced without touching any of it. French and English are handled; the shape is ready
for Arabic and nothing in it assumes a Latin script beyond the word lists.

Normalising lives in `src/lib/receipts/normalize.ts` and returns null rather than guessing:

- **Amounts.** Whichever of a comma or a full stop appears last is the decimal separator. That
  reads "1 234,567", "1,234.56" and "1.234,56" correctly, and reads the Tunisian "12,500" as
  twelve dinars five hundred millimes. The cost: "1.234" meaning one thousand two hundred and
  thirty-four comes back as 1.234, which is why every amount is shown for correction.
- **Dates.** Day first, because Tunisia writes 04/03 for the fourth of March. Month first only
  when day first cannot be a real date, so 12/25/2026 still reads.
- **Currency.** Recognised words and symbols only, so a stray three-letter word is not promoted
  to a currency.
- **Card numbers.** `normalizeCardLastFour` returns at most four digits, ever. The column is
  `char(4)` with a check constraint. A whole card number cannot be stored even by mistake.

### The demonstration reader

When no OCR service is configured, which is how this project ships, receipts are read by
`demo.ts`. It invents a receipt from the file's hash. It does not read the file.

Every screen that shows its output carries this, in words, not in a tooltip:

> Mode démonstration : aucun service de lecture n'est connecté. Les montants proposés sont
> inventés à partir du fichier, ils ne sont pas lus dessus. Corrigez-les avant d'enregistrer.

The receipt itself records `demo` as its reader, and the review screen prints "Lecture de
démonstration" beside it. The invented suppliers are named "… Exemple" and every invented tax
number begins 9999, which is not a range Tunisia issues, so none can collide with a real
business.

It is still useful: its output goes through the real extractor, the real normalisers and the
real review screen, so the parts that are real are genuinely exercised by using it.

### Google Cloud Vision

**This adapter has never been run against the live service.** It was written from Google's
published request and response shapes, with no account and no key to test it. Before relying on
it: set the two variables below, upload one real receipt, and watch what comes back.

It reads JPEG, PNG and PDF. It does not read HEIC, and a HEIC receipt sent to it lands in
"Erreur" with a French sentence asking for a JPEG or a PDF.

---

## When a reading is refused

A reading that cannot be trusted is **refused, not repaired**. Nothing fills a gap with a
plausible value. The judgement lives in `src/lib/receipts/validate.ts`, is made on the
extraction rather than on any one provider's text, and is decided in one place so it holds
whichever reader ran.

**Required before anyone is asked to believe a receipt:** supplier, total, purchase date.

**Refused when:** the page carries too little text to have been a receipt; the supplier,
total or date is missing; a currency was printed that makes no sense; or the amounts
disagree **and** the reading was already shaky. Arithmetic alone never refuses a receipt.
Real ones round, and the shopkeeper holding the paper is the better authority.

**One deviation from the specification, stated plainly.** Currency was specified as
required. A Tunisian till roll prices in dinars and prints no currency code at all, so
requiring one would refuse nearly every real receipt this shop handles. The shop's own
currency stands in, which is a known fact about the shop rather than a guess about the
receipt, and it appears in an editable box like every other field. A currency that was
printed and could not be understood still refuses the receipt.

**Refused is not lost.** The file stays, and so does everything that *was* read. A receipt
missing only its total keeps its supplier and its date, so the person filling the gap fills
one box rather than the whole form. `status` becomes `error`, and two columns carry the
detail:

| Column | Holds |
|---|---|
| `rejection_reasons` | `[{code, message}]`. Our own sentences, never text read off the receipt. `[]` means judged and nothing wrong; `null` means never judged. |
| `missing_fields` | The required field names, so the review screen outlines them in red rather than amber. |

The review screen prints the reasons as a list, names the fields to complete, and says
that nothing was lost. `Relire le fichier` is still offered, and so is typing the values in.

**The processing endpoint answers in this shape**, alongside the fields this application's
own screens use:

```json
{
  "status": "rejected",
  "extracted_data": { "merchant_name": null, "total_amount": null, "...": "..." },
  "reasons": ["Le total n'a pas été trouvé, ou n'est pas un montant lisible."],
  "reason_codes": ["total_missing"],
  "missing_fields": ["total_amount"],
  "confidence": 0.31,
  "file_reference": "<receipt id>",
  "suggested_next_step": "manual review"
}
```

`extracted_data` is filled even on a refusal, because the reading is kept. Every value in
it was read or is null; none was invented. The reasons are our own static sentences, so
nothing a stranger printed on a receipt can travel into a log, an export or a screen
through this route.

---

## Environment variables

| Name | Needed for | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | everything | already in use |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | everything | already in use, safe in the browser |
| `OCR_PROVIDER` | a live reader | set to `google`. Anything else, or unset, means the demonstration reader |
| `GOOGLE_VISION_API_KEY` | a live reader | **server only**. Never prefix it `NEXT_PUBLIC_` |

Both new variables are read in `src/lib/ocr/index.ts` and nowhere else. With `OCR_PROVIDER=google`
and no key, the demonstration reader is used and says so; there is no silent half-configured
state.

Two WebAssembly files have to reach the server, and nothing imports them, so nothing traces
them automatically. `next.config.ts` names them under `outputFileTracingIncludes` for the
processing route. If a deployed PDF suddenly reports no code while the same file works locally,
that is the first thing to check.

There is still **no service-role key anywhere in this project**, and this feature does not
introduce one. Every read and write, including the file upload, runs as the person signed in.

---

## Database

Twelve migrations, in `supabase/migrations/`, all additive:

| Version | Name |
|---|---|
| 20260910235401 | `receipts_and_expenses` |
| 20260910235421 | `receipts_row_level_security` |
| 20260910235518 | `receipt_storage` |
| 20260910235757 | `receipt_register_and_discard` |
| 20260910235826 | `receipt_apply_extraction` |
| 20260910235855 | `receipt_save_review` |
| 20260910235913 | `receipt_archive_and_reprocess` |
| 20260911002032 | `register_receipt_keeps_the_qr_code` |
| 20260911013249 | `attach_receipt_qr` |
| 20260911020404 | `receipt_rejection_reasons` |
| 20260911020511 | `apply_receipt_extraction_carries_the_verdict` |
| 20260911020921 | `apply_receipt_extraction_status_cast` |

### Tables

- **`receipts`** — one row per filed receipt. Amounts are `numeric(14,3)`, because a dinar has
  three decimals. `merchant_normalized` is a **generated column** computed by
  `public.normalize_merchant(merchant_name)`, so two spellings of one supplier can never be
  filed apart and nothing upstream can disagree with it.
- **`receipt_items`** — the lines, replaced wholesale on every read or save.
- **`receipt_extraction_fields`** — one row per field the reader had an opinion about, unique on
  `(receipt_id, field_name)`. This is what lets the screen say "this total was read at 42 per
  cent and nobody has touched it since", and what `manually_corrected` records.
- **`receipt_events`** — upload, extraction, correction, verification, archival. Separate from
  `audit_logs` because this one is shown to the person on the screen. There is no update or
  delete policy on it, on purpose.

### Functions

All six are `SECURITY INVOKER`, like `create_manual_order` and unlike the website intake
function, because the caller is a signed-in person and row level security is exactly the rule
that should decide what they may touch.

| Function | Does |
|---|---|
| `register_receipt(payload)` | takes the row, checks the path belongs to the caller's shop, rate limits to 30 a minute per person, refuses a file already on file |
| `discard_receipt(id)` | removes a draft whose upload never finished |
| `apply_receipt_extraction(id, payload)` | writes what was read. Idempotent |
| `save_receipt(id, payload)` | what the review screen saves. Verifying is refused to anyone but the owner |
| `archive_receipt(id)` | owner only |
| `reprocess_receipt(id)` | back to draft so it will be read again |

### Row level security

```sql
-- read
app_private.is_demo(organization_id)
  or app_private.member_role(organization_id) = 'owner'
  or uploaded_by = app_private.my_member_id(organization_id)

-- insert: a receipt is always filed under the name of whoever filed it
app_private.is_member(organization_id)
  and uploaded_by = app_private.my_member_id(organization_id)

-- update: the status list is what stops anyone but the owner verifying
app_private.member_role(organization_id) = 'owner'
  or (uploaded_by = app_private.my_member_id(organization_id)
      and status in ('draft', 'to_verify', 'error'))
```

Three new helpers join `is_member`, `member_role` and `is_demo`:
`app_private.my_member_id`, `can_read_receipt`, `can_write_receipt`.

### Storage

A **private** bucket, `receipts`. 15 MB limit, and only the five accepted media types.

```
<organization-id>/<year>/<uuid>.<extension>
```

Tenant isolation is in the object name itself, so a policy does not have to infer it. The name is
generated by `storagePath()` and never taken from the uploaded file, which is what stops a
filename walking out of its own folder. `app_private.receipt_file_org()` returns nothing at all
when the first segment is not a uuid, so every storage policy fails closed on a tampered path.

There is no public address for any receipt. `/api/receipts/[id]/file` mints a signed link that
lasts five minutes, and whether it may be minted at all is decided by the storage policy, not by
that route.

---

## Security

| Concern | What is done |
|---|---|
| Authentication | every route and action re-reads the session on the server; the browser is never trusted for it |
| Tenant isolation | row level security on all four tables and on `storage.objects`; proved by `npm run test:isolation` |
| Role | owner-only checks in the database, not only in the interface |
| File type | extension, declared media type **and the first bytes** are each checked, and must agree |
| Path traversal | storage names are generated, never taken from the upload; the database refuses a path outside the caller's own folder |
| QR content | length-capped, control characters stripped, https and public hosts only, never opened, never fetched |
| Injection into the page | React escapes everything, nothing uses `dangerouslySetInnerHTML`, and `sanitizeForDisplay` is a second layer |
| Injection into a spreadsheet | a cell starting `=`, `+`, `-` or `@` is prefixed with an apostrophe in the CSV export |
| Card data | at most four digits, enforced by a check constraint and by the schema that refuses anything else |
| Rate limiting | 30 receipts a minute per person, inside `register_receipt` |
| Secrets | the OCR key is read server-side in one file; no `NEXT_PUBLIC_` variable carries it; there is no service-role key in the project |
| Logging | provider errors are logged by status and name, never by body, because a body can quote the receipt back |
| Abandoned uploads | a failed storage write deletes the draft row it would otherwise orphan |

---

## Local setup

```bash
npm install
npm run dev          # copies the QR reader's wasm into public/, then starts on port 3100
```

Fill the demonstration shop with receipts, by walking the real path rather than inserting rows:

```bash
npx tsx scripts/seed-receipts.ts
npx tsx scripts/seed-receipts.ts --reset   # clears the shop's receipts and files first
```

Rebuild the files the browser tests upload:

```bash
node scripts/make-fixtures.mjs
```

---

## Testing

```bash
npm test              # 172 unit tests
npm run test:isolation # 25 checks that one shop cannot reach another
npm run test:e2e      # 26 browser journeys
npm run lint
npx tsc --noEmit
npm run build
```

What the new unit tests cover: QR payload parsing and the refusal of malicious ones, field
normalisation, currency and date parsing, the totals check, duplicate detection, file validation
including a renamed executable, the demonstration reader's determinism and labelling, the
dashboard aggregations, and the filter reader.

What the new browser journeys cover: a receipt uploaded, read, corrected, verified and appearing
in the list as Vérifié; a QR code decoded from a real QR image by the real reader; a file that is
not what its name says being refused in French; an agent seeing no figures; the demonstration
door being unable to save; and the no-camera fallback at a phone viewport.

The browser tests write to the live demonstration database and clear up after themselves in
`afterAll`, matching on a `test-e2e-` filename.

---

## Production checklist

1. Apply the twelve migrations to the target project.
2. Confirm the `receipts` bucket exists and `public` is **false**.
3. Run `npm run test:isolation` against that project.
4. Decide on a reader. Leave it in demonstration mode, or set `OCR_PROVIDER=google` and
   `GOOGLE_VISION_API_KEY` in the deployment's secret store, never in a file.
5. If a live reader is configured, process one real receipt and read what comes back before
   anyone relies on it.
6. Check that the expenses screen is invisible to a non-owner account on the deployed site.
7. Decide what happens to HEIC. Either tell the shop to photograph in JPEG, or add conversion.

---

## Known limitations

- **The Google adapter has never been run.** Written from the documentation, untested.
- **HEIC is stored but not read.** No browser previews it and Cloud Vision refuses it. It is
  accepted, validated and kept; the screen says all of this before the file is sent.
- **A QR code is read, never verified.** Tunisia does run a national electronic invoicing
  system, El Fatoora, operated by Tunisie TradeNet, and a compliant invoice carries a signed
  code that can be checked. Connecting to it waits on the shop's own subscription and on seeing
  one of their real receipts, the same way the Instagram and WhatsApp connectors wait on their
  accounts. It is not a technical wall.
- **No remote verification** of a tax-authority address.
- **No background queue.** See above for what would move.
- **Expenses do not reach the budget screen.** `/budget` still knows nothing about receipts.
- **No supplier entity.** The merchant is a normalised text field. Inventing this shop's supplier
  list would break the rule that their real details are not ours to invent. The normaliser also
  treats "S.A.R.L." and "SARL" as different suppliers; correcting the name on the review screen
  is the fix.
- **The demonstration shop's role gate is in the application, not the database**, because the
  demonstration door signs nobody in. Every figure in that shop is invented.
