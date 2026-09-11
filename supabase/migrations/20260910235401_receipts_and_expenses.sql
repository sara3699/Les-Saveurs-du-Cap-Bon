-- Money going out of the shop.
--
-- Orders record what comes in and keep the channel they arrived on. Receipts record
-- what goes out and keep the file they were read from, plus what was read, plus how
-- sure the reader was about each field. Nothing here counts towards a total until a
-- person has confirmed it, which is why status is a state and not a boolean.
--
-- Enum values are English and screens print French, the way every existing enum in
-- this database already works.

-- The key two spellings of one supplier collapse onto. Accents folded, case dropped,
-- punctuation turned into single spaces, so "Café des Délices" and "CAFE DES DELICES."
-- group as one supplier and not as two.
--
-- It is immutable, which is what lets the column below be generated from it. One
-- implementation, in one place, that the application cannot disagree with.
create or replace function public.normalize_merchant(value text)
returns text
language sql
immutable
as $fn$
  select nullif(
    btrim(
      regexp_replace(
        lower(translate(coalesce(value, ''),
          'àâäáãåÀÂÄÁÃÅçÇèéêëÈÉÊËìíîïÌÍÎÏñÑòóôöõÒÓÔÖÕùúûüÙÚÛÜýÿÝ',
          'aaaaaaAAAAAAcCeeeeEEEEiiiiIIIInNoooooOOOOOuuuuUUUUyyY')),
        '[^a-z0-9]+', ' ', 'g'),
      ' '),
    '');
$fn$;

create type receipt_status as enum ('draft', 'to_verify', 'verified', 'error', 'archived');
create type receipt_source_type as enum ('qr', 'camera', 'upload');
create type expense_category as enum (
  'supplies', 'transport', 'packaging', 'marketing', 'rent', 'utilities', 'taxes', 'fees', 'other'
);

create table receipts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  uploaded_by uuid references organization_members (id) on delete set null,
  source_type receipt_source_type not null default 'upload',
  status receipt_status not null default 'draft',

  -- What was read off the paper. Every one of these is editable by a person, because
  -- no reader is trusted with the shop's accounts.
  merchant_name text,
  -- Grouping "by supplier" happens on this, and the database computes it so nothing
  -- upstream can file the same supplier under two spellings.
  merchant_normalized text generated always as (public.normalize_merchant(merchant_name)) stored,
  merchant_address text,
  tax_identifier text,
  receipt_number text,
  purchase_date date,
  purchase_time time,
  currency char(3) not null default 'TND',
  subtotal numeric(14, 3),
  discount numeric(14, 3),
  tax_amount numeric(14, 3),
  tip_amount numeric(14, 3),
  total_amount numeric(14, 3),
  payment_method text,
  -- Four digits at most, ever. A full card number has no reason to exist here and the
  -- constraint below is what makes that a rule rather than an intention.
  card_last_four char(4),
  category expense_category not null default 'other',

  -- The QR code exactly as it was scanned, kept apart from anything parsed out of it.
  qr_payload text,
  qr_kind text,
  -- Stored so a person can decide what to do with it. Nothing in this product opens it.
  verification_url text,

  raw_ocr_text text,
  extraction_provider text,
  extraction_confidence numeric(4, 3),
  extraction_error text,

  file_path text not null,
  file_name text,
  file_mime text not null,
  file_size integer not null,
  file_hash text not null,

  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  processed_at timestamptz,
  verified_at timestamptz,
  verified_by uuid references organization_members (id) on delete set null,
  archived_at timestamptz,

  constraint receipts_card_last_four_digits
    check (card_last_four is null or card_last_four ~ '^[0-9]{4}$'),
  constraint receipts_currency_iso
    check (currency ~ '^[A-Z]{3}$'),
  constraint receipts_amounts_not_negative
    check (coalesce(subtotal, 0) >= 0 and coalesce(discount, 0) >= 0
       and coalesce(tax_amount, 0) >= 0 and coalesce(tip_amount, 0) >= 0
       and coalesce(total_amount, 0) >= 0),
  constraint receipts_confidence_range
    check (extraction_confidence is null
        or (extraction_confidence >= 0 and extraction_confidence <= 1)),
  constraint receipts_file_size_positive check (file_size > 0)
);

-- The same file cannot be filed twice. This is the one duplicate signal strong enough
-- to be a constraint; every other signal only warns, because two genuine receipts from
-- the same supplier on the same day for the same amount do happen.
create unique index receipts_org_file_hash_key on receipts (organization_id, file_hash);

create index receipts_org_status_idx on receipts (organization_id, status);
create index receipts_org_date_idx on receipts (organization_id, purchase_date desc nulls last);
create index receipts_org_merchant_idx on receipts (organization_id, merchant_normalized);
create index receipts_org_uploader_idx on receipts (organization_id, uploaded_by);
create index receipts_org_category_idx on receipts (organization_id, category);
-- The shape the duplicate warning looks for.
create index receipts_duplicate_probe_idx
  on receipts (organization_id, merchant_normalized, purchase_date, total_amount, currency);

create table receipt_items (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references receipts (id) on delete cascade,
  organization_id uuid not null references organizations (id) on delete cascade,
  line_number integer not null default 0,
  description text not null,
  quantity numeric(12, 3) not null default 1,
  unit_price numeric(14, 3) not null default 0,
  tax_amount numeric(14, 3),
  total_amount numeric(14, 3) not null default 0,
  category expense_category,
  confidence numeric(4, 3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint receipt_items_quantity_positive check (quantity > 0),
  constraint receipt_items_amounts_not_negative
    check (unit_price >= 0 and total_amount >= 0 and coalesce(tax_amount, 0) >= 0),
  constraint receipt_items_confidence_range
    check (confidence is null or (confidence >= 0 and confidence <= 1))
);

create index receipt_items_receipt_idx on receipt_items (receipt_id, line_number);
create index receipt_items_org_idx on receipt_items (organization_id);

-- One row per field the reader had an opinion about, kept beside the receipt rather
-- than inside it. This is what lets the review screen say "this total was read at 42
-- per cent confidence and nobody has touched it since".
create table receipt_extraction_fields (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references receipts (id) on delete cascade,
  organization_id uuid not null references organizations (id) on delete cascade,
  field_name text not null,
  raw_value text,
  normalized_value text,
  confidence numeric(4, 3),
  manually_corrected boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint receipt_extraction_fields_confidence_range
    check (confidence is null or (confidence >= 0 and confidence <= 1)),
  -- Re-running the reader replaces a field rather than adding a second one, which is
  -- what makes processing safe to retry.
  unique (receipt_id, field_name)
);

create index receipt_extraction_fields_org_idx on receipt_extraction_fields (organization_id);

-- Upload, extraction, correction, verification, archival. The history of one receipt,
-- separate from audit_logs, because this one is shown to the person on the screen.
create table receipt_events (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references receipts (id) on delete cascade,
  organization_id uuid not null references organizations (id) on delete cascade,
  action text not null,
  actor_member_id uuid references organization_members (id) on delete set null,
  previous_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

create index receipt_events_receipt_idx on receipt_events (receipt_id, created_at desc);
create index receipt_events_org_idx on receipt_events (organization_id, created_at desc);
