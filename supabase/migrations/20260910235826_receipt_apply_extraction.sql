-- Writing down what the reader found.
--
-- Safe to call twice. A receipt somebody has already looked at is left alone, and the
-- lines and the field notes are replaced by receipt rather than added to, so a retried
-- read cannot produce a receipt with every line listed in duplicate.

create or replace function public.apply_receipt_extraction(p_receipt uuid, p_payload jsonb)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_org uuid;
  v_member uuid;
  v_status receipt_status;
  v_item jsonb;
  v_field jsonb;
  v_line integer := 0;
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

  -- The idempotency rule, in one line.
  if v_status not in ('draft', 'error') then
    return jsonb_build_object('ok', true, 'skipped', true, 'status', v_status);
  end if;

  if p_payload ? 'error' then
    update receipts
       set status = 'error',
           extraction_error = left(p_payload ->> 'error', 500),
           extraction_provider = nullif(trim(p_payload ->> 'provider'), ''),
           processed_at = now(),
           updated_at = now()
     where id = p_receipt;

    insert into receipt_events (receipt_id, organization_id, action, actor_member_id, new_value)
    values (p_receipt, v_org, 'extraction_failed', v_member,
            jsonb_build_object('error', left(p_payload ->> 'error', 500),
                               'provider', p_payload ->> 'provider'));

    return jsonb_build_object('ok', true, 'status', 'error');
  end if;

  update receipts
     set merchant_name       = nullif(trim(p_payload ->> 'merchant_name'), ''),
         merchant_address    = nullif(trim(p_payload ->> 'merchant_address'), ''),
         tax_identifier      = nullif(trim(p_payload ->> 'tax_identifier'), ''),
         receipt_number      = nullif(trim(p_payload ->> 'receipt_number'), ''),
         purchase_date       = nullif(p_payload ->> 'purchase_date', '')::date,
         purchase_time       = nullif(p_payload ->> 'purchase_time', '')::time,
         currency            = coalesce(nullif(upper(trim(p_payload ->> 'currency')), ''), currency),
         subtotal            = nullif(p_payload ->> 'subtotal', '')::numeric,
         discount            = nullif(p_payload ->> 'discount', '')::numeric,
         tax_amount          = nullif(p_payload ->> 'tax_amount', '')::numeric,
         tip_amount          = nullif(p_payload ->> 'tip_amount', '')::numeric,
         total_amount        = nullif(p_payload ->> 'total_amount', '')::numeric,
         payment_method      = nullif(trim(p_payload ->> 'payment_method'), ''),
         card_last_four      = nullif(trim(p_payload ->> 'card_last_four'), ''),
         category            = coalesce(nullif(p_payload ->> 'category', '')::expense_category, category),
         qr_payload          = nullif(p_payload ->> 'qr_payload', ''),
         qr_kind             = nullif(trim(p_payload ->> 'qr_kind'), ''),
         verification_url    = nullif(trim(p_payload ->> 'verification_url'), ''),
         raw_ocr_text        = nullif(p_payload ->> 'raw_ocr_text', ''),
         extraction_provider = nullif(trim(p_payload ->> 'provider'), ''),
         extraction_confidence = nullif(p_payload ->> 'confidence', '')::numeric,
         extraction_error    = null,
         status              = 'to_verify',
         processed_at        = now(),
         updated_at          = now()
   where id = p_receipt;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'refused');
  end if;

  delete from receipt_items where receipt_id = p_receipt;
  if jsonb_typeof(p_payload -> 'items') = 'array' then
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

  delete from receipt_extraction_fields where receipt_id = p_receipt;
  if jsonb_typeof(p_payload -> 'fields') = 'array' then
    for v_field in select * from jsonb_array_elements(p_payload -> 'fields') loop
      insert into receipt_extraction_fields (receipt_id, organization_id, field_name,
                                             raw_value, normalized_value, confidence)
      values (p_receipt, v_org, left(v_field ->> 'field_name', 80),
              left(v_field ->> 'raw_value', 500),
              left(v_field ->> 'normalized_value', 500),
              nullif(v_field ->> 'confidence', '')::numeric)
      on conflict (receipt_id, field_name) do update
        set raw_value = excluded.raw_value,
            normalized_value = excluded.normalized_value,
            confidence = excluded.confidence,
            updated_at = now();
    end loop;
  end if;

  insert into receipt_events (receipt_id, organization_id, action, actor_member_id, new_value)
  values (p_receipt, v_org, 'extracted', v_member,
          jsonb_build_object('provider', p_payload ->> 'provider',
                             'confidence', p_payload ->> 'confidence',
                             'qr_kind', p_payload ->> 'qr_kind'));

  insert into audit_logs (organization_id, actor_member_id, action, entity, entity_id, detail)
  values (v_org, v_member, 'receipt.extracted', 'receipt', p_receipt,
          jsonb_build_object('provider', p_payload ->> 'provider'));

  return jsonb_build_object('ok', true, 'status', 'to_verify');
end $$;
