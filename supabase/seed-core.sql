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
insert into contacts (id, organization_id, name, phone, email, city, language,
    first_touch_channel, latest_touch_channel, first_contact_at, stage, lead_score,
    lead_score_reasons, lifetime_value, owner_member_id) values
    ('3fbfe502-a0e8-452d-a3e7-a96bdf938bce', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Leila Ferchichi', '+216 73 445 890', 'leila.ferchichi@gmail.com', 'Monastir',
     'français', 'google', 'website', '2026-09-01T06:46:24.840Z'::timestamptz,
     'proposal', 71, array['Elle est venue par une annonce puis est revenue d''elle-même par le site','Elle a demandé un devis pour huit coffrets cadeaux']::text[], 0, 'fe95ec4b-2089-4565-a693-3a9719f88497')
    on conflict (id) do update set stage = excluded.stage;
insert into contact_tags (contact_id, tag_id)
      select '3fbfe502-a0e8-452d-a3e7-a96bdf938bce', t.id from tags t
      where t.organization_id = '10f2108b-0e88-46ba-a9bb-d53550b0fbdb' and t.label = 'Coffret cadeau'
      on conflict do nothing;
insert into contact_tags (contact_id, tag_id)
      select '3fbfe502-a0e8-452d-a3e7-a96bdf938bce', t.id from tags t
      where t.organization_id = '10f2108b-0e88-46ba-a9bb-d53550b0fbdb' and t.label = 'Gamme Ramadan'
      on conflict do nothing;
insert into contacts (id, organization_id, name, phone, email, city, language,
    first_touch_channel, latest_touch_channel, first_contact_at, stage, lead_score,
    lead_score_reasons, lifetime_value, owner_member_id) values
    ('cc7a2d19-b2ff-4755-aebb-5abf187e6169', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Walid Jaziri', '+216 29 118 220', null, 'Ben Arous',
     'arabe', 'facebook', 'facebook', '2026-09-02T06:46:24.840Z'::timestamptz,
     'lost', 22, array['Il a dit que le prix dépassait son budget','Aucune réponse depuis huit jours']::text[], 0, '5fc54b41-2300-42f7-aa93-2158a9bbde84')
    on conflict (id) do update set stage = excluded.stage;
insert into contact_tags (contact_id, tag_id)
      select 'cc7a2d19-b2ff-4755-aebb-5abf187e6169', t.id from tags t
      where t.organization_id = '10f2108b-0e88-46ba-a9bb-d53550b0fbdb' and t.label = 'Question prix'
      on conflict do nothing;
insert into contacts (id, organization_id, name, phone, email, city, language,
    first_touch_channel, latest_touch_channel, first_contact_at, stage, lead_score,
    lead_score_reasons, lifetime_value, owner_member_id) values
    ('af466121-0f2c-4290-acb5-c6cfd9ed93d9', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Sonia Mejri', '+216 22 340 771', 'sonia.mejri@gmail.com', 'Ariana',
     'arabe', 'manual', 'whatsapp', '2026-07-24T06:46:24.840Z'::timestamptz,
     'contacted', 49, array['Elle a été ajoutée à la main après un appel','Deux commandes depuis, les deux sur WhatsApp']::text[], 336, '2c028ea8-c721-4823-a49e-26113bdfd9df')
    on conflict (id) do update set stage = excluded.stage;
insert into contact_tags (contact_id, tag_id)
      select 'af466121-0f2c-4290-acb5-c6cfd9ed93d9', t.id from tags t
      where t.organization_id = '10f2108b-0e88-46ba-a9bb-d53550b0fbdb' and t.label = 'Client fidèle'
      on conflict do nothing;
insert into contact_tags (contact_id, tag_id)
      select 'af466121-0f2c-4290-acb5-c6cfd9ed93d9', t.id from tags t
      where t.organization_id = '10f2108b-0e88-46ba-a9bb-d53550b0fbdb' and t.label = 'Gamme Ramadan'
      on conflict do nothing;
insert into contacts (id, organization_id, name, phone, email, city, language,
    first_touch_channel, latest_touch_channel, first_contact_at, stage, lead_score,
    lead_score_reasons, lifetime_value, owner_member_id) values
    ('82e3029b-b4bd-4ba3-a0f8-67a7bd9fad81', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Rania T.', '+216 20 114 882', null, 'Ariana',
     'arabe', 'manual', 'manual', '2026-09-07T06:46:24.840Z'::timestamptz,
     'new', 30, array['Ajoutée par un import de tableur le 6 septembre 2026','Aucune conversation sur cette fiche']::text[], 0, null)
    on conflict (id) do update set stage = excluded.stage;
insert into contacts (id, organization_id, name, phone, email, city, language,
    first_touch_channel, latest_touch_channel, first_contact_at, stage, lead_score,
    lead_score_reasons, lifetime_value, owner_member_id) values
    ('2e7e8000-31ae-48df-a41b-b925a4dfeffa', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'L. Ferchichi', null, 'leila.ferchichi@gmail.com', 'Monastir',
     'français', 'website', 'website', '2026-09-07T06:46:24.840Z'::timestamptz,
     'new', 28, array['Ajoutée par un import de tableur le 6 septembre 2026','Aucune conversation sur cette fiche']::text[], 0, null)
    on conflict (id) do update set stage = excluded.stage;
insert into contacts (id, organization_id, name, phone, email, city, language,
    first_touch_channel, latest_touch_channel, first_contact_at, stage, lead_score,
    lead_score_reasons, lifetime_value, owner_member_id) values
    ('a15f9120-3c0c-4b3d-a40f-2e885a1dd287', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Karim Belaid', '+216 24 900 116', 'karim.belaid@gmail.com', 'Tunis',
     'français', 'website', 'website', '2026-09-06T06:46:24.840Z'::timestamptz,
     'new', 44, array['Il a consulté la page du plateau de desserts avant d''écrire','Aucune réponse de notre part depuis quatre jours']::text[], 0, null)
    on conflict (id) do update set stage = excluded.stage;
insert into contact_tags (contact_id, tag_id)
      select 'a15f9120-3c0c-4b3d-a40f-2e885a1dd287', t.id from tags t
      where t.organization_id = '10f2108b-0e88-46ba-a9bb-d53550b0fbdb' and t.label = 'Question prix'
      on conflict do nothing;
insert into source_attributions (id, organization_id, channel, connection_id, external_id,
    received_at, campaign, referrer) values
    ('02117e7f-960f-4a90-aee8-affeb9f8ccd5', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'whatsapp', '4bde547f-ab60-4e37-a263-79e4a6a0162b', 'wamid.HBgLMjE2MjAxMTQ4ODIVAgAR',
     '2026-09-10T06:37:24.840Z'::timestamptz, null, null)
    on conflict (id) do nothing;
insert into source_attributions (id, organization_id, channel, connection_id, external_id,
    received_at, campaign, referrer) values
    ('4d9b1df1-ea80-4683-ae53-71cb0d282e3e', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'instagram', '5d31d0c1-8211-49f5-a2ca-9e2220d50a05', 'ig_msg_178394021',
     '2026-09-10T06:22:24.840Z'::timestamptz, null, 'Réponse à une story')
    on conflict (id) do nothing;
insert into source_attributions (id, organization_id, channel, connection_id, external_id,
    received_at, campaign, referrer) values
    ('53340fdf-8b30-41b8-a1fb-3e5b10391d23', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'website', 'e08bd046-cae7-4de7-ae2a-660a9f8c289f', 'form_7d31c0',
     '2026-09-10T05:46:24.840Z'::timestamptz, null, 'Page livraison Les Saveurs')
    on conflict (id) do nothing;
insert into source_attributions (id, organization_id, channel, connection_id, external_id,
    received_at, campaign, referrer) values
    ('4baa5f9c-0b62-49b0-a4d5-dddad2becfcd', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'google', '1f6e185c-50d4-4bae-a38d-97beae377763', 'gads_lead_88213',
     '2026-09-10T03:46:24.840Z'::timestamptz, 'Coffrets cadeaux, septembre', null)
    on conflict (id) do nothing;
insert into source_attributions (id, organization_id, channel, connection_id, external_id,
    received_at, campaign, referrer) values
    ('60307e84-93f9-47f4-afee-be979fb1c3a9', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'facebook', '14647a93-fdf3-4608-ad72-89b124d48df3', 'mid.$cAAB1x9k',
     '2026-09-09T06:46:24.840Z'::timestamptz, null, null)
    on conflict (id) do nothing;
insert into source_attributions (id, organization_id, channel, connection_id, external_id,
    received_at, campaign, referrer) values
    ('e3f39991-88f0-4fd1-a040-45d4b7a72489', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'whatsapp', '4bde547f-ab60-4e37-a263-79e4a6a0162b', 'wamid.HBgLMjE2OTgyMjExMD',
     '2026-09-10T01:46:24.840Z'::timestamptz, null, null)
    on conflict (id) do nothing;
insert into source_attributions (id, organization_id, channel, connection_id, external_id,
    received_at, campaign, referrer) values
    ('c91233f0-62ed-4c86-a2c9-1d386ca98c6f', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'website', 'e08bd046-cae7-4de7-ae2a-660a9f8c289f', 'form_9a02be',
     '2026-09-09T23:46:24.840Z'::timestamptz, null, 'Page vente en gros Les Saveurs')
    on conflict (id) do nothing;
insert into source_attributions (id, organization_id, channel, connection_id, external_id,
    received_at, campaign, referrer) values
    ('d884ef77-e82f-4582-a964-c16df867b0e9', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'manual', null, null,
     '2026-09-10T00:46:24.840Z'::timestamptz, null, 'Passage en boutique, Nabeul')
    on conflict (id) do nothing;
insert into source_attributions (id, organization_id, channel, connection_id, external_id,
    received_at, campaign, referrer) values
    ('c63b7ddd-999e-4abd-a5fd-3ff92247f1f8', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'instagram', '5d31d0c1-8211-49f5-a2ca-9e2220d50a05', 'ig_msg_178391884',
     '2026-09-08T06:46:24.840Z'::timestamptz, null, 'Commentaire sous une publication')
    on conflict (id) do nothing;
insert into source_attributions (id, organization_id, channel, connection_id, external_id,
    received_at, campaign, referrer) values
    ('c4b8b2fc-8e03-4a6f-a287-4ec810901f87', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'google', '1f6e185c-50d4-4bae-a38d-97beae377763', 'gads_lead_88104',
     '2026-09-08T06:46:24.840Z'::timestamptz, 'Marque, en continu', null)
    on conflict (id) do nothing;
insert into source_attributions (id, organization_id, channel, connection_id, external_id,
    received_at, campaign, referrer) values
    ('2249ee15-eee3-4bd0-a2b1-d89cbdee15ed', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'whatsapp', '4bde547f-ab60-4e37-a263-79e4a6a0162b', 'wamid.HBgLMjE2NTUxMjM0NT',
     '2026-09-07T06:46:24.840Z'::timestamptz, null, null)
    on conflict (id) do nothing;
