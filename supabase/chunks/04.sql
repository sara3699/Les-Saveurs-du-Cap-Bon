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