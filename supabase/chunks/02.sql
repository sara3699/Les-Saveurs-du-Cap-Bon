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