insert into source_attributions (id, organization_id, channel, connection_id, external_id,
    received_at, campaign, referrer) values
    ('9ac4be28-ad36-4da8-a8f1-acc9f07ceddd', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'facebook', '14647a93-fdf3-4608-ad72-89b124d48df3', 'mid.$cAAB1w7Rz',
     '2026-09-02T06:46:24.840Z'::timestamptz, null, null)
    on conflict (id) do nothing;
insert into source_attributions (id, organization_id, channel, connection_id, external_id,
    received_at, campaign, referrer) values
    ('ffbadf62-2e80-4469-a3b6-708f095185dc', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'website', 'e08bd046-cae7-4de7-ae2a-660a9f8c289f', 'form_51ccd9',
     '2026-09-06T06:46:24.840Z'::timestamptz, null, 'Page plateau de fête Les Saveurs')
    on conflict (id) do nothing;
insert into source_attributions (id, organization_id, channel, connection_id, external_id,
    received_at, campaign, referrer) values
    ('bc3daae5-2540-44f5-a611-395a86709127', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'whatsapp', '4bde547f-ab60-4e37-a263-79e4a6a0162b', 'wamid.HBgLMjE2MjAxMTQ4ODJ2',
     '2026-09-05T06:46:24.840Z'::timestamptz, null, null)
    on conflict (id) do nothing;
insert into source_attributions (id, organization_id, channel, connection_id, external_id,
    received_at, campaign, referrer) values
    ('403fecfd-09ad-478d-a8d6-6a43a65e110c', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'instagram', '5d31d0c1-8211-49f5-a2ca-9e2220d50a05', 'ig_msg_178388120',
     '2026-08-29T06:46:24.840Z'::timestamptz, null, 'Réponse à une story')
    on conflict (id) do nothing;
insert into source_attributions (id, organization_id, channel, connection_id, external_id,
    received_at, campaign, referrer) values
    ('f2e02b79-066e-477e-aaa7-8dfe18167e32', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'whatsapp', '4bde547f-ab60-4e37-a263-79e4a6a0162b', 'wamid.HBgLMjE2OTQ0MTIzMT',
     '2026-09-04T06:46:24.840Z'::timestamptz, null, null)
    on conflict (id) do nothing;
insert into source_attributions (id, organization_id, channel, connection_id, external_id,
    received_at, campaign, referrer) values
    ('9b7a2b61-1cd5-492a-aff1-cb9266f64ab3', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'website', 'e08bd046-cae7-4de7-ae2a-660a9f8c289f', 'form_2bb47f',
     '2026-09-01T06:46:24.840Z'::timestamptz, null, 'Page contact Les Saveurs')
    on conflict (id) do nothing;
insert into source_attributions (id, organization_id, channel, connection_id, external_id,
    received_at, campaign, referrer) values
    ('cbed8fff-3858-4c36-a204-cbf9f400eec4', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'whatsapp', '4bde547f-ab60-4e37-a263-79e4a6a0162b', 'wamid.HBgLMjE2MjIzNDU2Nz',
     '2026-08-27T06:46:24.840Z'::timestamptz, null, null)
    on conflict (id) do nothing;
insert into source_attributions (id, organization_id, channel, connection_id, external_id,
    received_at, campaign, referrer) values
    ('e201880a-b31b-40ca-a14a-b12b4a90511c', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'manual', null, null,
     '2026-09-10T00:46:24.840Z'::timestamptz, null, 'Passage en boutique, Nabeul')
    on conflict (id) do nothing;
insert into source_attributions (id, organization_id, channel, connection_id, external_id,
    received_at, campaign, referrer) values
    ('5cfee89e-bc4f-4568-acba-66391fd48ee7', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'google', '1f6e185c-50d4-4bae-a38d-97beae377763', 'gads_order_44120',
     '2026-09-07T06:46:24.840Z'::timestamptz, 'Coffrets cadeaux, septembre', null)
    on conflict (id) do nothing;
insert into source_attributions (id, organization_id, channel, connection_id, external_id,
    received_at, campaign, referrer) values
    ('383d04fe-8cfc-4d4f-a5ea-a64595660454', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'facebook', '14647a93-fdf3-4608-ad72-89b124d48df3', 'mid.$cAAB1v2Qp',
     '2026-09-01T06:46:24.840Z'::timestamptz, null, null)
    on conflict (id) do nothing;
insert into source_attributions (id, organization_id, channel, connection_id, external_id,
    received_at, campaign, referrer) values
    ('69c5abea-4ba7-4376-a4e3-1fd28434e79e', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'website', 'e08bd046-cae7-4de7-ae2a-660a9f8c289f', 'form_ord_7781',
     '2026-09-08T06:46:24.840Z'::timestamptz, null, 'Page de paiement Les Saveurs')
    on conflict (id) do nothing;
insert into source_attributions (id, organization_id, channel, connection_id, external_id,
    received_at, campaign, referrer) values
    ('807fcae2-5d55-4813-a8b4-c6382e091621', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'whatsapp', '4bde547f-ab60-4e37-a263-79e4a6a0162b', 'wamid.ORD.9921',
     '2026-09-05T06:46:24.840Z'::timestamptz, null, null)
    on conflict (id) do nothing;
insert into source_attributions (id, organization_id, channel, connection_id, external_id,
    received_at, campaign, referrer) values
    ('38b258ff-061d-4409-a108-f5a7083ea559', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'instagram', '5d31d0c1-8211-49f5-a2ca-9e2220d50a05', 'ig_ord_55120',
     '2026-08-28T06:46:24.840Z'::timestamptz, null, 'Réponse à une story')
    on conflict (id) do nothing;
insert into source_attributions (id, organization_id, channel, connection_id, external_id,
    received_at, campaign, referrer) values
    ('51bcdc01-8da0-4aff-a503-ef80b68b44d9', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'whatsapp', '4bde547f-ab60-4e37-a263-79e4a6a0162b', 'wamid.ORD.9944',
     '2026-09-04T06:46:24.840Z'::timestamptz, null, null)
    on conflict (id) do nothing;
insert into source_attributions (id, organization_id, channel, connection_id, external_id,
    received_at, campaign, referrer) values
    ('dbef83a3-58e5-4bae-ad8f-88a66ff26b8b', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'whatsapp', '4bde547f-ab60-4e37-a263-79e4a6a0162b', 'wamid.ORD.9958',
     '2026-09-09T06:46:24.840Z'::timestamptz, null, null)
    on conflict (id) do nothing;
insert into source_attributions (id, organization_id, channel, connection_id, external_id,
    received_at, campaign, referrer) values
    ('1f71dd19-be8f-4170-aa84-ea20efdcd9c0', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'website', 'e08bd046-cae7-4de7-ae2a-660a9f8c289f', 'form_ord_7802',
     '2026-09-10T02:46:24.840Z'::timestamptz, null, 'Page de paiement Les Saveurs')
    on conflict (id) do nothing;
insert into source_attributions (id, organization_id, channel, connection_id, external_id,
    received_at, campaign, referrer) values
    ('1a00df27-3d63-4575-ac65-b5f311a5e35e', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'instagram', '5d31d0c1-8211-49f5-a2ca-9e2220d50a05', 'ig_ord_55208',
     '2026-09-06T06:46:24.840Z'::timestamptz, null, 'Commentaire sous une publication')
    on conflict (id) do nothing;
insert into source_attributions (id, organization_id, channel, connection_id, external_id,
    received_at, campaign, referrer) values
    ('329267f7-b3fb-40e1-ab14-0152dcf2056d', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'manual', null, null,
     '2026-08-26T06:46:24.840Z'::timestamptz, null, 'Commande par téléphone')
    on conflict (id) do nothing;
insert into source_attributions (id, organization_id, channel, connection_id, external_id,
    received_at, campaign, referrer) values
    ('445dd2fb-3e54-42ba-a070-35db7fa4517e', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'facebook', '14647a93-fdf3-4608-ad72-89b124d48df3', 'mid.$cAAB1v8Tz',
     '2026-08-20T06:46:24.840Z'::timestamptz, null, null)
    on conflict (id) do nothing;
insert into conversations (id, organization_id, contact_id, attribution_id, subject, status,
    priority, unread_count, assignee_member_id, last_message_at) values
    ('55b45e5c-1186-4d03-a6eb-1610710b6c84', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', '4cc6ebd7-a63b-4229-adac-09d68e4e343d', '02117e7f-960f-4a90-aee8-affeb9f8ccd5',
     'Crème de pistache en stock', 'open', true, 2, '6947b8de-55d5-49f0-a182-472505b88156',
     '2026-09-10T06:37:24.840Z'::timestamptz) on conflict (id) do update set status = excluded.status;
insert into conversations (id, organization_id, contact_id, attribution_id, subject, status,
    priority, unread_count, assignee_member_id, last_message_at) values
    ('0868a649-8890-4b39-a704-9f82aa6c7af8', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'af888d1e-7b46-436b-a458-1c3e7c23e5f1', '4d9b1df1-ea80-4683-ae53-71cb0d282e3e',
     'Photo du dessert à la pistache', 'waiting', false, 0, 'fe95ec4b-2089-4565-a693-3a9719f88497',
     '2026-09-10T06:22:24.840Z'::timestamptz) on conflict (id) do update set status = excluded.status;
insert into conversations (id, organization_id, contact_id, attribution_id, subject, status,
    priority, unread_count, assignee_member_id, last_message_at) values
    ('22890c28-628d-486e-a58d-c76e7162d21e', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', '0035c2fa-b53e-472f-aeb1-ed828335dc42', '53340fdf-8b30-41b8-a1fb-3e5b10391d23',
     'Livraison à Sousse avant vendredi', 'new', false, 1, '2c028ea8-c721-4823-a49e-26113bdfd9df',
     '2026-09-10T05:46:24.840Z'::timestamptz) on conflict (id) do update set status = excluded.status;
insert into conversations (id, organization_id, contact_id, attribution_id, subject, status,
    priority, unread_count, assignee_member_id, last_message_at) values
    ('d214e89d-afea-4cde-a058-cf261e3f64f8', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', '94b0b22f-dc58-49f5-afae-b0864e77c779', '4baa5f9c-0b62-49b0-a4d5-dddad2becfcd',
     'Prix du coffret cadeau', 'new', false, 1, null,
     '2026-09-10T03:46:24.840Z'::timestamptz) on conflict (id) do update set status = excluded.status;
insert into conversations (id, organization_id, contact_id, attribution_id, subject, status,
    priority, unread_count, assignee_member_id, last_message_at) values
    ('e90e45c5-1768-46de-abc0-98e7a35735a9', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', '884b1822-82a5-4d25-a134-1905c08479ef', '60307e84-93f9-47f4-afee-be979fb1c3a9',
     'Commande arrivée ce matin', 'resolved', false, 0, '5fc54b41-2300-42f7-aa93-2158a9bbde84',
     '2026-09-09T06:46:24.840Z'::timestamptz) on conflict (id) do update set status = excluded.status;
