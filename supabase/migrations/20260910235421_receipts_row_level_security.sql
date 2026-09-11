-- Who may see the shop's money.
--
-- The owner sees every receipt and every total. Everyone else may photograph a receipt
-- and correct what was read off it, and sees only the ones they filed themselves. That
-- is the rule Sarra set: the team can scan a receipt into the workspace, the owner is
-- the one who sees the finances.
--
-- Verification is the owner's alone, and that is enforced here rather than only in the
-- interface: the update policy refuses to let anyone but the owner leave a receipt in a
-- state other than draft, to_verify or error.
--
-- The demonstration shop stays readable, the way every other table in it is, because a
-- public demonstration with nothing in it is not a demonstration. Every figure in that
-- shop is invented.

create or replace function app_private.my_member_id(target_org uuid)
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select m.id from organization_members m
   where m.organization_id = target_org
     and m.profile_id = auth.uid()
     and m.archived_at is null
   limit 1;
$$;

-- The child tables hang off one receipt, so they ask the same two questions about it
-- rather than repeating the rule four times and letting the copies drift apart.
create or replace function app_private.can_read_receipt(target_receipt uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from receipts r
     where r.id = target_receipt
       and (app_private.is_demo(r.organization_id)
         or app_private.member_role(r.organization_id) = 'owner'
         or r.uploaded_by = app_private.my_member_id(r.organization_id))
  );
$$;

create or replace function app_private.can_write_receipt(target_receipt uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from receipts r
     where r.id = target_receipt
       and (app_private.member_role(r.organization_id) = 'owner'
         or (r.uploaded_by = app_private.my_member_id(r.organization_id)
             and r.status in ('draft', 'to_verify', 'error')))
  );
$$;

grant execute on function app_private.my_member_id(uuid) to anon, authenticated;
grant execute on function app_private.can_read_receipt(uuid) to anon, authenticated;
grant execute on function app_private.can_write_receipt(uuid) to anon, authenticated;

alter table receipts enable row level security;
alter table receipt_items enable row level security;
alter table receipt_extraction_fields enable row level security;
alter table receipt_events enable row level security;

create policy receipts_read on receipts for select using (
  app_private.is_demo(organization_id)
  or app_private.member_role(organization_id) = 'owner'
  or uploaded_by = app_private.my_member_id(organization_id)
);

-- A receipt is always filed under the name of whoever filed it. Nobody may file one
-- under someone else's name.
create policy receipts_insert on receipts for insert with check (
  app_private.is_member(organization_id)
  and uploaded_by = app_private.my_member_id(organization_id)
);

create policy receipts_update on receipts for update
using (
  app_private.member_role(organization_id) = 'owner'
  or (uploaded_by = app_private.my_member_id(organization_id)
      and status in ('draft', 'to_verify', 'error'))
)
with check (
  app_private.member_role(organization_id) = 'owner'
  or (uploaded_by = app_private.my_member_id(organization_id)
      and status in ('draft', 'to_verify', 'error'))
);

-- Deleting is for the owner, and for the person clearing up an upload of their own that
-- never finished.
create policy receipts_delete on receipts for delete using (
  app_private.member_role(organization_id) = 'owner'
  or (uploaded_by = app_private.my_member_id(organization_id) and status = 'draft')
);

create policy receipt_items_read on receipt_items for select
  using (app_private.can_read_receipt(receipt_id));
create policy receipt_items_write on receipt_items for all
  using (app_private.can_write_receipt(receipt_id))
  with check (app_private.can_write_receipt(receipt_id));

create policy receipt_extraction_fields_read on receipt_extraction_fields for select
  using (app_private.can_read_receipt(receipt_id));
create policy receipt_extraction_fields_write on receipt_extraction_fields for all
  using (app_private.can_write_receipt(receipt_id))
  with check (app_private.can_write_receipt(receipt_id));

-- History is written, never rewritten. There is no update or delete policy on purpose.
create policy receipt_events_read on receipt_events for select
  using (app_private.can_read_receipt(receipt_id));
create policy receipt_events_insert on receipt_events for insert
  with check (app_private.is_member(organization_id));
