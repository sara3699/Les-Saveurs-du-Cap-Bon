-- What the review screen saves.
--
-- Verifying is the owner's alone. Asking for it without the role is answered plainly
-- rather than silently downgraded, so the interface can say why.

create or replace function public.save_receipt(p_receipt uuid, p_payload jsonb)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_org uuid;
  v_member uuid;
  v_status receipt_status;
  v_before jsonb;
  v_verify boolean := coalesce((p_payload ->> 'verify')::boolean, false);
  v_draft boolean := coalesce((p_payload ->> 'draft')::boolean, false);
  v_next receipt_status;
  v_item jsonb;
  v_line integer := 0;
  v_saved jsonb;
  v_key text;
  v_value text;
begin
  select r.organization_id, r.status, to_jsonb(r) - 'raw_ocr_text' - 'qr_payload'
    into v_org, v_status, v_before
    from receipts r where r.id = p_receipt;
  if v_org is null then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  v_member := app_private.my_member_id(v_org);
  if v_member is null then
    return jsonb_build_object('ok', false, 'error', 'not_a_member');
  end if;

  if v_verify and app_private.member_role(v_org) is distinct from 'owner' then
    return jsonb_build_object('ok', false, 'error', 'owner_only');
  end if;

  v_next := case
    when v_verify then 'verified'::receipt_status
    when v_draft then 'draft'::receipt_status
    when v_status = 'verified' then 'verified'::receipt_status
    else 'to_verify'::receipt_status
  end;

  update receipts
     set merchant_name    = nullif(trim(p_payload ->> 'merchant_name'), ''),
         merchant_address = nullif(trim(p_payload ->> 'merchant_address'), ''),
         tax_identifier   = nullif(trim(p_payload ->> 'tax_identifier'), ''),
         receipt_number   = nullif(trim(p_payload ->> 'receipt_number'), ''),
         purchase_date    = nullif(p_payload ->> 'purchase_date', '')::date,
         purchase_time    = nullif(p_payload ->> 'purchase_time', '')::time,
         currency         = coalesce(nullif(upper(trim(p_payload ->> 'currency')), ''), currency),
         subtotal         = nullif(p_payload ->> 'subtotal', '')::numeric,
         discount         = nullif(p_payload ->> 'discount', '')::numeric,
         tax_amount       = nullif(p_payload ->> 'tax_amount', '')::numeric,
         tip_amount       = nullif(p_payload ->> 'tip_amount', '')::numeric,
         total_amount     = nullif(p_payload ->> 'total_amount', '')::numeric,
         payment_method   = nullif(trim(p_payload ->> 'payment_method'), ''),
         card_last_four   = nullif(trim(p_payload ->> 'card_last_four'), ''),
         category         = coalesce(nullif(p_payload ->> 'category', '')::expense_category, category),
         note             = nullif(trim(p_payload ->> 'note'), ''),
         status           = v_next,
         verified_at      = case when v_verify then now() else verified_at end,
         verified_by      = case when v_verify then v_member else verified_by end,
         updated_at       = now()
   where id = p_receipt;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'refused');
  end if;

  if jsonb_typeof(p_payload -> 'items') = 'array' then
    delete from receipt_items where receipt_id = p_receipt;
    for v_item in select * from jsonb_array_elements(p_payload -> 'items') loop
      insert into receipt_items (receipt_id, organization_id, line_number, description,
                                 quantity, unit_price, tax_amount, total_amount,
                                 category, confidence)
      values (p_receipt, v_org, v_line,
              left(coalesce(nullif(trim(v_item ->> 'description'), ''), 'Article'), 300),
              greatest(coalesce((v_item ->> 'quantity')::numeric, 1), 0.001),
              greatest(coalesce((v_item ->> 'unit_price')::numeric, 0), 0),
              nullif(v_item ->> 'tax_amount', '')::numeric,
              greatest(coalesce((v_item ->> 'total_amount')::numeric, 0), 0),
              nullif(v_item ->> 'category', '')::expense_category,
              nullif(v_item ->> 'confidence', '')::numeric);
      v_line := v_line + 1;
    end loop;
  end if;

  -- A field a person has touched is marked, and stays marked, so the review screen can
  -- tell a number that was read from one that was typed.
  select jsonb_strip_nulls(jsonb_build_object(
    'merchant_name',  nullif(trim(p_payload ->> 'merchant_name'), ''),
    'tax_identifier', nullif(trim(p_payload ->> 'tax_identifier'), ''),
    'receipt_number', nullif(trim(p_payload ->> 'receipt_number'), ''),
    'purchase_date',  nullif(p_payload ->> 'purchase_date', ''),
    'purchase_time',  nullif(p_payload ->> 'purchase_time', ''),
    'currency',       nullif(upper(trim(p_payload ->> 'currency')), ''),
    'subtotal',       nullif(p_payload ->> 'subtotal', ''),
    'discount',       nullif(p_payload ->> 'discount', ''),
    'tax_amount',     nullif(p_payload ->> 'tax_amount', ''),
    'tip_amount',     nullif(p_payload ->> 'tip_amount', ''),
    'total_amount',   nullif(p_payload ->> 'total_amount', ''),
    'payment_method', nullif(trim(p_payload ->> 'payment_method'), ''),
    'card_last_four', nullif(trim(p_payload ->> 'card_last_four'), '')
  )) into v_saved;

  for v_key, v_value in select * from jsonb_each_text(v_saved) loop
    insert into receipt_extraction_fields (receipt_id, organization_id, field_name,
                                           normalized_value, manually_corrected)
    values (p_receipt, v_org, v_key, v_value, true)
    on conflict (receipt_id, field_name) do update
      set manually_corrected = receipt_extraction_fields.manually_corrected
            or receipt_extraction_fields.normalized_value is distinct from excluded.normalized_value,
          normalized_value = excluded.normalized_value,
          updated_at = now();
  end loop;

  insert into receipt_events (receipt_id, organization_id, action, actor_member_id,
                              previous_value, new_value)
  values (p_receipt, v_org, case when v_verify then 'verified' else 'corrected' end, v_member,
          jsonb_build_object('status', v_status,
                             'total_amount', v_before ->> 'total_amount',
                             'merchant_name', v_before ->> 'merchant_name'),
          jsonb_build_object('status', v_next,
                             'total_amount', p_payload ->> 'total_amount',
                             'merchant_name', p_payload ->> 'merchant_name'));

  insert into audit_logs (organization_id, actor_member_id, action, entity, entity_id, detail)
  values (v_org, v_member,
          case when v_verify then 'receipt.verified' else 'receipt.corrected' end,
          'receipt', p_receipt, jsonb_build_object('status', v_next));

  return jsonb_build_object('ok', true, 'status', v_next);
end $$;