insert into conversations (id, organization_id, contact_id, attribution_id, subject, status,
    priority, unread_count, assignee_member_id, last_message_at) values
    ('e4021329-6a84-435a-ab1b-5d8d55f166d8', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'fdf2492c-2e2a-4ba7-aa8b-ca084a90ae4d', 'e3f39991-88f0-4fd1-a040-45d4b7a72489',
     'Prix de la livraison à Nabeul', 'open', false, 1, '2c028ea8-c721-4823-a49e-26113bdfd9df',
     '2026-09-10T01:46:24.840Z'::timestamptz) on conflict (id) do update set status = excluded.status;
insert into conversations (id, organization_id, contact_id, attribution_id, subject, status,
    priority, unread_count, assignee_member_id, last_message_at) values
    ('bf130e39-0453-4b33-af83-4289cd9d5560', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', '5977483b-be71-4063-afc8-5bfd124f0d66', 'c91233f0-62ed-4c86-a2c9-1d386ca98c6f',
     'Prix pour douze assortiments de desserts', 'open', false, 0, 'fe95ec4b-2089-4565-a693-3a9719f88497',
     '2026-09-09T23:46:24.840Z'::timestamptz) on conflict (id) do update set status = excluded.status;
insert into conversations (id, organization_id, contact_id, attribution_id, subject, status,
    priority, unread_count, assignee_member_id, last_message_at) values
    ('8f76cd47-8d1e-4328-aa06-db350d6d1b25', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'f08ba763-0898-4f50-a326-9cc9774e1e56', 'd884ef77-e82f-4582-a964-c16df867b0e9',
     'Commande habituelle prise en boutique', 'resolved', false, 0, '6947b8de-55d5-49f0-a182-472505b88156',
     '2026-09-10T00:46:24.840Z'::timestamptz) on conflict (id) do update set status = excluded.status;
insert into conversations (id, organization_id, contact_id, attribution_id, subject, status,
    priority, unread_count, assignee_member_id, last_message_at) values
    ('a7f4f513-1387-4eb8-ae46-de90070b8f1a', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'c5c97a56-baf5-4df7-a622-0012622df342', 'c63b7ddd-999e-4abd-a5fd-3ff92247f1f8',
     'Combien coûte l''assortiment de desserts', 'new', false, 1, null,
     '2026-09-08T06:46:24.840Z'::timestamptz) on conflict (id) do update set status = excluded.status;
insert into conversations (id, organization_id, contact_id, attribution_id, subject, status,
    priority, unread_count, assignee_member_id, last_message_at) values
    ('0254dc68-a2e4-4004-ae76-bfb6998ac5b6', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', '3fbfe502-a0e8-452d-a3e7-a96bdf938bce', 'c4b8b2fc-8e03-4a6f-a287-4ec810901f87',
     'Devis pour huit coffrets cadeaux', 'open', true, 0, 'fe95ec4b-2089-4565-a693-3a9719f88497',
     '2026-09-08T06:46:24.840Z'::timestamptz) on conflict (id) do update set status = excluded.status;
insert into conversations (id, organization_id, contact_id, attribution_id, subject, status,
    priority, unread_count, assignee_member_id, last_message_at) values
    ('0460b624-4623-41b6-aeb4-f83c17de7445', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'af466121-0f2c-4290-acb5-c6cfd9ed93d9', '2249ee15-eee3-4bd0-a2b1-d89cbdee15ed',
     'Assortiment de desserts de retour en stock', 'waiting', false, 0, '2c028ea8-c721-4823-a49e-26113bdfd9df',
     '2026-09-07T06:46:24.840Z'::timestamptz) on conflict (id) do update set status = excluded.status;
insert into conversations (id, organization_id, contact_id, attribution_id, subject, status,
    priority, unread_count, assignee_member_id, last_message_at) values
    ('5333aff9-ff5f-4f7f-a8ac-e4c7d2b1f57d', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'cc7a2d19-b2ff-4755-aebb-5abf187e6169', '9ac4be28-ad36-4da8-a8f1-acc9f07ceddd',
     'Dessert à la pistache, y a-t-il une remise', 'snoozed', false, 0, '5fc54b41-2300-42f7-aa93-2158a9bbde84',
     '2026-09-02T06:46:24.840Z'::timestamptz) on conflict (id) do update set status = excluded.status;
insert into conversations (id, organization_id, contact_id, attribution_id, subject, status,
    priority, unread_count, assignee_member_id, last_message_at) values
    ('2aad27c3-44fa-4dc9-af35-7b685b523bc4', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'a15f9120-3c0c-4b3d-a40f-2e885a1dd287', 'ffbadf62-2e80-4469-a3b6-708f095185dc',
     'Dimensions du plateau de desserts', 'new', false, 1, null,
     '2026-09-06T06:46:24.840Z'::timestamptz) on conflict (id) do update set status = excluded.status;
insert into conversations (id, organization_id, contact_id, attribution_id, subject, status,
    priority, unread_count, assignee_member_id, last_message_at) values
    ('81ff60e1-d18d-4410-a6ff-757762658abf', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', '4cc6ebd7-a63b-4229-adac-09d68e4e343d', 'bc3daae5-2540-44f5-a611-395a86709127',
     'Pot saisonnier livré', 'resolved', false, 0, '6947b8de-55d5-49f0-a182-472505b88156',
     '2026-09-05T06:46:24.840Z'::timestamptz) on conflict (id) do update set status = excluded.status;
insert into conversations (id, organization_id, contact_id, attribution_id, subject, status,
    priority, unread_count, assignee_member_id, last_message_at) values
    ('74d12b17-67cf-4a0e-a543-9969bbbec99e', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', '5977483b-be71-4063-afc8-5bfd124f0d66', '403fecfd-09ad-478d-a8d6-6a43a65e110c',
     'Les coffrets de desserts sont-ils faits main', 'resolved', false, 0, 'fe95ec4b-2089-4565-a693-3a9719f88497',
     '2026-08-29T06:46:24.840Z'::timestamptz) on conflict (id) do update set status = excluded.status;
insert into conversations (id, organization_id, contact_id, attribution_id, subject, status,
    priority, unread_count, assignee_member_id, last_message_at) values
    ('f7ca3a51-a087-4031-a0b0-86515f2b43ec', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'af888d1e-7b46-436b-a458-1c3e7c23e5f1', 'f2e02b79-066e-477e-aaa7-8dfe18167e32',
     'Changement d''adresse de livraison', 'resolved', false, 0, 'fe95ec4b-2089-4565-a693-3a9719f88497',
     '2026-09-04T06:46:24.840Z'::timestamptz) on conflict (id) do update set status = excluded.status;
insert into conversations (id, organization_id, contact_id, attribution_id, subject, status,
    priority, unread_count, assignee_member_id, last_message_at) values
    ('9ed43e2b-3b3b-46c3-a78a-2d7226afd060', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', '3fbfe502-a0e8-452d-a3e7-a96bdf938bce', '9b7a2b61-1cd5-492a-aff1-cb9266f64ab3',
     'Livrez-vous à Monastir', 'resolved', false, 0, '2c028ea8-c721-4823-a49e-26113bdfd9df',
     '2026-09-01T06:46:24.840Z'::timestamptz) on conflict (id) do update set status = excluded.status;
insert into conversations (id, organization_id, contact_id, attribution_id, subject, status,
    priority, unread_count, assignee_member_id, last_message_at) values
    ('c63cddfb-edf1-447a-acaa-e565e0cf19a6', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'af466121-0f2c-4290-acb5-c6cfd9ed93d9', 'cbed8fff-3858-4c36-a204-cbf9f400eec4',
     'Dates de la gamme Ramadan', 'resolved', false, 0, '2c028ea8-c721-4823-a49e-26113bdfd9df',
     '2026-08-27T06:46:24.840Z'::timestamptz) on conflict (id) do update set status = excluded.status;
insert into messages (id, organization_id, conversation_id, direction, body, sent_at,
    author_member_id, external_id) values
    ('07f11492-890b-4243-a13f-c2a2041954f7', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', '55b45e5c-1186-4d03-a6eb-1610710b6c84', 'inbound', 'Bonjour, est-ce que la crème de pistache est toujours disponible ?',
     '2026-09-10T06:08:24.840Z'::timestamptz, null, 'wamid.HBgLMjE2MjAxMTQ4ODIVAgAR')
    on conflict (id) do nothing;
insert into messages (id, organization_id, conversation_id, direction, body, sent_at,
    author_member_id, external_id) values
    ('b4689994-4c1c-4d19-aa48-3b06c8317fd2', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', '55b45e5c-1186-4d03-a6eb-1610710b6c84', 'inbound', 'J''en ai besoin avant samedi si possible.',
     '2026-09-10T06:09:24.840Z'::timestamptz, null, 'wamid.HBgLMjE2MjAxMTQ4ODIVAgAS')
    on conflict (id) do nothing;
insert into message_attachments (id, message_id, kind, filename, size_label) values
      ('e9dcb801-a548-4a8f-af29-ece344053299', 'b4689994-4c1c-4d19-aa48-3b06c8317fd2', 'image', 'pistachio-jar.jpg', '240 KB')
      on conflict (id) do nothing;
insert into messages (id, organization_id, conversation_id, direction, body, sent_at,
    author_member_id, external_id) values
    ('50f4d72e-8830-46e6-a364-8b9090c531fb', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', '55b45e5c-1186-4d03-a6eb-1610710b6c84', 'outbound', 'Bonjour Rania. Oui, la verte est en stock. La livraison à Ariana prend deux jours, samedi est donc possible.',
     '2026-09-10T06:13:24.840Z'::timestamptz, '6947b8de-55d5-49f0-a182-472505b88156', 'wamid.HBgLMjE2MjAxMTQ4ODIVAgAT')
    on conflict (id) do nothing;
insert into messages (id, organization_id, conversation_id, direction, body, sent_at,
    author_member_id, external_id) values
    ('1a7b2e6d-8960-4776-a840-fd9149adcb68', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', '55b45e5c-1186-4d03-a6eb-1610710b6c84', 'note', 'Elle a acheté le pot saisonnier en juin et a aussi demandé le coffret de desserts. Cela vaut la peine de proposer un prix pour les deux.',
     '2026-09-10T06:15:24.840Z'::timestamptz, '6947b8de-55d5-49f0-a182-472505b88156', null)
    on conflict (id) do nothing;
insert into messages (id, organization_id, conversation_id, direction, body, sent_at,
    author_member_id, external_id) values
    ('77d18de1-8bdc-4437-aa0c-27da701ea481', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', '55b45e5c-1186-4d03-a6eb-1610710b6c84', 'inbound', 'Parfait, pouvez-vous m''en garder un ?',
     '2026-09-10T06:37:24.840Z'::timestamptz, null, 'wamid.HBgLMjE2MjAxMTQ4ODIVAgAU')
    on conflict (id) do nothing;
insert into messages (id, organization_id, conversation_id, direction, body, sent_at,
    author_member_id, external_id) values
    ('37aeb3bc-dafe-4950-a541-79fa95bb4c65', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', '0868a649-8890-4b39-a704-9f82aa6c7af8', 'inbound', 'C''est le dessert à la pistache dont je parlais, celui de votre story.',
     '2026-09-10T03:46:24.840Z'::timestamptz, null, 'ig_msg_178394021')
    on conflict (id) do nothing;
