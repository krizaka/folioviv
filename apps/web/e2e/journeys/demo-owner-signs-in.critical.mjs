// Journey: the demo owner signs in and sees Aujourd'hui (krizaka-internal#3827). On dev the owner of « Pattes de Saint-Henri » was refused: the seed made her
// account at an address the QA secret does not name. The journey signs in with the QA address the seed was given and lands on her day.
import { expect, test } from "@playwright/test";

import { DEMO_OWNER_EMAIL, DEMO_OWNER_PASSWORD } from "./demo-owner.mjs";

test("the demo owner signs in and sees Aujourd'hui", async ({ page }) => {
  await page.goto("/fr/sign-in");
  await page.locator("input[type=email]").first().fill(DEMO_OWNER_EMAIL);
  await page.locator("input[type=password]").first().fill(DEMO_OWNER_PASSWORD);
  await page.locator("form button[type=submit]").first().click();
  await page.waitForURL(/\/app(\/|\?|$)/, { timeout: 60_000 });
  await expect(page.locator("main").first()).toBeVisible();
  await expect(page.getByText("Aujourd'hui").first()).toBeVisible();
});
