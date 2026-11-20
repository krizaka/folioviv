// Journey: a clean load raises no CSP violation (krizaka-internal#4137). The router's cross-origin prefetches (app ⇄ shop origins) broke
// `connect-src 'self'` on the home, the shop pages and the owner's day. The pages are loaded, scrolled past the fold so the links come into view,
// and the console is read.
import { expect, test } from "@playwright/test";

import { signInAsDemoOwner } from "./demo-owner.mjs";

const watch = (page, found) =>
  page.on("console", (m) => {
    if (/Content Security Policy|violates the following|violates .*directive/i.test(m.text())) {
      found.push(m.text());
    }
  });

async function settle(page) {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1500); // the router prefetches the links that came into view
}

test("home, a shop page and the owner's day load without a CSP violation", async ({ page }) => {
  const found = [];
  watch(page, found);
  await page.goto("/fr");
  await settle(page);
  const shopBase = await signInAsDemoOwner(page);
  await page.goto(`${shopBase}/today`);
  await settle(page);
  const shopPage = page.locator('a[href*="/s/"], a[href*=".shop"]').first();
  if (await shopPage.count()) {
    await page.goto((await shopPage.getAttribute("href")) ?? "/fr");
    await settle(page);
  }
  expect(found, "no CSP violation in the console").toEqual([]);
});