insert into message_attachments (id, message_id, kind, filename, size_label) values
      ('c2da5dbd-a4d5-486b-acd7-0b67aac752fa', '37aeb3bc-dafe-4950-a541-79fa95bb4c65', 'image', 'story-screenshot.jpg', '612 KB')
      on conflict (id) do nothing;
insert into messages (id, organization_id, conversation_id, direction, body, sent_at,
    author_member_id, external_id) values
    ('ec621821-43a4-4dd2-a3d6-067d602d59d1', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', '0868a649-8890-4b39-a704-9f82aa6c7af8', 'outbound', 'C''est le dessert à la pistache, 68 TND dans le catalogue d''exemple. Je peux vous en mettre un de côté.',
     '2026-09-10T04:46:24.840Z'::timestamptz, 'fe95ec4b-2089-4565-a693-3a9719f88497', 'ig_msg_178394044')
    on conflict (id) do nothing;
insert into messages (id, organization_id, conversation_id, direction, body, sent_at,
    author_member_id, external_id) values
    ('c78bba84-abb8-4fc9-a476-7cc9860486fe', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', '0868a649-8890-4b39-a704-9f82aa6c7af8', 'inbound', 'Je vais y réfléchir ce soir.',
     '2026-09-10T06:22:24.840Z'::timestamptz, null, 'ig_msg_178394090')
    on conflict (id) do nothing;
insert into messages (id, organization_id, conversation_id, direction, body, sent_at,
    author_member_id, external_id) values
    ('78090d85-6e89-4a79-a312-54da58ad23de', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', '22890c28-628d-486e-a58d-c76e7162d21e', 'inbound', 'Bonjour, je voudrais commander deux assortiments de desserts. Livraison possible à Sousse avant vendredi ?',
     '2026-09-10T05:46:24.840Z'::timestamptz, null, 'form_7d31c0')
    on conflict (id) do nothing;
insert into messages (id, organization_id, conversation_id, direction, body, sent_at,
    author_member_id, external_id) values
    ('0bda37c3-e96c-4b12-a3cb-68b5956014bb', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'd214e89d-afea-4cde-a058-cf261e3f64f8', 'inbound', 'Combien coûte le coffret gourmand avec les desserts et le pot ?',
     '2026-09-10T03:46:24.840Z'::timestamptz, null, 'gads_lead_88213')
    on conflict (id) do nothing;
insert into messages (id, organization_id, conversation_id, direction, body, sent_at,
    author_member_id, external_id) values
    ('e70de350-379e-4283-ac00-84e4cf197fea', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'e90e45c5-1768-46de-abc0-98e7a35735a9', 'inbound', 'Bonjour, la commande est bien arrivée ce matin. Merci beaucoup.',
     '2026-09-09T06:46:24.840Z'::timestamptz, null, 'mid.$cAAB1x9k')
    on conflict (id) do nothing;
insert into messages (id, organization_id, conversation_id, direction, body, sent_at,
    author_member_id, external_id) values
    ('2e51d505-8ade-40dd-a066-8b5fb0a6d8f9', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'e90e45c5-1768-46de-abc0-98e7a35735a9', 'outbound', 'Merci Nadia, à bientôt.',
     '2026-09-09T06:46:24.840Z'::timestamptz, '5fc54b41-2300-42f7-aa93-2158a9bbde84', 'mid.$cAAB1x9m')
    on conflict (id) do nothing;
insert into messages (id, organization_id, conversation_id, direction, body, sent_at,
    author_member_id, external_id) values
    ('949e9d06-a0f1-4db9-ad91-a45a2a46fa37', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'e4021329-6a84-435a-ab1b-5d8d55f166d8', 'inbound', 'Combien la livraison à Nabeul ?',
     '2026-09-10T00:46:24.840Z'::timestamptz, null, 'wamid.HBgLMjE2OTgyMjExMD')
    on conflict (id) do nothing;
insert into messages (id, organization_id, conversation_id, direction, body, sent_at,
    author_member_id, external_id) values
    ('b71258aa-7ce4-4389-a837-36a3928d4b92', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'e4021329-6a84-435a-ab1b-5d8d55f166d8', 'outbound', '7,500 TND, et c''est gratuit au-delà de 200 TND.',
     '2026-09-10T00:46:24.840Z'::timestamptz, '2c028ea8-c721-4823-a49e-26113bdfd9df', 'wamid.HBgLMjE2OTgyMjExME')
    on conflict (id) do nothing;
insert into messages (id, organization_id, conversation_id, direction, body, sent_at,
    author_member_id, external_id) values
    ('a180ff7a-739c-49ed-aa98-e11de1d01240', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'e4021329-6a84-435a-ab1b-5d8d55f166d8', 'inbound', 'D''accord, je prépare ma liste.',
     '2026-09-10T01:46:24.840Z'::timestamptz, null, 'wamid.HBgLMjE2OTgyMjExMF')
    on conflict (id) do nothing;
insert into messages (id, organization_id, conversation_id, direction, body, sent_at,
    author_member_id, external_id) values
    ('05607d0e-52f6-45ae-ac2a-466fd817079c', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'bf130e39-0453-4b33-af83-4289cd9d5560', 'inbound', 'Je gère un petit hôtel à Bizerte. Quel est le prix pour douze assortiments de desserts ?',
     '2026-09-09T22:46:24.840Z'::timestamptz, null, 'form_9a02be')
    on conflict (id) do nothing;
insert into messages (id, organization_id, conversation_id, direction, body, sent_at,
    author_member_id, external_id) values
    ('1ce1e5d9-2b00-4b74-abb1-f023630525d9', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'bf130e39-0453-4b33-af83-4289cd9d5560', 'outbound', 'Pour douze, je peux faire 70 TND pièce dans le catalogue d''exemple au lieu de 78. Livraison comprise.',
     '2026-09-09T23:46:24.840Z'::timestamptz, 'fe95ec4b-2089-4565-a693-3a9719f88497', null)
    on conflict (id) do nothing;
insert into messages (id, organization_id, conversation_id, direction, body, sent_at,
    author_member_id, external_id) values
    ('066ed4e7-42b6-495e-a032-9290fe763fa0', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'bf130e39-0453-4b33-af83-4289cd9d5560', 'note', 'Il a d''abord écrit par le site, puis est passé sur Instagram en août. Même personne, même numéro.',
     '2026-09-09T23:46:24.840Z'::timestamptz, 'fe95ec4b-2089-4565-a693-3a9719f88497', null)
    on conflict (id) do nothing;
insert into messages (id, organization_id, conversation_id, direction, body, sent_at,
    author_member_id, external_id) values
    ('6599618c-7cb0-4e58-ae11-8a45847aa0c9', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', '8f76cd47-8d1e-4328-aa06-db350d6d1b25', 'note', 'Elle est passée à la boutique de Nabeul et a repris sa commande habituelle. Saisie à la main au comptoir.',
     '2026-09-10T00:46:24.840Z'::timestamptz, '6947b8de-55d5-49f0-a182-472505b88156', null)
    on conflict (id) do nothing;
insert into messages (id, organization_id, conversation_id, direction, body, sent_at,
    author_member_id, external_id) values
    ('42ffe100-6527-438f-a192-1aa4ea113b27', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', '8f76cd47-8d1e-4328-aa06-db350d6d1b25', 'outbound', 'Commande enregistrée, livraison jeudi.',
     '2026-09-10T00:46:24.840Z'::timestamptz, '6947b8de-55d5-49f0-a182-472505b88156', null)
    on conflict (id) do nothing;
insert into messages (id, organization_id, conversation_id, direction, body, sent_at,
    author_member_id, external_id) values
    ('fe1d61fd-167f-456c-a29d-a1a5938d7cd1', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'a7f4f513-1387-4eb8-ae46-de90070b8f1a', 'inbound', 'bech na3ref el prix mta3 assortiment el hlou?',
     '2026-09-08T06:46:24.840Z'::timestamptz, null, 'ig_msg_178391884')
    on conflict (id) do nothing;
insert into messages (id, organization_id, conversation_id, direction, body, sent_at,
    author_member_id, external_id) values
    ('5b3a27fc-e770-4bde-a366-c9bb20620ef3', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', '0254dc68-a2e4-4004-ae76-bfb6998ac5b6', 'inbound', 'Je cherche huit coffrets cadeaux pour mes clients. Vous faites un prix ?',
     '2026-09-08T06:46:24.840Z'::timestamptz, null, 'gads_lead_88104')
    on conflict (id) do nothing;
insert into messages (id, organization_id, conversation_id, direction, body, sent_at,
    author_member_id, external_id) values
    ('3ed88212-fdc0-4ebf-a0e4-91347a820af5', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', '0254dc68-a2e4-4004-ae76-bfb6998ac5b6', 'outbound', 'Oui. Pour huit coffrets, 940 TND l''unité au lieu de 1 040. Je vous envoie le devis aujourd''hui.',
     '2026-09-08T06:46:24.840Z'::timestamptz, 'fe95ec4b-2089-4565-a693-3a9719f88497', null)
    on conflict (id) do nothing;
insert into messages (id, organization_id, conversation_id, direction, body, sent_at,
    author_member_id, external_id) values
    ('15f726e4-d45f-4051-ace1-cc1b793593ea', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', '0254dc68-a2e4-4004-ae76-bfb6998ac5b6', 'note', 'Elle est arrivée par une annonce Google en août, puis est revenue d''elle-même par le site. Le premier contact reste Google.',
     '2026-09-08T06:46:24.840Z'::timestamptz, 'fe95ec4b-2089-4565-a693-3a9719f88497', null)
    on conflict (id) do nothing;
insert into messages (id, organization_id, conversation_id, direction, body, sent_at,
    author_member_id, external_id) values
    ('91ee60f3-e3f5-4f6b-ad0c-ac871b1551e9', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', '0460b624-4623-41b6-aeb4-f83c17de7445', 'outbound', 'Les assortiments de desserts sont de retour en stock, comme vous l''aviez demandé.',
     '2026-09-07T06:46:24.840Z'::timestamptz, '2c028ea8-c721-4823-a49e-26113bdfd9df', 'wamid.HBgLMjE2NTUxMjM0NT')
    on conflict (id) do nothing;
insert into messages (id, organization_id, conversation_id, direction, body, sent_at,
    author_member_id, external_id) values
    ('6553a756-2694-4eca-acf2-89ecf42ace6b', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', '0460b624-4623-41b6-aeb4-f83c17de7445', 'inbound', 'Très bien, je passe samedi.',
     '2026-09-07T06:46:24.840Z'::timestamptz, null, 'wamid.HBgLMjE2NTUxMjM0NU')
    on conflict (id) do nothing;
