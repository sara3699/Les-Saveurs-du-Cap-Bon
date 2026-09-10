insert into organizations (id, name, city, currency, is_demo) values
  ('10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Les Saveurs du Cap Bon', 'Nabeul, Cap Bon', 'TND', true)
  on conflict (id) do update set name = excluded.name, city = excluded.city;
insert into store_profiles (organization_id, legal_name, display_name, tagline, address_lines,
  phone, email, website, vat_number, free_delivery_from, standard_delivery_fee, preparation_days) values
  ('10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Les Saveurs du Cap Bon SARL', 'Les Saveurs du Cap Bon', 'Épicerie fine, Cap Bon',
   array['Adresse pas encore renseignée','Nabeul, Cap Bon']::text[], '+216 00 000 000', 'contact@lesmillesaveursducapbon.com',
   'lesmillesaveursducapbon.com', 'Pas encore renseigné', 200,
   7.5, 1)
  on conflict (organization_id) do update set display_name = excluded.display_name;
insert into delivery_zones (id, organization_id, name, fee, days, cities) values
    ('8260c267-dfae-4151-af01-fcf3c36ee33c', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Grand Tunis', 7.5, '1 à 2 jours', 'Tunis, Ariana, Ben Arous, La Marsa')
    on conflict (id) do nothing;
insert into delivery_zones (id, organization_id, name, fee, days, cities) values
    ('f59189f2-5155-4f05-ac0a-49bf42893f01', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Nord', 8.5, '2 jours', 'Bizerte, Nabeul, Béja')
    on conflict (id) do nothing;
insert into delivery_zones (id, organization_id, name, fee, days, cities) values
    ('4690e79b-1616-4fea-a49f-38ff639af6df', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Sahel', 9, '2 à 3 jours', 'Sousse, Monastir, Mahdia')
    on conflict (id) do nothing;
insert into delivery_zones (id, organization_id, name, fee, days, cities) values
    ('196049b5-1a8a-425e-a8e7-75fe7d4ab492', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Sud', 12, '3 jours', 'Sfax, Gabès, Djerba')
    on conflict (id) do nothing;
insert into organization_members (id, organization_id, display_name, initials, role) values
    ('6947b8de-55d5-49f0-a182-472505b88156', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Sarra', 'S', 'owner')
    on conflict (id) do update set display_name = excluded.display_name, role = excluded.role;
insert into organization_members (id, organization_id, display_name, initials, role) values
    ('fe95ec4b-2089-4565-a693-3a9719f88497', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Khaled Mansouri', 'KM', 'manager')
    on conflict (id) do update set display_name = excluded.display_name, role = excluded.role;
insert into organization_members (id, organization_id, display_name, initials, role) values
    ('2c028ea8-c721-4823-a49e-26113bdfd9df', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Mouna Sassi', 'MS', 'agent')
    on conflict (id) do update set display_name = excluded.display_name, role = excluded.role;
insert into organization_members (id, organization_id, display_name, initials, role) values
    ('5fc54b41-2300-42f7-aa93-2158a9bbde84', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Yassine Belhaj', 'YB', 'agent')
    on conflict (id) do update set display_name = excluded.display_name, role = excluded.role;
insert into tags (id, organization_id, label) values
    ('5a061b13-b5ed-4381-ae30-c4af6205005d', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Client fidèle') on conflict (organization_id, label) do nothing;
insert into tags (id, organization_id, label) values
    ('14d177a8-7ea9-4dfa-abdc-7f5172fd0c0a', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Coffret cadeau') on conflict (organization_id, label) do nothing;
insert into tags (id, organization_id, label) values
    ('92888ffe-ed99-46e5-adfa-8ca7b1a02090', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Vente en gros') on conflict (organization_id, label) do nothing;
insert into tags (id, organization_id, label) values
    ('b341a7ad-7133-4a97-a455-7247f9aba669', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Question livraison') on conflict (organization_id, label) do nothing;
insert into tags (id, organization_id, label) values
    ('d2e05bed-ea20-4343-ad5a-458788bd5132', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Question prix') on conflict (organization_id, label) do nothing;
insert into tags (id, organization_id, label) values
    ('2e16612a-a456-4653-ad0d-aabd131ad490', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Réclamation') on conflict (organization_id, label) do nothing;
insert into tags (id, organization_id, label) values
    ('61f505bd-e915-469c-ad0f-c39fbaf90d01', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Gamme Ramadan') on conflict (organization_id, label) do nothing;
insert into tags (id, organization_id, label) values
    ('52eb0390-61ba-415c-abab-67149e724ab0', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Client prioritaire') on conflict (organization_id, label) do nothing;
insert into products (id, organization_id, name, sku, price, cost, stock, low_stock_at, units_sold) values
    ('7b5a067a-493e-4db0-ad8a-9574aba26e26', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Crème de pistache', 'LMS-PIS-01', 42, 22, 18,
     6, 52) on conflict (id) do update set stock = excluded.stock;
insert into products (id, organization_id, name, sku, price, cost, stock, low_stock_at, units_sold) values
    ('ab0c2140-cba2-4c92-a023-96ca7da23157', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Dessert à la pistache', 'LMS-PIS-02', 68, 34, 12,
     5, 41) on conflict (id) do update set stock = excluded.stock;
insert into products (id, organization_id, name, sku, price, cost, stock, low_stock_at, units_sold) values
    ('bd9a77b5-9ef6-4e63-a46f-503e0379964a', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Assortiment de desserts', 'LMS-DES-01', 78, 39, 9,
     5, 37) on conflict (id) do update set stock = excluded.stock;
insert into products (id, organization_id, name, sku, price, cost, stock, low_stock_at, units_sold) values
    ('66a1de72-f099-4865-a737-bf4f9b127b20', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Beurre artisanal', 'LMS-BTR-01', 26, 13, 21,
     6, 64) on conflict (id) do update set stock = excluded.stock;
insert into products (id, organization_id, name, sku, price, cost, stock, low_stock_at, units_sold) values
    ('fa60874f-bba4-436b-a8fd-d26ff4b385d7', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Sélection laitière', 'LMS-DAI-01', 54, 28, 7,
     8, 29) on conflict (id) do update set stock = excluded.stock;
insert into products (id, organization_id, name, sku, price, cost, stock, low_stock_at, units_sold) values
    ('6a736b41-e472-414c-a524-ca4171f19a97', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Coffret gourmand', 'LMS-GFT-01', 148, 76, 6,
     4, 18) on conflict (id) do update set stock = excluded.stock;
insert into products (id, organization_id, name, sku, price, cost, stock, low_stock_at, units_sold) values
    ('84c6b0fb-09e6-4b77-a18f-a553919e27e1', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Pot gourmand saisonnier', 'LMS-SWT-01', 36, 18, 15,
     5, 48) on conflict (id) do update set stock = excluded.stock;
insert into products (id, organization_id, name, sku, price, cost, stock, low_stock_at, units_sold) values
    ('0cb50ae7-10d1-4e73-a4e6-727c5f971228', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Assortiment découverte', 'LMS-SMP-01', 96, 49, 4,
     6, 26) on conflict (id) do update set stock = excluded.stock;
insert into products (id, organization_id, name, sku, price, cost, stock, low_stock_at, units_sold) values
    ('578eaa21-db9c-43c4-a375-0af64752b783', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Plateau de fête', 'LMS-PLT-01', 185, 96, 8,
     3, 14) on conflict (id) do update set stock = excluded.stock;
insert into channel_connections (id, organization_id, channel, account_label, status, summary,
    requires, permissions, outstanding, review_note, last_sync_at, last_event_at, last_error_at,
    last_error_message, events_this_week, setup_guide_href, planned) values
    ('e08bd046-cae7-4de7-ae2a-660a9f8c289f', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'website', 'Formulaire du site Les Saveurs', 'connected',
     'Les commandes passées sur votre site arrivent ici avec la page d''origine et la question éventuelle envoyée avec la commande.', 'Un formulaire sur un site que vous contrôlez', array['Publier vers l''adresse de réception Les Saveurs du Cap Bon']::text[], array[]::text[], null,
     '2026-09-10T06:40:24.840Z'::timestamptz, '2026-09-10T05:54:24.840Z'::timestamptz, null::timestamptz,
     null, 23, '/help#website-form', false)
    on conflict (id) do update set status = excluded.status;
insert into channel_connections (id, organization_id, channel, account_label, status, summary,
    requires, permissions, outstanding, review_note, last_sync_at, last_event_at, last_error_at,
    last_error_message, events_this_week, setup_guide_href, planned) values
    ('4bde547f-ab60-4e37-a263-79e4a6a0162b', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'whatsapp', 'WhatsApp Business Les Saveurs', 'connected',
     'Les commandes prises sur WhatsApp arrivent dans la liste avec le client, les produits et le compte WhatsApp d''origine.', 'Une entreprise vérifiée et un numéro qui n''utilise pas l''application WhatsApp', array['whatsapp_business_messaging','whatsapp_business_management']::text[], array[]::text[], 'Répondre dans les 24 heures ne demande rien de plus. Après 24 heures de silence, il faut un modèle de message approuvé par Meta.',
     '2026-09-10T06:44:24.840Z'::timestamptz, '2026-09-10T06:42:24.840Z'::timestamptz, null::timestamptz,
     null, 148, '/help#whatsapp', false)
    on conflict (id) do update set status = excluded.status;
insert into channel_connections (id, organization_id, channel, account_label, status, summary,
    requires, permissions, outstanding, review_note, last_sync_at, last_event_at, last_error_at,
    last_error_message, events_this_week, setup_guide_href, planned) values
    ('5d31d0c1-8211-49f5-a2ca-9e2220d50a05', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'instagram', '@lesmillesaveursducapbon', 'setup_required',
     'Les commandes qui commencent dans un message Instagram arrivent dans la liste avec la story ou la publication d''origine.', 'Un compte professionnel Instagram relié à une page Facebook administrée par vous', array['instagram_manage_messages','pages_manage_metadata']::text[], array['Accorder l''autorisation de messagerie à @lesmillesaveursducapbon','Confirmer la page Facebook liée']::text[], 'Seuls les comptes professionnels peuvent être connectés. Les boîtes personnelles Instagram ne sont disponibles pour aucun produit, y compris celui-ci.',
     '2026-08-30T06:46:24.840Z'::timestamptz, '2026-08-30T06:46:24.840Z'::timestamptz, null::timestamptz,
     null, 0, '/help#instagram', false)
    on conflict (id) do update set status = excluded.status;
insert into channel_connections (id, organization_id, channel, account_label, status, summary,
    requires, permissions, outstanding, review_note, last_sync_at, last_event_at, last_error_at,
    last_error_message, events_this_week, setup_guide_href, planned) values
    ('14647a93-fdf3-4608-ad72-89b124d48df3', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'facebook', 'Les Saveurs du Cap Bon, page Facebook', 'error',
     'Les commandes qui commencent sur votre page Facebook arrivent dans la liste avec la conversation jointe.', 'Une page Facebook administrée par vous', array['pages_messaging','pages_manage_metadata','pages_read_engagement']::text[], array['Reconnecter la page et accorder à nouveau l''autorisation de messagerie']::text[], null,
     '2026-09-03T06:46:24.840Z'::timestamptz, '2026-09-03T06:46:24.840Z'::timestamptz, '2026-09-10T03:46:24.840Z'::timestamptz,
     'L''autorisation de la page a été retirée. Depuis, les messages envoyés ne sont pas arrivés.', 0, '/help#facebook', false)
    on conflict (id) do update set status = excluded.status;
insert into channel_connections (id, organization_id, channel, account_label, status, summary,
    requires, permissions, outstanding, review_note, last_sync_at, last_event_at, last_error_at,
    last_error_message, events_this_week, setup_guide_href, planned) values
    ('1f6e185c-50d4-4bae-a38d-97beae377763', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'google', 'Google Ads Les Saveurs', 'warning',
     'Les commandes issues d''un formulaire Google Ads arrivent ici avec la campagne qui les a générées.', 'Un compte Google Ads avec au moins une extension de formulaire', array['adwords']::text[], array['Mettre à jour la clé webhook dans Google Ads']::text[], null,
     '2026-09-10T04:46:24.840Z'::timestamptz, '2026-09-10T03:46:24.840Z'::timestamptz, '2026-09-09T21:46:24.840Z'::timestamptz,
     'Deux notifications de prospects ont été refusées car la clé webhook ne correspondait pas.', 11, '/help#google-ads', false)
    on conflict (id) do update set status = excluded.status;
insert into channel_connections (id, organization_id, channel, account_label, status, summary,
    requires, permissions, outstanding, review_note, last_sync_at, last_event_at, last_error_at,
    last_error_message, events_this_week, setup_guide_href, planned) values
    ('c876d90f-79b1-4424-ab84-dd7e654e800b', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'google', 'Google Business Profile', 'not_connected',
     'Les commandes et les demandes qui arrivent par votre fiche Google Business. Tenue à part de Google Ads, pour qu''un avis ne soit jamais compté comme une commande.', 'Une fiche Google Business vérifiée', array['business.manage']::text[], array['Prévu pour une version ultérieure']::text[], null,
     null::timestamptz, null::timestamptz, null::timestamptz,
     null, 0, '/help#google-business', true)
    on conflict (id) do update set status = excluded.status;
insert into channel_connections (id, organization_id, channel, account_label, status, summary,
    requires, permissions, outstanding, review_note, last_sync_at, last_event_at, last_error_at,
    last_error_message, events_this_week, setup_guide_href, planned) values
    ('201c17ef-feda-457f-aed2-6de58eb6b612', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'google', 'Gmail', 'not_connected',
     'Transforme les commandes envoyées par e-mail à l''adresse de la boutique en vraies commandes. Un connecteur distinct de Google Ads et de votre fiche Business.', 'Un compte Google Workspace ou Gmail', array['gmail.readonly','gmail.send']::text[], array['Prévu pour une version ultérieure']::text[], null,
     null::timestamptz, null::timestamptz, null::timestamptz,
     null, 0, '/help#gmail', true)
    on conflict (id) do update set status = excluded.status;
insert into channel_connections (id, organization_id, channel, account_label, status, summary,
    requires, permissions, outstanding, review_note, last_sync_at, last_event_at, last_error_at,
    last_error_message, events_this_week, setup_guide_href, planned) values
    ('c64ea64f-426e-4e8c-a05c-4f33defea62e', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'manual', 'Saisi par votre équipe', 'connected',
     'Les commandes que vous prenez par téléphone ou au comptoir. Toujours disponible, et jamais confondu avec une plateforme utilisée par un client.', 'Rien', array[]::text[], array[]::text[], null,
     '2026-09-10T01:46:24.840Z'::timestamptz, '2026-09-10T01:46:24.840Z'::timestamptz, null::timestamptz,
     null, 6, '/help#manual', false)
    on conflict (id) do update set status = excluded.status;
insert into contacts (id, organization_id, name, phone, email, city, language,
    first_touch_channel, latest_touch_channel, first_contact_at, stage, lead_score,
    lead_score_reasons, lifetime_value, owner_member_id) values
    ('4cc6ebd7-a63b-4229-adac-09d68e4e343d', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Rania Trabelsi', '+216 20 114 882', 'rania.trabelsi@gmail.com', 'Ariana',
     'arabe', 'whatsapp', 'whatsapp', '2026-08-15T06:46:24.840Z'::timestamptz,
     'qualified', 78, array['Elle a déjà acheté deux fois, en juin et en août','Elle a répondu en moins d''une heure à ses trois derniers messages','Elle a demandé un produit précis au lieu de regarder au hasard']::text[], 560, '6947b8de-55d5-49f0-a182-472505b88156')
    on conflict (id) do update set stage = excluded.stage;
insert into contact_tags (contact_id, tag_id)
      select '4cc6ebd7-a63b-4229-adac-09d68e4e343d', t.id from tags t
      where t.organization_id = '10f2108b-0e88-46ba-a9bb-d53550b0fbdb' and t.label = 'Client fidèle'
      on conflict do nothing;
insert into contact_tags (contact_id, tag_id)
      select '4cc6ebd7-a63b-4229-adac-09d68e4e343d', t.id from tags t
      where t.organization_id = '10f2108b-0e88-46ba-a9bb-d53550b0fbdb' and t.label = 'Client prioritaire'
      on conflict do nothing;
insert into contact_tags (contact_id, tag_id)
      select '4cc6ebd7-a63b-4229-adac-09d68e4e343d', t.id from tags t
      where t.organization_id = '10f2108b-0e88-46ba-a9bb-d53550b0fbdb' and t.label = 'Coffret cadeau'
      on conflict do nothing;
insert into contact_notes (id, organization_id, contact_id, author_member_id, body, created_at) values
      ('aad3fee0-74f2-4887-abaf-05b65822df7a', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', '4cc6ebd7-a63b-4229-adac-09d68e4e343d', '6947b8de-55d5-49f0-a182-472505b88156', 'A acheté le pot saisonnier en juin et a aussi demandé le coffret de desserts. Cela vaut la peine de proposer un prix pour les deux.',
       '2026-09-10T06:15:24.840Z'::timestamptz) on conflict (id) do nothing;
insert into contacts (id, organization_id, name, phone, email, city, language,
    first_touch_channel, latest_touch_channel, first_contact_at, stage, lead_score,
    lead_score_reasons, lifetime_value, owner_member_id) values
    ('0035c2fa-b53e-472f-aeb1-ed828335dc42', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Slim Ayari', '+216 98 220 145', 'slim.ayari@outlook.com', 'Sousse',
     'français', 'website', 'website', '2026-09-10T05:46:24.840Z'::timestamptz,
     'contacted', 54, array['Premier message arrivé aujourd''hui','Il a donné une date de livraison à respecter']::text[], 0, '2c028ea8-c721-4823-a49e-26113bdfd9df')
    on conflict (id) do update set stage = excluded.stage;
insert into contact_tags (contact_id, tag_id)
      select '0035c2fa-b53e-472f-aeb1-ed828335dc42', t.id from tags t
      where t.organization_id = '10f2108b-0e88-46ba-a9bb-d53550b0fbdb' and t.label = 'Question livraison'
      on conflict do nothing;
insert into contacts (id, organization_id, name, phone, email, city, language,
    first_touch_channel, latest_touch_channel, first_contact_at, stage, lead_score,
    lead_score_reasons, lifetime_value, owner_member_id) values
    ('af888d1e-7b46-436b-a458-1c3e7c23e5f1', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Yosr Mahfoudh', '+216 55 901 337', 'yosr.mahfoudh@gmail.com', 'Tunis',
     'arabe', 'instagram', 'whatsapp', '2026-08-22T06:46:24.840Z'::timestamptz,
     'proposal', 66, array['Elle a trouvé la boutique sur Instagram puis est passée d''elle-même sur WhatsApp','Elle a une commande en cours de plus de 400 dinars']::text[], 412, 'fe95ec4b-2089-4565-a693-3a9719f88497')
    on conflict (id) do update set stage = excluded.stage;
insert into contact_tags (contact_id, tag_id)
      select 'af888d1e-7b46-436b-a458-1c3e7c23e5f1', t.id from tags t
      where t.organization_id = '10f2108b-0e88-46ba-a9bb-d53550b0fbdb' and t.label = 'Coffret cadeau'
      on conflict do nothing;
insert into contact_tags (contact_id, tag_id)
      select 'af888d1e-7b46-436b-a458-1c3e7c23e5f1', t.id from tags t
      where t.organization_id = '10f2108b-0e88-46ba-a9bb-d53550b0fbdb' and t.label = 'Client fidèle'
      on conflict do nothing;
insert into contact_notes (id, organization_id, contact_id, author_member_id, body, created_at) values
      ('82490672-f26a-4111-a546-6995f6ed804f', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'af888d1e-7b46-436b-a458-1c3e7c23e5f1', 'fe95ec4b-2089-4565-a693-3a9719f88497', 'Arrivée par Instagram au départ. Elle préfère les messages vocaux sur WhatsApp.',
       '2026-09-09T06:46:24.840Z'::timestamptz) on conflict (id) do nothing;
insert into contacts (id, organization_id, name, phone, email, city, language,
    first_touch_channel, latest_touch_channel, first_contact_at, stage, lead_score,
    lead_score_reasons, lifetime_value, owner_member_id) values
    ('94b0b22f-dc58-49f5-afae-b0864e77c779', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Amine Bouzid', '+216 74 310 220', 'a.bouzid@sfaxnet.tn', 'Sfax',
     'français', 'google', 'google', '2026-09-10T03:46:24.840Z'::timestamptz,
     'new', 41, array['Il vient d''une annonce payante, son intention reste à confirmer','Aucune réponse depuis l''envoi du formulaire']::text[], 0, null)
    on conflict (id) do update set stage = excluded.stage;
insert into contact_tags (contact_id, tag_id)
      select '94b0b22f-dc58-49f5-afae-b0864e77c779', t.id from tags t
      where t.organization_id = '10f2108b-0e88-46ba-a9bb-d53550b0fbdb' and t.label = 'Question prix'
      on conflict do nothing;
insert into contacts (id, organization_id, name, phone, email, city, language,
    first_touch_channel, latest_touch_channel, first_contact_at, stage, lead_score,
    lead_score_reasons, lifetime_value, owner_member_id) values
    ('884b1822-82a5-4d25-a134-1905c08479ef', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Nadia Chaabane', '+216 22 447 019', 'nadia.chaabane@gmail.com', 'La Marsa',
     'français', 'facebook', 'facebook', '2026-08-07T06:46:24.840Z'::timestamptz,
     'won', 82, array['Trois commandes terminées','Elle n''a jamais demandé de retour']::text[], 1180, '5fc54b41-2300-42f7-aa93-2158a9bbde84')
    on conflict (id) do update set stage = excluded.stage;
insert into contact_tags (contact_id, tag_id)
      select '884b1822-82a5-4d25-a134-1905c08479ef', t.id from tags t
      where t.organization_id = '10f2108b-0e88-46ba-a9bb-d53550b0fbdb' and t.label = 'Client fidèle'
      on conflict do nothing;
insert into contacts (id, organization_id, name, phone, email, city, language,
    first_touch_channel, latest_touch_channel, first_contact_at, stage, lead_score,
    lead_score_reasons, lifetime_value, owner_member_id) values
    ('f08ba763-0898-4f50-a326-9cc9774e1e56', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Ines Gharbi', '+216 71 882 004', null, 'Tunis',
     'arabe', 'manual', 'manual', '2026-07-31T06:46:24.840Z'::timestamptz,
     'won', 60, array['Elle commande par téléphone toutes les deux ou trois semaines','Plus grosse commande des données d''exemple']::text[], 2080, '6947b8de-55d5-49f0-a182-472505b88156')
    on conflict (id) do update set stage = excluded.stage;
insert into contact_tags (contact_id, tag_id)
      select 'f08ba763-0898-4f50-a326-9cc9774e1e56', t.id from tags t
      where t.organization_id = '10f2108b-0e88-46ba-a9bb-d53550b0fbdb' and t.label = 'Vente en gros'
      on conflict do nothing;
insert into contact_tags (contact_id, tag_id)
      select 'f08ba763-0898-4f50-a326-9cc9774e1e56', t.id from tags t
      where t.organization_id = '10f2108b-0e88-46ba-a9bb-d53550b0fbdb' and t.label = 'Client prioritaire'
      on conflict do nothing;
insert into contacts (id, organization_id, name, phone, email, city, language,
    first_touch_channel, latest_touch_channel, first_contact_at, stage, lead_score,
    lead_score_reasons, lifetime_value, owner_member_id) values
    ('5977483b-be71-4063-afc8-5bfd124f0d66', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Mehdi Karoui', '+216 92 663 118', 'mehdi.karoui@gmail.com', 'Bizerte',
     'français', 'website', 'instagram', '2026-08-19T06:46:24.840Z'::timestamptz,
     'qualified', 58, array['Il a demandé le prix pour douze pièces à la fois','Il est arrivé par le site et écrit maintenant sur Instagram']::text[], 148, 'fe95ec4b-2089-4565-a693-3a9719f88497')
    on conflict (id) do update set stage = excluded.stage;
insert into contact_tags (contact_id, tag_id)
      select '5977483b-be71-4063-afc8-5bfd124f0d66', t.id from tags t
      where t.organization_id = '10f2108b-0e88-46ba-a9bb-d53550b0fbdb' and t.label = 'Vente en gros'
      on conflict do nothing;
insert into contacts (id, organization_id, name, phone, email, city, language,
    first_touch_channel, latest_touch_channel, first_contact_at, stage, lead_score,
    lead_score_reasons, lifetime_value, owner_member_id) values
    ('fdf2492c-2e2a-4ba7-aa8b-ca084a90ae4d', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Olfa Ben Salah', '+216 98 221 100', null, 'Nabeul',
     'arabe', 'whatsapp', 'whatsapp', '2026-08-30T06:46:24.840Z'::timestamptz,
     'contacted', 47, array['Une commande, livrée','Elle demande le prix de la livraison avant chaque achat']::text[], 118, '2c028ea8-c721-4823-a49e-26113bdfd9df')
    on conflict (id) do update set stage = excluded.stage;
insert into contact_tags (contact_id, tag_id)
      select 'fdf2492c-2e2a-4ba7-aa8b-ca084a90ae4d', t.id from tags t
      where t.organization_id = '10f2108b-0e88-46ba-a9bb-d53550b0fbdb' and t.label = 'Question livraison'
      on conflict do nothing;
insert into contacts (id, organization_id, name, phone, email, city, language,
    first_touch_channel, latest_touch_channel, first_contact_at, stage, lead_score,
    lead_score_reasons, lifetime_value, owner_member_id) values
    ('c5c97a56-baf5-4df7-a622-0012622df342', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Hatem Zouari', null, null, 'Tunis',
     'arabe', 'instagram', 'instagram', '2026-09-08T06:46:24.840Z'::timestamptz,
     'new', 35, array['Pas encore de numéro de téléphone','Un message, aucune réponse de notre part']::text[], 0, null)
    on conflict (id) do update set stage = excluded.stage;
insert into contact_tags (contact_id, tag_id)
      select 'c5c97a56-baf5-4df7-a622-0012622df342', t.id from tags t
      where t.organization_id = '10f2108b-0e88-46ba-a9bb-d53550b0fbdb' and t.label = 'Question prix'
      on conflict do nothing;