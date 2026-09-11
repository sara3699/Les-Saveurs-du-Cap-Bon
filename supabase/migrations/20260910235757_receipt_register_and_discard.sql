-- Filing a new receipt, and clearing up one whose upload never finished.
--
-- SECURITY INVOKER, like create_manual_order, because the caller is a signed-in person
-- and row level security is exactly the rule that should decide what they may touch.
-- Local names are prefixed v_ so nothing here can be mistaken for a column.

create or replace function public.register_receipt(p_payload jsonb)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_org uuid;
  v_member uuid;
  v_hash text := nullif(trim(p_payload ->> 'file_hash'), '');
  v_path text := nullif(trim(p_payload ->> 'file_path'), '');
  v_mime text := nullif(trim(p_payload ->> 'file_mime'), '');
  v_size integer := coalesce((p_payload ->> 'file_size')::integer, 0);
  v_name text := left(coalesce(nullif(trim(p_payload ->> 'file_name'), ''), 'Reçu'), 200);
  v_source receipt_source_type :=
    coalesce(nullif(p_payload ->> 'source_type', '')::receipt_source_type, 'upload');
  v_existing uuid;
  v_recent integer;
  v_receipt uuid;
begin
  select m.organization_id, m.id into v_org, v_member
    from organization_members m
   where m.profile_id = auth.uid() and m.archived_at is null
   limit 1;

  if v_org is null then
    return jsonb_build_object('ok', false, 'error', 'not_a_member');
  end if;

  if v_hash is null or v_path is null or v_mime is null or v_size <= 0 then
    return jsonb_build_object('ok', false, 'error', 'file_required');
  end if;

  -- The file has to sit in this shop's own folder. Anything else is a path that has
  -- been rewritten on the way here.
  if app_private.receipt_file_org(v_path) is distinct from v_org then
    return jsonb_build_object('ok', false, 'error', 'path_refused');
  end if;

  -- Thirty receipts in a minute from one person is a loop, not a shopkeeper.
  select count(*) into v_recent from receipts r
   where r.organization_id = v_org
     and r.uploaded_by = v_member
     and r.created_at > now() - interval '1 minute';
  if v_recent >= 30 then
    return jsonb_build_object('ok', false, 'error', 'too_many_requests');
  end if;

  -- The same file twice is the same receipt. When the earlier one belongs to somebody
  -- else, this reader cannot see it, so the unique index is what catches it and the
  -- answer carries no id the caller is not allowed to know.
  select r.id into v_existing from receipts r
   where r.organization_id = v_org and r.file_hash = v_hash
   limit 1;
  if v_existing is not null then
    return jsonb_build_object('ok', false, 'error', 'duplicate_file', 'receipt_id', v_existing);
  end if;

  begin
    insert into receipts (organization_id, uploaded_by, source_type, status,
                          file_path, file_name, file_mime, file_size, file_hash)
    values (v_org, v_member, v_source, 'draft', v_path, v_name, v_mime, v_size, v_hash)
    returning id into v_receipt;
  exception when unique_violation then
    return jsonb_build_object('ok', false, 'error', 'duplicate_file');
  end;

  insert into receipt_events (receipt_id, organization_id, action, actor_member_id, new_value)
  values (v_receipt, v_org, 'uploaded', v_member,
          jsonb_build_object('file_name', v_name, 'file_mime', v_mime,
                             'file_size', v_size, 'source_type', v_source));

  insert into audit_logs (organization_id, actor_member_id, action, entity, entity_id, detail)
  values (v_org, v_member, 'receipt.uploaded', 'receipt', v_receipt,
          jsonb_build_object('file_mime', v_mime, 'file_size', v_size));

  return jsonb_build_object('ok', true, 'receipt_id', v_receipt, 'organization_id', v_org);
end $$;

create or replace function public.discard_receipt(p_receipt uuid)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_org uuid;
  v_path text;
  v_gone integer;
begin
  select r.organization_id, r.file_path into v_org, v_path
    from receipts r where r.id = p_receipt and r.status = 'draft';
  if v_org is null then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  with removed as (
    delete from receipts where id = p_receipt returning 1
  )
  select count(*) into v_gone from removed;

  if v_gone = 0 then
    return jsonb_build_object('ok', false, 'error', 'refused');
  end if;

  return jsonb_build_object('ok', true, 'file_path', v_path);
end $$;