insert into messages (id, organization_id, conversation_id, direction, body, sent_at,
    author_member_id, external_id) values
    ('852fe3ac-5211-4f21-ab40-16bbeb7bd470', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', '5333aff9-ff5f-4f7f-a8ac-e4c7d2b1f57d', 'inbound', 'El dessert b 68 barcha. Famma discount?',
     '2026-09-02T06:46:24.840Z'::timestamptz, null, 'mid.$cAAB1w7Rz')
    on conflict (id) do nothing;
insert into messages (id, organization_id, conversation_id, direction, body, sent_at,
    author_member_id, external_id) values
    ('b25bc861-a1a9-448a-a020-ddd618df2b7b', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', '5333aff9-ff5f-4f7f-a8ac-e4c7d2b1f57d', 'outbound', 'Le prix du dessert à la pistache est fixe dans le catalogue d''exemple. Je peux offrir la livraison.',
     '2026-09-02T06:46:24.840Z'::timestamptz, '5fc54b41-2300-42f7-aa93-2158a9bbde84', 'mid.$cAAB1w7Sa')
    on conflict (id) do nothing;
insert into messages (id, organization_id, conversation_id, direction, body, sent_at,
    author_member_id, external_id) values
    ('cf616729-930d-4b8b-a1fe-8215163a6bab', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', '5333aff9-ff5f-4f7f-a8ac-e4c7d2b1f57d', 'note', 'Reporté d''une semaine. S''il ne répond pas, marquez le prospect comme perdu.',
     '2026-09-02T06:46:24.840Z'::timestamptz, '5fc54b41-2300-42f7-aa93-2158a9bbde84', null)
    on conflict (id) do nothing;
insert into messages (id, organization_id, conversation_id, direction, body, sent_at,
    author_member_id, external_id) values
    ('7495788e-ab11-4ccc-a581-6788077e1530', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', '2aad27c3-44fa-4dc9-af35-7b685b523bc4', 'inbound', 'Quelles sont les dimensions exactes du plateau de fête ?',
     '2026-09-06T06:46:24.840Z'::timestamptz, null, 'form_51ccd9')
    on conflict (id) do nothing;
insert into messages (id, organization_id, conversation_id, direction, body, sent_at,
    author_member_id, external_id) values
    ('72abff5c-a54f-467c-ad9c-f73c0c1396a1', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', '81ff60e1-d18d-4410-a6ff-757762658abf', 'inbound', 'Le pot saisonnier est bien arrivé, merci.',
     '2026-09-05T06:46:24.840Z'::timestamptz, null, 'wamid.HBgLMjE2MjAxMTQ4ODJ2')
    on conflict (id) do nothing;
insert into messages (id, organization_id, conversation_id, direction, body, sent_at,
    author_member_id, external_id) values
    ('185225f7-c171-4ba1-a2b2-16c3fd245036', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', '81ff60e1-d18d-4410-a6ff-757762658abf', 'outbound', 'Content qu''il soit arrivé en bon état, Rania.',
     '2026-09-05T06:46:24.840Z'::timestamptz, '6947b8de-55d5-49f0-a182-472505b88156', 'wamid.HBgLMjE2MjAxMTQ4ODJ3')
    on conflict (id) do nothing;
insert into messages (id, organization_id, conversation_id, direction, body, sent_at,
    author_member_id, external_id) values
    ('6c456bb3-e751-4e6a-a507-81a453539c9d', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', '74d12b17-67cf-4a0e-a543-9969bbbec99e', 'inbound', 'Les coffrets de desserts sont-ils préparés à la main ?',
     '2026-08-29T06:46:24.840Z'::timestamptz, null, 'ig_msg_178388120')
    on conflict (id) do nothing;
insert into messages (id, organization_id, conversation_id, direction, body, sent_at,
    author_member_id, external_id) values
    ('8dd6d0ee-aeac-4a6b-a9c4-3bfbc9d1c066', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', '74d12b17-67cf-4a0e-a543-9969bbbec99e', 'outbound', 'Ils sont préparés à la main. Deux coffrets de fête ne sont jamais exactement identiques.',
     '2026-08-29T06:46:24.840Z'::timestamptz, 'fe95ec4b-2089-4565-a693-3a9719f88497', 'ig_msg_178388133')
    on conflict (id) do nothing;
insert into messages (id, organization_id, conversation_id, direction, body, sent_at,
    author_member_id, external_id) values
    ('c570401e-6300-4247-ac45-7483287090c9', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'f7ca3a51-a087-4031-a0b0-86515f2b43ec', 'inbound', 'Pouvez-vous livrer à mon bureau plutôt ? Rue de Marseille, Tunis.',
     '2026-09-04T06:46:24.840Z'::timestamptz, null, 'wamid.HBgLMjE2OTQ0MTIzMT')
    on conflict (id) do nothing;
insert into messages (id, organization_id, conversation_id, direction, body, sent_at,
    author_member_id, external_id) values
    ('54233ac3-5c13-4cbe-a91a-fffc8a4fc54e', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'f7ca3a51-a087-4031-a0b0-86515f2b43ec', 'outbound', 'Adresse modifiée, le livreur a la nouvelle.',
     '2026-09-04T06:46:24.840Z'::timestamptz, 'fe95ec4b-2089-4565-a693-3a9719f88497', 'wamid.HBgLMjE2OTQ0MTIzMU')
    on conflict (id) do nothing;
insert into messages (id, organization_id, conversation_id, direction, body, sent_at,
    author_member_id, external_id) values
    ('91bd889d-3569-418a-aa55-4de6eedec652', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', '9ed43e2b-3b3b-46c3-a78a-2d7226afd060', 'inbound', 'Est-ce que vous livrez à Monastir ?',
     '2026-09-01T06:46:24.840Z'::timestamptz, null, 'form_2bb47f')
    on conflict (id) do nothing;
insert into messages (id, organization_id, conversation_id, direction, body, sent_at,
    author_member_id, external_id) values
    ('7c9a0f29-9299-4356-ac8f-5fcfe9a132f4', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', '9ed43e2b-3b3b-46c3-a78a-2d7226afd060', 'outbound', 'Oui, en deux a trois jours.',
     '2026-09-01T06:46:24.840Z'::timestamptz, '2c028ea8-c721-4823-a49e-26113bdfd9df', null)
    on conflict (id) do nothing;
insert into messages (id, organization_id, conversation_id, direction, body, sent_at,
    author_member_id, external_id) values
    ('172bb0e9-47e2-4e32-a6b8-03208d59218e', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'c63cddfb-edf1-447a-acaa-e565e0cf19a6', 'inbound', 'Wa9tech tokhrej el gamme mta3 Ramadan?',
     '2026-08-27T06:46:24.840Z'::timestamptz, null, 'wamid.HBgLMjE2MjIzNDU2Nz')
    on conflict (id) do nothing;
insert into messages (id, organization_id, conversation_id, direction, body, sent_at,
    author_member_id, external_id) values
    ('304d3065-5e75-43e5-a93b-93c1e332ba60', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'c63cddfb-edf1-447a-acaa-e565e0cf19a6', 'outbound', 'Deux semaines avant le Ramadan, comme chaque année.',
     '2026-08-27T06:46:24.840Z'::timestamptz, '2c028ea8-c721-4823-a49e-26113bdfd9df', 'wamid.HBgLMjE2MjIzNDU2Ng')
    on conflict (id) do nothing;
insert into messages (id, organization_id, conversation_id, direction, body, sent_at,
    author_member_id, external_id) values
    ('49243f80-1450-45aa-a055-f8d8c693009f', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'c63cddfb-edf1-447a-acaa-e565e0cf19a6', 'inbound', 'Parfait, tenez-moi au courant.',
     '2026-08-27T06:46:24.840Z'::timestamptz, null, 'wamid.HBgLMjE2MjIzNDU2Nx')
    on conflict (id) do nothing;
insert into orders (id, organization_id, reference, contact_id, attribution_id, conversation_id,
    placed_at, payment_status, delivery_status, assignee_member_id, delivery_fee, total) values
    ('e1ccf6a3-9c0d-4ccf-af1b-3aa5f1bcb6c2', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'ORD-2481', 'f08ba763-0898-4f50-a326-9cc9774e1e56',
     'e201880a-b31b-40ca-a14a-b12b4a90511c', '8f76cd47-8d1e-4328-aa06-db350d6d1b25', '2026-09-10T00:46:24.840Z'::timestamptz, 'paid',
     'preparing', '6947b8de-55d5-49f0-a182-472505b88156', 0, 296)
    on conflict (id) do update set payment_status = excluded.payment_status;
insert into order_items (id, order_id, product_id, name, quantity, unit_price) values
      ('bb3b495a-9013-4a12-a765-cbfa3d4bea17', 'e1ccf6a3-9c0d-4ccf-af1b-3aa5f1bcb6c2', '6a736b41-e472-414c-a524-ca4171f19a97',
       'Coffret gourmand', 2, 148) on conflict (id) do nothing;
insert into orders (id, organization_id, reference, contact_id, attribution_id, conversation_id,
    placed_at, payment_status, delivery_status, assignee_member_id, delivery_fee, total) values
    ('90829c7e-a2a5-42f8-adba-73256805838a', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'ORD-2480', '94b0b22f-dc58-49f5-afae-b0864e77c779',
     '5cfee89e-bc4f-4568-acba-66391fd48ee7', null, '2026-09-07T06:46:24.840Z'::timestamptz, 'refused',
     'cancelled', '5fc54b41-2300-42f7-aa93-2158a9bbde84', 7.5, 192.5)
    on conflict (id) do update set payment_status = excluded.payment_status;
insert into order_items (id, order_id, product_id, name, quantity, unit_price) values
      ('9a8017e0-97f8-401e-ac90-9d830b3e4873', '90829c7e-a2a5-42f8-adba-73256805838a', '578eaa21-db9c-43c4-a375-0af64752b783',
       'Plateau de fête', 1, 185) on conflict (id) do nothing;
insert into orders (id, organization_id, reference, contact_id, attribution_id, conversation_id,
    placed_at, payment_status, delivery_status, assignee_member_id, delivery_fee, total) values
    ('a8f3abd7-6ca2-4773-a5c2-5bf5392299cb', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'ORD-2472', '884b1822-82a5-4d25-a134-1905c08479ef',
     '383d04fe-8cfc-4d4f-a5ea-a64595660454', null, '2026-09-01T06:46:24.840Z'::timestamptz, 'paid',
     'delivered', '5fc54b41-2300-42f7-aa93-2158a9bbde84', 0, 260)
    on conflict (id) do update set payment_status = excluded.payment_status;
insert into order_items (id, order_id, product_id, name, quantity, unit_price) values
      ('fa769f58-1a2c-4956-a5c6-817548ecaba1', 'a8f3abd7-6ca2-4773-a5c2-5bf5392299cb', 'bd9a77b5-9ef6-4e63-a46f-503e0379964a',
       'Assortiment de desserts', 3, 78) on conflict (id) do nothing;
insert into order_items (id, order_id, product_id, name, quantity, unit_price) values
      ('1b183c96-8dd4-48b3-a09a-5e92224f5df6', 'a8f3abd7-6ca2-4773-a5c2-5bf5392299cb', '66a1de72-f099-4865-a737-bf4f9b127b20',
       'Beurre artisanal', 1, 26) on conflict (id) do nothing;
