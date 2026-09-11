-- A QR code the server found on the stored file.
--
-- Three columns and nothing else. apply_receipt_extraction writes eighteen columns and
-- forces a status, so calling that one just to record a code would wipe everything else
-- the receipt knew. This exists so a code found on a receipt whose reading then failed
-- is still kept: that is exactly the case the server-side scan is for.
--
-- It only ever fills an empty one. What the browser found at the counter is never
-- overwritten by what the server found afterwards.

create or replace function public.attach_receipt_qr(p_receipt uuid, p_payload jsonb)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_org uuid;
  v_member uuid;
  v_qr text := left(nullif(p_payload ->> 'qr_payload', ''), 4096);
  v_kind text := left(nullif(trim(p_payload ->> 'qr_kind'), ''), 40);
  v_url text := left(nullif(trim(p_payload ->> 'verification_url'), ''), 2000);
  v_changed integer;
begin
  if v_qr is null then
    return jsonb_build_object('ok', false, 'error', 'nothing_to_attach');
  end if;

  select r.organization_id into v_org from receipts r where r.id = p_receipt;
  if v_org is null then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  v_member := app_private.my_member_id(v_org);
  if v_member is null then
    return jsonb_build_object('ok', false, 'error', 'not_a_member');
  end if;

  with filled as (
    update receipts
       set qr_payload = v_qr,
           qr_kind = v_kind,
           verification_url = v_url,
           updated_at = now()
     where id = p_receipt
       and qr_payload is null
    returning 1
  )
  select count(*) into v_changed from filled;

  if v_changed = 0 then
    return jsonb_build_object('ok', true, 'skipped', true);
  end if;

  insert into receipt_events (receipt_id, organization_id, action, actor_member_id, new_value)
  values (p_receipt, v_org, 'qr_read_on_server', v_member,
          jsonb_build_object('qr_kind', v_kind));

  return jsonb_build_object('ok', true, 'qr_kind', v_kind);
end $$;
