-- Out of the totals but still on the shelf, and read it again.

create or replace function public.archive_receipt(p_receipt uuid)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_org uuid;
  v_member uuid;
  v_status receipt_status;
begin
  select r.organization_id, r.status into v_org, v_status
    from receipts r where r.id = p_receipt;
  if v_org is null then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  if app_private.member_role(v_org) is distinct from 'owner' then
    return jsonb_build_object('ok', false, 'error', 'owner_only');
  end if;
  v_member := app_private.my_member_id(v_org);

  update receipts set status = 'archived', archived_at = now(), updated_at = now()
   where id = p_receipt;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'refused');
  end if;

  insert into receipt_events (receipt_id, organization_id, action, actor_member_id,
                              previous_value, new_value)
  values (p_receipt, v_org, 'archived', v_member,
          jsonb_build_object('status', v_status), jsonb_build_object('status', 'archived'));

  insert into audit_logs (organization_id, actor_member_id, action, entity, entity_id, detail)
  values (v_org, v_member, 'receipt.archived', 'receipt', p_receipt, '{}'::jsonb);

  return jsonb_build_object('ok', true, 'status', 'archived');
end $$;

-- Putting the receipt back to draft is what makes the next call to
-- apply_receipt_extraction act instead of skipping.
create or replace function public.reprocess_receipt(p_receipt uuid)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_org uuid;
  v_member uuid;
  v_status receipt_status;
begin
  select r.organization_id, r.status into v_org, v_status
    from receipts r where r.id = p_receipt;
  if v_org is null then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  v_member := app_private.my_member_id(v_org);
  if v_member is null then
    return jsonb_build_object('ok', false, 'error', 'not_a_member');
  end if;

  -- A verified receipt is an accounting record. Re-reading one is the owner's call.
  if v_status = 'verified' and app_private.member_role(v_org) is distinct from 'owner' then
    return jsonb_build_object('ok', false, 'error', 'owner_only');
  end if;
  if v_status = 'archived' then
    return jsonb_build_object('ok', false, 'error', 'archived');
  end if;

  update receipts
     set status = 'draft', extraction_error = null, processed_at = null, updated_at = now()
   where id = p_receipt;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'refused');
  end if;

  insert into receipt_events (receipt_id, organization_id, action, actor_member_id,
                              previous_value, new_value)
  values (p_receipt, v_org, 'reprocess_requested', v_member,
          jsonb_build_object('status', v_status), jsonb_build_object('status', 'draft'));

  return jsonb_build_object('ok', true, 'status', 'draft');
end $$;
