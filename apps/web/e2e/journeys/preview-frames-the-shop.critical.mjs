// Journey: the studio's live preview renders (krizaka-internal#4136). On Boutique > Page > Look the preview frame loads the shop page
// (served from the shop's own origin): the app's CSP `frame-src` must allow it, so the frame is not empty. Demo data only.
import { expect, test } from "@playwright/test";

import { signInAsDemoOwner } from "./demo-owner.mjs";

test("the preview on the Look tab shows the shop page, not a blocked frame", async ({ page }) => {
  const blocked = [];
  page.on("console", (m) => {
    if (m.text().includes("frame-src")) {
      blocked.push(m.text());
    }
  });
  const shopBase = await signInAsDemoOwner(page);
  await page.goto(`${shopBase}/settings/page?tab=look`);
  // On a phone the preview sits behind a button.
  const show = page.locator("aside button[aria-controls]").first();
  if (await show.isVisible()) {
    await show.click();
  }
  const frame = page.locator("aside iframe").first();
  await expect(frame).toBeVisible();
  const body = page.frameLocator("aside iframe").locator("body *").first();
  await expect(body).toBeAttached({ timeout: 30_000 });
  expect(blocked, "no frame-src violation").toEqual([]);
});
