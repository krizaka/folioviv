#!/usr/bin/env node
// No empty map (folioviv#488): the shop pages that draw a map must show a live one with a size and a canvas, once the page has settled.
// The measure is the shared `maps` check of @krizaka/page-audit (krizaka-ts#199); this file holds only folioviv's pages and options.
//
//   node scripts/check-maps.mjs --base http://localhost:3000
import { auditRoutes } from "@krizaka/page-audit";
import { chromium } from "playwright-core";

import { stubTiles } from "./check-overflow.mjs";

/** The shop pages with a map (the demo shop with zones), at the width where the live map shows at once (`sm` and up). */
export const MAP_PAGES = ["/fr/s/pattes-saint-henri", "/en/s/pattes-saint-henri"];
export const WIDTH = 1280;
export const SETTLE_MS = 4000;

/** The audit's browser: software GL for the map's canvas, and tiles answered by a fixture (the run never reaches the CDN). */
export async function launchWithGl() {
  const browser = await chromium.launch({
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  });
  const newContext = browser.newContext.bind(browser);
  browser.newContext = async (options) => stubTiles(await newContext(options));
  return browser;
}

export const OPTIONS = {
  launch: launchWithGl,
  routes: MAP_PAGES,
  widths: [WIDTH],
  themes: ["dark", "light"],
  height: 900,
  settleMs: SETTLE_MS,
  checks: { maps: { required: true } },
};

export function check({ base }) {
  return auditRoutes({ ...OPTIONS, base });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const i = process.argv.indexOf("--base");
  const problems = await check({ base: i >= 0 ? process.argv[i + 1] : "http://localhost:3000" });
  if (problems.length) {
    console.error(`${problems.length} empty map(s):\n  ${problems.join("\n  ")}`);
    process.exit(1);
  }
  console.log(`maps drawn: ${MAP_PAGES.length} pages x 2 themes`);
}
