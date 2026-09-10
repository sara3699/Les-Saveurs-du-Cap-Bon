import { expect, test } from "@playwright/test";

/**
 * The shop's own website posting an order. This is the first connector that needs
 * permission from nobody, so it is the first one with a real endpoint behind it.
 *
 * These tests write to the demonstration shop, using references prefixed e2e- so
 * they can be told apart from real orders and cleared afterwards.
 */
const KEY = "lsc_92d823c837d280353e4270d564532eab1086ab2e5ca61001";
const ENDPOINT = "/api/intake/website";

function reference() {
  return `e2e-${Math.random().toString(36).slice(2, 10)}`;
}

test("an order posted by the website arrives, and arriving twice does not duplicate it", async ({ request }) => {
  const ref = reference();
  const payload = {
    reference: ref,
    name: "Cliente du site",
    phone: "+216 55 000 111",
    city: "Nabeul",
    page: "lesmillesaveursducapbon.com/panier",
    delivery_fee: 7.5,
    items: [{ name: "Crème de pistache", sku: "LMS-PIS-01", quantity: 2, unit_price: 42 }],
  };

  const first = await request.post(ENDPOINT, {
    headers: { Authorization: `Bearer ${KEY}` },
    data: payload,
  });
  expect(first.status()).toBe(201);
  const created = await first.json();
  expect(created.ok).toBe(true);
  expect(created.duplicate).toBe(false);
  expect(created.reference).toMatch(/^CMD-/);

  // A site that retries after a timeout must not create a second order.
  const again = await request.post(ENDPOINT, {
    headers: { Authorization: `Bearer ${KEY}` },
    data: payload,
  });
  expect(again.status()).toBe(200);
  expect((await again.json()).duplicate).toBe(true);
});

test("a question without items becomes a conversation rather than an order", async ({ request }) => {
  const response = await request.post(ENDPOINT, {
    headers: { Authorization: `Bearer ${KEY}` },
    data: {
      reference: reference(),
      name: "Visiteur du site",
      email: "visiteur@example.tn",
      subject: "Livraison à Monastir",
      message: "Est-ce que vous livrez à Monastir cette semaine ?",
    },
  });
  expect(response.status()).toBe(201);
  const body = await response.json();
  expect(body.ok).toBe(true);
  expect(body.reference).toBeNull();
});

test("a wrong key is refused", async ({ request }) => {
  const response = await request.post(ENDPOINT, {
    headers: { Authorization: "Bearer lsc_0000000000000000000000000000000000000000" },
    data: { reference: reference(), name: "Intrus", phone: "+216 99 999 999" },
  });
  expect(response.status()).toBe(401);
  expect((await response.json()).ok).toBe(false);
});

test("a missing key is refused", async ({ request }) => {
  const response = await request.post(ENDPOINT, {
    data: { name: "Intrus", phone: "+216 99 999 999" },
  });
  expect(response.status()).toBe(401);
});

test("a submission without a name or a way to reply is refused", async ({ request }) => {
  const noName = await request.post(ENDPOINT, {
    headers: { Authorization: `Bearer ${KEY}` },
    data: { phone: "+216 55 000 111" },
  });
  expect(noName.status()).toBe(400);

  const noContact = await request.post(ENDPOINT, {
    headers: { Authorization: `Bearer ${KEY}` },
    data: { name: "Sans contact" },
  });
  expect(noContact.status()).toBe(400);
});

test("the order the website sent shows up in the workspace, labelled Site web", async ({ page, request }) => {
  const ref = reference();
  const posted = await request.post(ENDPOINT, {
    headers: { Authorization: `Bearer ${KEY}` },
    data: {
      reference: ref,
      name: "Cliente du site",
      phone: "+216 55 000 111",
      items: [{ name: "Coffret gourmand", sku: "LMS-GFT-01", quantity: 1, unit_price: 148 }],
    },
  });
  const { reference: created } = await posted.json();

  await page.goto("/connexion");
  await page.getByLabel("Adresse e-mail").fill("sarra@saveurs-demo.tn");
  await page.getByLabel("Mot de passe").fill("kQ7-marsa-91");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });

  await page.goto(`/orders?q=${created}&period=90`);
  const row = page.locator("table tbody tr").filter({ hasText: created }).first();
  await expect(row).toBeVisible();
  await expect(row).toContainText("Site web");
});