insert into orders (id, organization_id, reference, contact_id, attribution_id, conversation_id,
    placed_at, payment_status, delivery_status, assignee_member_id, delivery_fee, total) values
    ('de7e1cea-a189-417b-a76f-a5a8788e2ce5', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'ORD-2479', 'a15f9120-3c0c-4b3d-a40f-2e885a1dd287',
     '69c5abea-4ba7-4376-a4e3-1fd28434e79e', null, '2026-09-08T06:46:24.840Z'::timestamptz, 'cash_on_delivery',
     'dispatched', '2c028ea8-c721-4823-a49e-26113bdfd9df', 0, 54)
    on conflict (id) do update set payment_status = excluded.payment_status;
insert into order_items (id, order_id, product_id, name, quantity, unit_price) values
      ('868218e4-764e-4f4b-a548-7498f0b29fd5', 'de7e1cea-a189-417b-a76f-a5a8788e2ce5', 'fa60874f-bba4-436b-a8fd-d26ff4b385d7',
       'Sélection laitière', 1, 54) on conflict (id) do nothing;
insert into orders (id, organization_id, reference, contact_id, attribution_id, conversation_id,
    placed_at, payment_status, delivery_status, assignee_member_id, delivery_fee, total) values
    ('f5e43df2-3912-4f3f-ac54-c6e535812081', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'ORD-2474', '4cc6ebd7-a63b-4229-adac-09d68e4e343d',
     '807fcae2-5d55-4813-a8b4-c6382e091621', '81ff60e1-d18d-4410-a6ff-757762658abf', '2026-09-05T06:46:24.840Z'::timestamptz, 'paid',
     'delivered', '6947b8de-55d5-49f0-a182-472505b88156', 7.5, 43.5)
    on conflict (id) do update set payment_status = excluded.payment_status;
insert into order_items (id, order_id, product_id, name, quantity, unit_price) values
      ('d2fabea6-20e6-4a11-a326-d1a3eb47f06a', 'f5e43df2-3912-4f3f-ac54-c6e535812081', '84c6b0fb-09e6-4b77-a18f-a553919e27e1',
       'Pot gourmand saisonnier', 1, 36) on conflict (id) do nothing;
insert into orders (id, organization_id, reference, contact_id, attribution_id, conversation_id,
    placed_at, payment_status, delivery_status, assignee_member_id, delivery_fee, total) values
    ('2c7a85d6-e4cf-4d76-a958-370658a33b9a', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'ORD-2455', '5977483b-be71-4063-afc8-5bfd124f0d66',
     '38b258ff-061d-4409-a108-f5a7083ea559', '74d12b17-67cf-4a0e-a543-9969bbbec99e', '2026-08-28T06:46:24.840Z'::timestamptz, 'paid',
     'delivered', 'fe95ec4b-2089-4565-a693-3a9719f88497', 7.5, 171.5)
    on conflict (id) do update set payment_status = excluded.payment_status;
insert into order_items (id, order_id, product_id, name, quantity, unit_price) values
      ('8ee951ff-3e05-4114-a8d3-bfe78ac26670', '2c7a85d6-e4cf-4d76-a958-370658a33b9a', 'ab0c2140-cba2-4c92-a023-96ca7da23157',
       'Dessert à la pistache', 1, 68) on conflict (id) do nothing;
insert into order_items (id, order_id, product_id, name, quantity, unit_price) values
      ('a563f063-b69f-4754-a0d9-6dae00fc1818', '2c7a85d6-e4cf-4d76-a958-370658a33b9a', '0cb50ae7-10d1-4e73-a4e6-727c5f971228',
       'Assortiment découverte', 1, 96) on conflict (id) do nothing;
insert into orders (id, organization_id, reference, contact_id, attribution_id, conversation_id,
    placed_at, payment_status, delivery_status, assignee_member_id, delivery_fee, total) values
    ('06f82c8e-6e54-4a7a-a47b-c717efba323b', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'ORD-2473', 'af888d1e-7b46-436b-a458-1c3e7c23e5f1',
     '51bcdc01-8da0-4aff-a503-ef80b68b44d9', 'f7ca3a51-a087-4031-a0b0-86515f2b43ec', '2026-09-04T06:46:24.840Z'::timestamptz, 'paid',
     'delivered', 'fe95ec4b-2089-4565-a693-3a9719f88497', 0, 54)
    on conflict (id) do update set payment_status = excluded.payment_status;
insert into order_items (id, order_id, product_id, name, quantity, unit_price) values
      ('5bc92bb9-a978-4826-a3f5-7518379ecdd3', '06f82c8e-6e54-4a7a-a47b-c717efba323b', 'fa60874f-bba4-436b-a8fd-d26ff4b385d7',
       'Sélection laitière', 1, 54) on conflict (id) do nothing;
insert into orders (id, organization_id, reference, contact_id, attribution_id, conversation_id,
    placed_at, payment_status, delivery_status, assignee_member_id, delivery_fee, total) values
    ('e5807ef8-a1b1-4137-ad73-017ca6cc7d92', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'ORD-2482', 'af466121-0f2c-4290-acb5-c6cfd9ed93d9',
     'dbef83a3-58e5-4bae-ad8f-88a66ff26b8b', '0460b624-4623-41b6-aeb4-f83c17de7445', '2026-09-09T06:46:24.840Z'::timestamptz, 'cash_on_delivery',
     'dispatched', '2c028ea8-c721-4823-a49e-26113bdfd9df', 7.5, 163.5)
    on conflict (id) do update set payment_status = excluded.payment_status;
insert into order_items (id, order_id, product_id, name, quantity, unit_price) values
      ('f3bb2cb8-53af-426e-adbc-597fd4e4fcf6', 'e5807ef8-a1b1-4137-ad73-017ca6cc7d92', 'bd9a77b5-9ef6-4e63-a46f-503e0379964a',
       'Assortiment de desserts', 2, 78) on conflict (id) do nothing;
insert into orders (id, organization_id, reference, contact_id, attribution_id, conversation_id,
    placed_at, payment_status, delivery_status, assignee_member_id, delivery_fee, total) values
    ('df92db64-1b32-4a7b-a3c2-74e526835b0a', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'ORD-2483', 'fdf2492c-2e2a-4ba7-aa8b-ca084a90ae4d',
     '1f71dd19-be8f-4170-aa84-ea20efdcd9c0', null, '2026-09-10T02:46:24.840Z'::timestamptz, 'pending',
     'preparing', null, 7.5, 69.5)
    on conflict (id) do update set payment_status = excluded.payment_status;
insert into order_items (id, order_id, product_id, name, quantity, unit_price) values
      ('0f6da89d-f5bb-41e2-a965-490108e84d43', 'df92db64-1b32-4a7b-a3c2-74e526835b0a', '66a1de72-f099-4865-a737-bf4f9b127b20',
       'Beurre artisanal', 1, 26) on conflict (id) do nothing;
insert into order_items (id, order_id, product_id, name, quantity, unit_price) values
      ('21dfa251-6727-4bfb-a35c-2537f8a21f8a', 'df92db64-1b32-4a7b-a3c2-74e526835b0a', '84c6b0fb-09e6-4b77-a18f-a553919e27e1',
       'Pot gourmand saisonnier', 1, 36) on conflict (id) do nothing;
insert into orders (id, organization_id, reference, contact_id, attribution_id, conversation_id,
    placed_at, payment_status, delivery_status, assignee_member_id, delivery_fee, total) values
    ('5019da81-0270-4b85-a711-88a516a2b747', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'ORD-2477', 'af888d1e-7b46-436b-a458-1c3e7c23e5f1',
     '1a00df27-3d63-4575-ac65-b5f311a5e35e', null, '2026-09-06T06:46:24.840Z'::timestamptz, 'refunded',
     'returned', 'fe95ec4b-2089-4565-a693-3a9719f88497', 7.5, 192.5)
    on conflict (id) do update set payment_status = excluded.payment_status;
insert into order_items (id, order_id, product_id, name, quantity, unit_price) values
      ('991e4560-67ff-4a99-a935-ad2f2e9dff87', '5019da81-0270-4b85-a711-88a516a2b747', '578eaa21-db9c-43c4-a375-0af64752b783',
       'Plateau de fête', 1, 185) on conflict (id) do nothing;
insert into orders (id, organization_id, reference, contact_id, attribution_id, conversation_id,
    placed_at, payment_status, delivery_status, assignee_member_id, delivery_fee, total) values
    ('39935a1d-08ca-4dd5-a176-7fcdaf73f1ca', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'ORD-2449', 'f08ba763-0898-4f50-a326-9cc9774e1e56',
     '329267f7-b3fb-40e1-ab14-0152dcf2056d', null, '2026-08-26T06:46:24.840Z'::timestamptz, 'paid',
     'delivered', '6947b8de-55d5-49f0-a182-472505b88156', 0, 252)
    on conflict (id) do update set payment_status = excluded.payment_status;
insert into order_items (id, order_id, product_id, name, quantity, unit_price) values
      ('46455f3a-59e0-448b-ad43-33532e07ae27', '39935a1d-08ca-4dd5-a176-7fcdaf73f1ca', '6a736b41-e472-414c-a524-ca4171f19a97',
       'Coffret gourmand', 1, 148) on conflict (id) do nothing;
insert into order_items (id, order_id, product_id, name, quantity, unit_price) values
      ('61af9b96-c970-4df8-a934-967f24902bc2', '39935a1d-08ca-4dd5-a176-7fcdaf73f1ca', '66a1de72-f099-4865-a737-bf4f9b127b20',
       'Beurre artisanal', 4, 26) on conflict (id) do nothing;
insert into orders (id, organization_id, reference, contact_id, attribution_id, conversation_id,
    placed_at, payment_status, delivery_status, assignee_member_id, delivery_fee, total) values
    ('aa4f4508-1f22-4b9f-a874-7c57782aaaa8', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'ORD-2431', '884b1822-82a5-4d25-a134-1905c08479ef',
     '445dd2fb-3e54-42ba-a070-35db7fa4517e', null, '2026-08-20T06:46:24.840Z'::timestamptz, 'paid',
     'delivered', '5fc54b41-2300-42f7-aa93-2158a9bbde84', 7.5, 199.5)
    on conflict (id) do update set payment_status = excluded.payment_status;
insert into order_items (id, order_id, product_id, name, quantity, unit_price) values
      ('5802814a-0d53-4ebf-a013-615d9b212761', 'aa4f4508-1f22-4b9f-a874-7c57782aaaa8', '0cb50ae7-10d1-4e73-a4e6-727c5f971228',
       'Assortiment découverte', 2, 96) on conflict (id) do nothing;
insert into tasks (id, organization_id, title, type, contact_id, conversation_id,
    assignee_member_id, due_at, priority, completed_at) values
    ('0afb0979-1157-4ef3-a1b5-c8575f5e8d08', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Garder le pot vert pour Rania jusqu''à jeudi', 'reminder',
     '4cc6ebd7-a63b-4229-adac-09d68e4e343d',
     '55b45e5c-1186-4d03-a6eb-1610710b6c84',
     '6947b8de-55d5-49f0-a182-472505b88156', '2026-09-10T11:46:24.840Z'::timestamptz, 'high',
     null::timestamptz) on conflict (id) do nothing;
