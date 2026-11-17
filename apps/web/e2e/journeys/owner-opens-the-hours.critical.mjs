// Journey: the owner opens the hours (krizaka-internal#1911). Léa follows « Open the hours » from the home and lands on Hours and days off,
// not on Team and not under the page's decoration settings. Demo data only (the seeded cast).
import { expect, test } from "@playwright/test";

import { signInAsDemoOwner } from "./demo-owner.mjs";

test("owner opens the hours: Boutique lists Hours and days off, and the section holds the week", async ({ page }) => {
  const shopBase = await signInAsDemoOwner(page);
  expect(shopBase, "the app lives under the shop's address").toBeTruthy();
  await page.goto(`${shopBase}/settings/hours`);
  await page.waitForLoadState("load");
  await expect(page.getByRole("heading", { name: "Horaires et jours de congé" }).first()).toBeVisible();
  // On a phone the sections sit in one menu (a closed <details>): open it before reading the links.
  const menu = page.locator("[data-settings-menu] summary");
  await menu.click();
  await expect(page.getByRole("link", { name: "Règles de réservation" }).first()).toBeVisible();
  // The open menu pushes the form down on a phone: Léa closes it again, as she would, before reading the week.
  await menu.click();
  // The week is on the first screen: no scroll to reach the form.
  await expect(page.getByText("mardi", { exact: false }).first()).toBeInViewport();
});
