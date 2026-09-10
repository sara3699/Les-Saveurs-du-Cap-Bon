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