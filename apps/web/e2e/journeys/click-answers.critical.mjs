// Journey: a click answers at once (krizaka-internal#3945). Three clicks of the public path, each timed twice: click → the address changes (the
// destination's frame is on screen: the router committed, a loading boundary or a prefetched payload answered) and click → its content is visible.
// The numbers are printed (the proof reads them); the budgets are loose on purpose, a CI runner is slow: they catch a frozen screen (a redirect hop,
// a payload awaited with no frame), not a few tens of milliseconds.
import { expect, test } from "@playwright/test";

const FIRST_FRAME_BUDGET_MS = 1500;
const CONTENT_BUDGET_MS = 6000;

async function timedClick(page, label, click, landing, content) {
  const t0 = Date.now();
  await click();
  await page.waitForURL(landing, { timeout: 30_000, waitUntil: "commit" });
  const frame = Date.now() - t0;
  await expect(content).toBeVisible({ timeout: 30_000 });
  const done = Date.now() - t0;
  console.log(`click-answers ${label}: first frame ${frame} ms, content ${done} ms`);
  expect(frame, `${label}: first frame`).toBeLessThan(FIRST_FRAME_BUDGET_MS);
  expect(done, `${label}: content`).toBeLessThan(CONTENT_BUDGET_MS);
}

test("home → Explorer → a shop → a service answer at once", async ({ page }) => {
  await page.goto("/fr");
  await expect(page.locator("main").first()).toBeVisible();

  await timedClick(
    page,
    "home → Explorer",
    () => page.locator('a[href$="/fr/explore"]').first().click(),
    /\/fr\/explore/,
    page.getByTestId("explore-list").locator("li").first(),
  );

  await timedClick(
    page,
    "Explorer → a shop",
    () => page.getByTestId("explore-list").locator("li a").first().click(),
    /\/fr(\/s\/[^/]+)?\/?$/,
    page.locator('main a[href*="/service/"]').first(),
  );

  await timedClick(
    page,
    "a shop → a service",
    () => page.locator('main a[href*="/service/"]').first().click(),
    /\/service\//,
    page.locator("main").first(),
  );
});
