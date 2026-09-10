import { expect, test } from "@playwright/test";

/**
 * The journey an owner walks on the first morning: see which platform the
 * orders came from, open a request, give it an owner, then move the lead along.
 */

test("the dashboard names every platform the orders came from", async ({ page }) => {
  await page.goto("/dashboard");

  const panel = page.locator("section", { hasText: "Where your orders come from" }).first();
  await expect(panel).toBeVisible();

  for (const platform of ["Website", "WhatsApp", "Instagram", "Facebook", "Google", "Manual"]) {
    await expect(panel.getByText(platform, { exact: true }).first()).toBeVisible();
  }

  // The failure this product exists to prevent.
  await expect(page.getByText("Online", { exact: true })).toHaveCount(0);
});

test("orders keep the platform they arrived on when filtered and opened", async ({ page }) => {
  await page.goto("/orders?source=whatsapp&period=30");

  const rows = page.locator("table tbody tr");
  await expect(rows.first()).toBeVisible();
  const count = await rows.count();
  expect(count).toBeGreaterThan(3);

  for (let i = 0; i < Math.min(count, 8); i++) {
    await expect(rows.nth(i)).toContainText("WhatsApp");
  }

  await rows.first().getByRole("link").first().click();
  await expect(page.getByText("Where this order came from")).toBeVisible();
  await expect(page.getByText("Connected account")).toBeVisible();
  await expect(page.getByText("Les Saveurs WhatsApp Business").first()).toBeVisible();
});

test("a conversation can be opened and given an owner", async ({ page }) => {
  await page.goto("/inbox");

  await page.getByRole("link", { name: /Rania Trabelsi/ }).first().click();
  await expect(page.getByRole("heading", { name: "Rania Trabelsi" })).toBeVisible();
  await expect(page.getByText("Hello, is the pistachio cream still available?")).toBeVisible();

  await page.getByLabel("Assign to").selectOption({ label: "Khaled Mansouri" });
  await expect(page.getByRole("status")).toContainText("Assigned to Khaled Mansouri");
  await expect(page.getByText("Owned by Khaled Mansouri")).toBeVisible();
});

test("a channel that is not connected cannot be replied to", async ({ page }) => {
  await page.goto("/inbox?c=cv_02");

  await expect(page.getByRole("heading", { name: "Yosr Mahfoudh" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Send" })).toBeDisabled();
  await expect(page.getByText(/Instagram professional account is not connected/)).toBeVisible();
});

test("dashboard shows team call conversion", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page.getByText("Call-to-order conversion")).toBeVisible();
  await expect(page.getByText("Calls received", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Customers won", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Orders placed", { exact: true }).first()).toBeVisible();
});

test("products page uses the Les Saveurs demo catalog", async ({ page }) => {
  await page.goto("/products");

  await expect(page.getByText("Crème de pistache", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/public Instagram signals/)).toBeVisible();
});

test("a lead can be moved a stage and the move can be undone", async ({ page }) => {
  await page.goto("/pipeline");

  const card = page.locator("article").filter({ hasText: "Rania Trabelsi" }).first();
  await expect(card).toBeVisible();
  await expect(card).toContainText("WhatsApp");

  await page.getByRole("button", { name: "Move Rania Trabelsi on to Proposal" }).click();

  const receipt = page.getByRole("status").filter({ hasText: "moved out of Qualified" });
  await expect(receipt).toContainText("into Proposal");
  await expect(receipt).toContainText("held for this visit only");

  await receipt.getByRole("button", { name: "Undo" }).click();
  await expect(page.getByRole("button", { name: "Move Rania Trabelsi on to Proposal" })).toBeVisible();
});

test("a call can be recorded by hand and undone", async ({ page }) => {
  await page.goto("/team");

  const panel = page.locator("section").filter({ hasText: "Call conversion performance" }).first();
  await expect(panel.getByText("100").first()).toBeVisible();

  await panel.getByLabel("Who took the call").selectOption({ label: "Sarra" });
  await panel.getByRole("button", { name: "Add this call" }).click();

  await expect(panel.getByText("1 call added on this visit")).toBeVisible();
  await expect(panel.getByText("Nothing is saved.")).toBeVisible();
  await expect(panel.getByText("101").first()).toBeVisible();

  await panel.getByRole("button", { name: "Undo the last one" }).click();
  await expect(panel.getByText("100").first()).toBeVisible();
});