insert into tasks (id, organization_id, title, type, contact_id, conversation_id,
    assignee_member_id, due_at, priority, completed_at) values
    ('6002d3d2-7569-432e-ae9b-29a8ae694b9f', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Envoyer à Rania le prix des deux produits à la pistache', 'quote',
     '4cc6ebd7-a63b-4229-adac-09d68e4e343d',
     '55b45e5c-1186-4d03-a6eb-1610710b6c84',
     '6947b8de-55d5-49f0-a182-472505b88156', '2026-09-10T08:46:24.840Z'::timestamptz, 'normal',
     null::timestamptz) on conflict (id) do nothing;
insert into tasks (id, organization_id, title, type, contact_id, conversation_id,
    assignee_member_id, due_at, priority, completed_at) values
    ('5b8cfa6c-5ced-498c-a45e-2222d354cfcf', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Appeler Slim au sujet de la livraison du vendredi à Sousse', 'call',
     '0035c2fa-b53e-472f-aeb1-ed828335dc42',
     '22890c28-628d-486e-a58d-c76e7162d21e',
     '2c028ea8-c721-4823-a49e-26113bdfd9df', '2026-09-10T04:46:24.840Z'::timestamptz, 'high',
     null::timestamptz) on conflict (id) do nothing;
insert into tasks (id, organization_id, title, type, contact_id, conversation_id,
    assignee_member_id, due_at, priority, completed_at) values
    ('c37be9b9-77d1-457f-a0be-5ac0172b8953', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Répondre à Amine au sujet du prix du coffret cadeau', 'reply',
     '94b0b22f-dc58-49f5-afae-b0864e77c779',
     'd214e89d-afea-4cde-a058-cf261e3f64f8',
     '5fc54b41-2300-42f7-aa93-2158a9bbde84', '2026-09-09T21:46:24.840Z'::timestamptz, 'normal',
     null::timestamptz) on conflict (id) do nothing;
insert into tasks (id, organization_id, title, type, contact_id, conversation_id,
    assignee_member_id, due_at, priority, completed_at) values
    ('e481ad91-f740-4408-a7f8-4ee8da8d7eba', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Envoyer à Leila le devis pour huit coffrets cadeaux', 'quote',
     '3fbfe502-a0e8-452d-a3e7-a96bdf938bce',
     '0254dc68-a2e4-4004-ae76-bfb6998ac5b6',
     'fe95ec4b-2089-4565-a693-3a9719f88497', '2026-09-09T06:46:24.840Z'::timestamptz, 'high',
     null::timestamptz) on conflict (id) do nothing;
insert into tasks (id, organization_id, title, type, contact_id, conversation_id,
    assignee_member_id, due_at, priority, completed_at) values
    ('9d07e56d-54e4-42b8-aac8-b8c1f7c77b09', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Répondre à Hatem sur Instagram', 'reply',
     'c5c97a56-baf5-4df7-a622-0012622df342',
     'a7f4f513-1387-4eb8-ae46-de90070b8f1a',
     '2c028ea8-c721-4823-a49e-26113bdfd9df', '2026-09-11T02:46:24.840Z'::timestamptz, 'normal',
     null::timestamptz) on conflict (id) do nothing;
insert into tasks (id, organization_id, title, type, contact_id, conversation_id,
    assignee_member_id, due_at, priority, completed_at) values
    ('b3846e2d-f67b-40ad-a5a3-07da4e511bb6', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Confirmer à Karim la taille du plateau de desserts', 'custom',
     'a15f9120-3c0c-4b3d-a40f-2e885a1dd287',
     '2aad27c3-44fa-4dc9-af35-7b685b523bc4',
     '2c028ea8-c721-4823-a49e-26113bdfd9df', '2026-09-11T06:46:24.840Z'::timestamptz, 'low',
     null::timestamptz) on conflict (id) do nothing;
insert into tasks (id, organization_id, title, type, contact_id, conversation_id,
    assignee_member_id, due_at, priority, completed_at) values
    ('06344173-4d59-49be-a5b5-6ca9cc2abf99', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Rencontrer l''acheteur de l''hôtel à Bizerte', 'meeting',
     '5977483b-be71-4063-afc8-5bfd124f0d66',
     'bf130e39-0453-4b33-af83-4289cd9d5560',
     'fe95ec4b-2089-4565-a693-3a9719f88497', '2026-09-12T06:46:24.840Z'::timestamptz, 'normal',
     null::timestamptz) on conflict (id) do nothing;
insert into tasks (id, organization_id, title, type, contact_id, conversation_id,
    assignee_member_id, due_at, priority, completed_at) values
    ('2eb67927-d3c0-442e-a1f5-690cc64c2ba6', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Relancer Walid avant de clore le prospect', 'call',
     'cc7a2d19-b2ff-4755-aebb-5abf187e6169',
     '5333aff9-ff5f-4f7f-a8ac-e4c7d2b1f57d',
     '5fc54b41-2300-42f7-aa93-2158a9bbde84', '2026-09-13T06:46:24.840Z'::timestamptz, 'low',
     null::timestamptz) on conflict (id) do nothing;
insert into tasks (id, organization_id, title, type, contact_id, conversation_id,
    assignee_member_id, due_at, priority, completed_at) values
    ('8abdf18a-a519-424c-a55c-2164df64625c', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Confirmer le retrait de Sonia samedi', 'reminder',
     'af466121-0f2c-4290-acb5-c6cfd9ed93d9',
     '0460b624-4623-41b6-aeb4-f83c17de7445',
     '2c028ea8-c721-4823-a49e-26113bdfd9df', '2026-09-08T06:46:24.840Z'::timestamptz, 'normal',
     '2026-09-08T06:46:24.840Z'::timestamptz) on conflict (id) do nothing;
insert into tasks (id, organization_id, title, type, contact_id, conversation_id,
    assignee_member_id, due_at, priority, completed_at) values
    ('d2b6e5d6-cf88-48d0-a2de-8bb9769ce7cd', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Envoyer a Nadia le mot de remerciement', 'reply',
     '884b1822-82a5-4d25-a134-1905c08479ef',
     'e90e45c5-1768-46de-abc0-98e7a35735a9',
     '5fc54b41-2300-42f7-aa93-2158a9bbde84', '2026-09-09T06:46:24.840Z'::timestamptz, 'low',
     '2026-09-09T06:46:24.840Z'::timestamptz) on conflict (id) do nothing;
insert into tasks (id, organization_id, title, type, contact_id, conversation_id,
    assignee_member_id, due_at, priority, completed_at) values
    ('fc7f2ce5-2593-4294-ade4-26f44e68df49', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Réapprovisionner les assortiments découverte', 'custom',
     null,
     null,
     '6947b8de-55d5-49f0-a182-472505b88156', '2026-09-10T05:16:24.840Z'::timestamptz, 'high',
     null::timestamptz) on conflict (id) do nothing;
insert into leads (id, organization_id, contact_id, attribution_id, stage, value,
    owner_member_id, lost_reason, next_task_id, created_at) values
    ('7da59bff-1596-4ed2-adc7-3a74ebba8130', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', '4cc6ebd7-a63b-4229-adac-09d68e4e343d', '02117e7f-960f-4a90-aee8-affeb9f8ccd5',
     'qualified', 329.5, '6947b8de-55d5-49f0-a182-472505b88156', null,
     '6002d3d2-7569-432e-ae9b-29a8ae694b9f', '2026-08-15T06:46:24.840Z'::timestamptz)
    on conflict (id) do update set stage = excluded.stage;
insert into leads (id, organization_id, contact_id, attribution_id, stage, value,
    owner_member_id, lost_reason, next_task_id, created_at) values
    ('18473e11-0f26-4bb3-ae45-62fbb15a8536', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', '0035c2fa-b53e-472f-aeb1-ed828335dc42', '53340fdf-8b30-41b8-a1fb-3e5b10391d23',
     'contacted', 124, '2c028ea8-c721-4823-a49e-26113bdfd9df', null,
     '5b8cfa6c-5ced-498c-a45e-2222d354cfcf', '2026-09-09T06:46:24.840Z'::timestamptz)
    on conflict (id) do update set stage = excluded.stage;
insert into leads (id, organization_id, contact_id, attribution_id, stage, value,
    owner_member_id, lost_reason, next_task_id, created_at) values
    ('43352038-0177-4781-a577-d502452117c9', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'af888d1e-7b46-436b-a458-1c3e7c23e5f1', '4d9b1df1-ea80-4683-ae53-71cb0d282e3e',
     'proposal', 89.5, 'fe95ec4b-2089-4565-a693-3a9719f88497', null,
     null, '2026-08-22T06:46:24.840Z'::timestamptz)
    on conflict (id) do update set stage = excluded.stage;
insert into leads (id, organization_id, contact_id, attribution_id, stage, value,
    owner_member_id, lost_reason, next_task_id, created_at) values
    ('b6322a84-9f37-4595-a930-83b7718fad94', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', '94b0b22f-dc58-49f5-afae-b0864e77c779', '4baa5f9c-0b62-49b0-a4d5-dddad2becfcd',
     'new', 1040, null, null,
     'c37be9b9-77d1-457f-a0be-5ac0172b8953', '2026-09-09T06:46:24.840Z'::timestamptz)
    on conflict (id) do update set stage = excluded.stage;
insert into leads (id, organization_id, contact_id, attribution_id, stage, value,
    owner_member_id, lost_reason, next_task_id, created_at) values
    ('8908a4cc-2fb3-4a84-a683-f9554c85d5a1', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', '3fbfe502-a0e8-452d-a3e7-a96bdf938bce', 'c4b8b2fc-8e03-4a6f-a287-4ec810901f87',
     'proposal', 7520, 'fe95ec4b-2089-4565-a693-3a9719f88497', null,
     'e481ad91-f740-4408-a7f8-4ee8da8d7eba', '2026-09-01T06:46:24.840Z'::timestamptz)
    on conflict (id) do update set stage = excluded.stage;
insert into leads (id, organization_id, contact_id, attribution_id, stage, value,
    owner_member_id, lost_reason, next_task_id, created_at) values
    ('e02f6178-8c0c-4878-ad73-59d91f45cd5d', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', '5977483b-be71-4063-afc8-5bfd124f0d66', 'c91233f0-62ed-4c86-a2c9-1d386ca98c6f',
     'qualified', 888, 'fe95ec4b-2089-4565-a693-3a9719f88497', null,
     '06344173-4d59-49be-a5b5-6ca9cc2abf99', '2026-08-19T06:46:24.840Z'::timestamptz)
    on conflict (id) do update set stage = excluded.stage;
