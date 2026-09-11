-- Where the photographs live.
--
-- A private bucket, so there is no public address for any receipt and the only way to
-- see one is a link this application signs for a few minutes at a time. Which shop a
-- file belongs to is the first segment of its path, so tenant isolation is readable in
-- the object name itself and is not something a policy has to infer.
--
--   <organization-id>/<year>/<uuid>.<extension>
--
-- The names are generated here, never taken from the uploaded file, which is what stops
-- a filename walking out of its own folder.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'receipts', 'receipts', false, 15728640,
  array['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'application/pdf']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Returns the shop a path belongs to, or nothing at all when the first segment is not a
-- uuid. Returning nothing is what makes every policy below fail closed on a path that
-- has been tampered with.
create or replace function app_private.receipt_file_org(path text)
returns uuid
language plpgsql
immutable
set search_path = pg_temp
as $$
declare
  head text := split_part(path, '/', 1);
begin
  if head ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' then
    return head::uuid;
  end if;
  return null;
end $$;

create or replace function app_private.receipt_file_readable(path text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select case
    when app_private.receipt_file_org(path) is null then false
    else app_private.is_demo(app_private.receipt_file_org(path))
      or app_private.member_role(app_private.receipt_file_org(path)) = 'owner'
      or exists (
        select 1 from receipts r
         where r.file_path = path
           and r.uploaded_by = app_private.my_member_id(r.organization_id)
      )
  end;
$$;

grant execute on function app_private.receipt_file_org(text) to anon, authenticated;
grant execute on function app_private.receipt_file_readable(text) to anon, authenticated;

create policy "receipt files are read by the shop they belong to"
on storage.objects for select to anon, authenticated
using (bucket_id = 'receipts' and app_private.receipt_file_readable(name));

create policy "receipt files are written by members of that shop"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'receipts'
  and app_private.is_member(app_private.receipt_file_org(name))
);

create policy "receipt files are replaced only by the owner"
on storage.objects for update to authenticated
using (
  bucket_id = 'receipts'
  and app_private.member_role(app_private.receipt_file_org(name)) = 'owner'
)
with check (
  bucket_id = 'receipts'
  and app_private.member_role(app_private.receipt_file_org(name)) = 'owner'
);

-- Deleting covers two cases: the owner clearing out an archived receipt, and this
-- application removing a file whose upload never produced a usable receipt.
create policy "receipt files are removed by members of that shop"
on storage.objects for delete to authenticated
using (
  bucket_id = 'receipts'
  and app_private.is_member(app_private.receipt_file_org(name))
);
