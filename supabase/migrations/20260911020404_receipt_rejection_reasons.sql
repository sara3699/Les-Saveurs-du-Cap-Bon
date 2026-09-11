-- Why a reading was refused, kept beside the receipt rather than squeezed into one
-- sentence.
--
-- A refused receipt is not a discarded one. The file stays, everything that WAS read
-- stays, and these two columns say what is missing and why nobody should believe the
-- rest yet. Someone opens it, fills the gaps, and it becomes an ordinary receipt.

alter table receipts
  add column if not exists rejection_reasons jsonb,
  add column if not exists missing_fields text[];

comment on column receipts.rejection_reasons is
  'Array of {code, message}. Our own sentences, never text read off the receipt.';
comment on column receipts.missing_fields is
  'Names of the required fields that were not found, for the review screen to highlight.';