insert into leads (id, organization_id, contact_id, attribution_id, stage, value,
    owner_member_id, lost_reason, next_task_id, created_at) values
    ('c6cdad10-1e9d-4047-ac2d-dead28f53f71', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'c5c97a56-baf5-4df7-a622-0012622df342', 'c63b7ddd-999e-4abd-a5fd-3ff92247f1f8',
     'new', 156, null, null,
     '9d07e56d-54e4-42b8-aac8-b8c1f7c77b09', '2026-09-08T06:46:24.840Z'::timestamptz)
    on conflict (id) do update set stage = excluded.stage;
insert into leads (id, organization_id, contact_id, attribution_id, stage, value,
    owner_member_id, lost_reason, next_task_id, created_at) values
    ('6cc5b052-8333-4b95-ac62-d715f68ceef5', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'a15f9120-3c0c-4b3d-a40f-2e885a1dd287', 'ffbadf62-2e80-4469-a3b6-708f095185dc',
     'new', 412, null, null,
     'b3846e2d-f67b-40ad-a5a3-07da4e511bb6', '2026-09-06T06:46:24.840Z'::timestamptz)
    on conflict (id) do update set stage = excluded.stage;
insert into leads (id, organization_id, contact_id, attribution_id, stage, value,
    owner_member_id, lost_reason, next_task_id, created_at) values
    ('4a37fcbe-01a3-4bae-ae0d-e165060d6ed5', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'fdf2492c-2e2a-4ba7-aa8b-ca084a90ae4d', 'e3f39991-88f0-4fd1-a040-45d4b7a72489',
     'contacted', 205.5, '2c028ea8-c721-4823-a49e-26113bdfd9df', null,
     null, '2026-08-30T06:46:24.840Z'::timestamptz)
    on conflict (id) do update set stage = excluded.stage;
insert into leads (id, organization_id, contact_id, attribution_id, stage, value,
    owner_member_id, lost_reason, next_task_id, created_at) values
    ('23137f7e-d36f-4900-adba-cfc77c076926', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', '884b1822-82a5-4d25-a134-1905c08479ef', '60307e84-93f9-47f4-afee-be979fb1c3a9',
     'won', 304, '5fc54b41-2300-42f7-aa93-2158a9bbde84', null,
     null, '2026-08-07T06:46:24.840Z'::timestamptz)
    on conflict (id) do update set stage = excluded.stage;
insert into leads (id, organization_id, contact_id, attribution_id, stage, value,
    owner_member_id, lost_reason, next_task_id, created_at) values
    ('5f525b4f-934d-4b12-a5d6-aba5e4e38d74', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'f08ba763-0898-4f50-a326-9cc9774e1e56', 'd884ef77-e82f-4582-a964-c16df867b0e9',
     'won', 2080, '6947b8de-55d5-49f0-a182-472505b88156', null,
     null, '2026-07-31T06:46:24.840Z'::timestamptz)
    on conflict (id) do update set stage = excluded.stage;
insert into leads (id, organization_id, contact_id, attribution_id, stage, value,
    owner_member_id, lost_reason, next_task_id, created_at) values
    ('7454bef3-92d0-49f6-a628-4c210a21ed17', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'cc7a2d19-b2ff-4755-aebb-5abf187e6169', '9ac4be28-ad36-4da8-a8f1-acc9f07ceddd',
     'lost', 412, '5fc54b41-2300-42f7-aa93-2158a9bbde84', 'Prix au-dessus du budget',
     '2eb67927-d3c0-442e-a1f5-690cc64c2ba6', '2026-09-02T06:46:24.840Z'::timestamptz)
    on conflict (id) do update set stage = excluded.stage;
insert into leads (id, organization_id, contact_id, attribution_id, stage, value,
    owner_member_id, lost_reason, next_task_id, created_at) values
    ('8daf15db-8d9c-4871-aed7-e9381debc0c0', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'af466121-0f2c-4290-acb5-c6cfd9ed93d9', '2249ee15-eee3-4bd0-a2b1-d89cbdee15ed',
     'contacted', 124, '2c028ea8-c721-4823-a49e-26113bdfd9df', null,
     null, '2026-07-24T06:46:24.840Z'::timestamptz)
    on conflict (id) do update set stage = excluded.stage;
insert into budgets (id, organization_id, name, period, planned, used) values
    ('d2ce3513-99e7-4b85-ac72-b50eb0bc8c87', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Marketing', 'septembre 2026', 4200, 3610)
    on conflict (id) do update set used = excluded.used;
insert into budgets (id, organization_id, name, period, planned, used) values
    ('4012376b-d915-4694-ab2b-89972932cffb', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Livraison', 'septembre 2026', 2600, 2489)
    on conflict (id) do update set used = excluded.used;
insert into budgets (id, organization_id, name, period, planned, used) values
    ('dd6aa660-bd75-44d3-a604-7da4dfae26fc', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Fonctionnement', 'septembre 2026', 3100, 1740)
    on conflict (id) do update set used = excluded.used;
insert into budget_lines (id, organization_id, budget_id, label, planned, used, note) values
    ('fea92194-89ed-47f9-a14f-20701d61a0d0', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'd2ce3513-99e7-4b85-ac72-b50eb0bc8c87', 'Publicités Meta', 2200,
     2040, null) on conflict (id) do nothing;
insert into budget_lines (id, organization_id, budget_id, label, planned, used, note) values
    ('4c92c1a3-8073-45f0-a377-3a56c386d148', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'd2ce3513-99e7-4b85-ac72-b50eb0bc8c87', 'Google Ads', 1400,
     1310, 'Formulaires de prospects uniquement') on conflict (id) do nothing;
insert into budget_lines (id, organization_id, budget_id, label, planned, used, note) values
    ('5f7bef20-7160-438f-a52c-e8e70e31931f', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'd2ce3513-99e7-4b85-ac72-b50eb0bc8c87', 'Photographie produit', 600,
     260, null) on conflict (id) do nothing;
insert into budget_lines (id, organization_id, budget_id, label, planned, used, note) values
    ('6e5ed640-2648-4d6b-ab5b-25b952699baf', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', '4012376b-d915-4694-ab2b-89972932cffb', 'Tournées de livraison', 2100,
     2094, 'Proche de la limite') on conflict (id) do nothing;
insert into budget_lines (id, organization_id, budget_id, label, planned, used, note) values
    ('a40f6ade-63c5-40f4-a0a0-8639ac96b74a', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', '4012376b-d915-4694-ab2b-89972932cffb', 'Emballage', 500,
     395, null) on conflict (id) do nothing;
insert into budget_lines (id, organization_id, budget_id, label, planned, used, note) values
    ('3d9f050c-7aec-49f3-a39d-265a8d9cebd1', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'dd6aa660-bd75-44d3-a604-7da4dfae26fc', 'Loyer de l''atelier', 1800,
     1800, null) on conflict (id) do nothing;
insert into budget_lines (id, organization_id, budget_id, label, planned, used, note) values
    ('29aa06e0-47b0-493b-aa70-93704bc8589f', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'dd6aa660-bd75-44d3-a604-7da4dfae26fc', 'Aide à temps partiel', 900,
     640, null) on conflict (id) do nothing;
insert into budget_lines (id, organization_id, budget_id, label, planned, used, note) values
    ('b29ef953-db21-4ea9-ae7b-5cb3384d36e5', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'dd6aa660-bd75-44d3-a604-7da4dfae26fc', 'Outils et réparations', 400,
     300, null) on conflict (id) do nothing;
insert into bundles (id, organization_id, name, kind, description, product_ids, bundle_price,
    active, times_shown, times_taken, revenue_added) values
    ('a0d32836-7f6b-415c-ad5b-a47cf353d256', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Duo pistache', 'bundle', 'Proposé quand un client ajoute la crème de pistache et le dessert à la pistache. Le duo coûte moins cher que les deux pris séparément.',
     array['7b5a067a-493e-4db0-ad8a-9574aba26e26'::uuid,'ab0c2140-cba2-4c92-a023-96ca7da23157'::uuid]::uuid[], 99, true, 214,
     47, 14053) on conflict (id) do update set active = excluded.active;
insert into bundles (id, organization_id, name, kind, description, product_ids, bundle_price,
    active, times_shown, times_taken, revenue_added) values
    ('3fdd3d37-9706-404a-a0e4-416de1f5bc29', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Coffret cadeau avec assortiment de desserts', 'bundle', 'Ajoute un assortiment de desserts au coffret gourmand à prix groupé pour les clients qui prennent plus d''un coffret.',
     array['6a736b41-e472-414c-a524-ca4171f19a97'::uuid,'bd9a77b5-9ef6-4e63-a46f-503e0379964a'::uuid]::uuid[], 214, true, 88,
     19, 20349) on conflict (id) do update set active = excluded.active;
insert into bundles (id, organization_id, name, kind, description, product_ids, bundle_price,
    active, times_shown, times_taken, revenue_added) values
    ('eeec44dc-a889-4b07-a4d3-d19312d48a83', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Beurre avec chaque sélection laitière', 'recommendation', 'Affiché sous la sélection laitière. Rien n''est ajouté automatiquement, le client choisit.',
     array['fa60874f-bba4-436b-a8fd-d26ff4b385d7'::uuid,'66a1de72-f099-4865-a737-bf4f9b127b20'::uuid]::uuid[], null, true, 163,
     38, 4484) on conflict (id) do update set active = excluded.active;
insert into bundles (id, organization_id, name, kind, description, product_ids, bundle_price,
    active, times_shown, times_taken, revenue_added) values
    ('9b74ef1a-d462-4671-a52a-0ac74a2c173e', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Assortiment découverte avec le coffret de desserts', 'recommendation', 'Proposé à la fin de la commande, avant le paiement.',
     array['0cb50ae7-10d1-4e73-a4e6-727c5f971228'::uuid,'ab0c2140-cba2-4c92-a023-96ca7da23157'::uuid]::uuid[], null, false, 41,
     4, 296) on conflict (id) do update set active = excluded.active;
insert into bundles (id, organization_id, name, kind, description, product_ids, bundle_price,
    active, times_shown, times_taken, revenue_added) values
    ('60ad5a8f-b468-4151-aa15-4e7038b69c3d', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Livraison offerte à partir de 200 TND', 'threshold', 'Le client voit combien il lui manque pour atteindre la livraison offerte pendant qu''il choisit.',
     array[]::uuid[], null, true, 402,
     131, 8940) on conflict (id) do update set active = excluded.active;
insert into bundles (id, organization_id, name, kind, description, product_ids, bundle_price,
    active, times_shown, times_taken, revenue_added) values
    ('3109cf56-1482-4fc7-a62e-cc3a5a9d262e', '10f2108b-0e88-46ba-a9bb-d53550b0fbdb', 'Dix pour cent à partir de trois articles', 'discount', 'Ne s''applique qu''à la gamme Ramadan, et s''arrête d''elle-même à la fin de la gamme.',
     array['84c6b0fb-09e6-4b77-a18f-a553919e27e1'::uuid,'bd9a77b5-9ef6-4e63-a46f-503e0379964a'::uuid,'66a1de72-f099-4865-a737-bf4f9b127b20'::uuid]::uuid[], null, false, 0,
     0, 0) on conflict (id) do update set active = excluded.active;
