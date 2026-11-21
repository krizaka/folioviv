#!/usr/bin/env node
// No CSP violation on the public pages, both origins (krizaka-internal#4137). A router link prefetches its target with a `fetch`; when the target
// is another origin (a shop's own domain from the app, the app from a shop) or a route that redirects there (`/<locale>/s/<slug>`), the fetch breaks
// `connect-src 'self'`. Only a server that declares the shop domain, on an app origin that is not its listen origin, shows it (ci-after-build.sh
// starts one on :3002; the journeys' server has no shop domain, which is why a journey stayed green while dev was red). The pages are loaded,
// every link of the bar, the footer and the page is hovered, the page is scrolled to its end, and every `securitypolicyviolation` event fails.
//
//   node scripts/check-csp.mjs --base http://app.localhost:3002 --shop 'http://{slug}.shops.localhost:3002'
//   node scripts/check-csp.mjs --base https://dev.folioviv.com --shop 'https://{slug}.folioviv.shop'
// With CSP_OWNER_EMAIL and CSP_OWNER_PASSWORD (the seeded owner; never printed) the owner's day is loaded too, signed in.
import { pathToFileURL } from "node:url";

import { chromium } from "playwright-core";

export const SLUGS = ["pattes-saint-henri", "cedre-ciseaux"];
const MAX_LINKS = 60;
const SETTLE_MS = 2500;

/** The pages to load: the app's home in both languages, each shop on its own origin, and the app's `/s/<slug>` address that leads to it. */
export function pagesOf(base, shopPattern, slugs = SLUGS) {
  const app = base.replace(/\/$/, "");
  return [
    `${app}/fr`,
    `${app}/en`,
    ...slugs.flatMap((slug) => [`${shopPattern.replace("{slug}", slug)}/`, `${app}/fr/s/${slug}`]),
  ];
}

/**
 * The owner's day still loads Node's crypto polyfill (crypto-browserify, through a server module reached from a client one), whose helpers probe
 * `Function(…)`: a `script-src` eval report that is not a link's, reported to the CTO with krizaka-internal#4137 for a ticket of its own. Only that
 * one is printed and not failed, and only on the owner's day; every other violation there fails, and nothing is tolerated on the public pages.
 */
export const isKnownOwnerEval = (e) => e.directive.startsWith("script-src") && e.blocked === "eval";

/** One line per violation seen on a page: the directive, what it blocked and the page it came from. */
export function cspProblems(page, events) {
  return events.map((e) => `${page}: ${e.directive} blocked ${e.blocked || "(inline)"} (${e.source || "no source"})`);
}

const flag = (args, name) => (args.includes(`--${name}`) ? args[args.indexOf(`--${name}`) + 1] : undefined);

/** Record every violation from the first byte of every document of the context (the redirect's target included). */
async function watchedContext(browser) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.addInitScript(() => {
    globalThis.__csp = [];
    document.addEventListener("securitypolicyviolation", (e) =>
      globalThis.__csp.push({
        directive: e.violatedDirective,
        blocked: e.blockedURI,
        source: e.sourceFile ? `${e.sourceFile}:${e.lineNumber}` : "",
      }),
    );
  });
  return context;
}

/** Bring the page's links into view and hover them (the router prefetches on view and on hover), then scroll to the end and let it settle. */
async function exercise(page) {
  const links = await page.locator("a[href]").all();
  for (const link of links.slice(0, MAX_LINKS)) {
    await link.hover({ timeout: 1000, trial: false }).catch(() => undefined);
  }
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(SETTLE_MS);
}

/** The owner's session in the context, when the run names an owner (the seeded walker): the owner's day is the app's busiest page of links. */
async function signIn(context, base, owner) {
  const answer = await context.request.post(`${base}/api/auth/sign-in`, { data: owner });
  if (!answer.ok()) throw new Error(`the owner's sign-in answered ${answer.status()}`);
}

async function visit(browser, url, owner, tolerated = () => false) {
  const context = await watchedContext(browser);
  if (owner) await signIn(context, new URL(url).origin, owner);
  const page = await context.newPage();
  try {
    const answer = await page.goto(url, { waitUntil: "load", timeout: 30_000 });
    if (!answer?.ok()) return [`${url}: answered ${answer?.status() ?? "nothing"}`];
    await exercise(page);
    const events = await page.evaluate(() => globalThis.__csp ?? []);
    for (const e of events.filter(tolerated)) process.stdout.write(`  known, not failed: ${cspProblems(url, [e])[0]}\n`);
    return cspProblems(url, events.filter((e) => !tolerated(e)));
  } finally {
    await context.close();
  }
}

async function main(args) {
  const base = flag(args, "base") ?? "http://app.localhost:3002";
  const shop = flag(args, "shop") ?? "http://{slug}.shops.localhost:3002";
  const env = process.env;
  const owner = env.CSP_OWNER_EMAIL ? { email: env.CSP_OWNER_EMAIL, password: env.CSP_OWNER_PASSWORD } : null;
  const browser = await chromium.launch();
  const problems = [];
  try {
    for (const url of pagesOf(base, shop)) {
      const found = await visit(browser, url);
      process.stdout.write(`${found.length ? "✗" : "✓"} ${url}\n`);
      problems.push(...found);
    }
    if (owner) {
      const found = await visit(browser, `${base.replace(/\/$/, "")}/fr/app`, owner, isKnownOwnerEval);
      process.stdout.write(`${found.length ? "✗" : "✓"} the owner's day (/fr/app)\n`);
      problems.push(...found);
    }
  } finally {
    await browser.close();
  }
  if (problems.length) {
    const lines = problems.map((p) => "  " + p).join("\n");
    process.stderr.write(`${problems.length} CSP violation(s):\n${lines}\n`);
    process.exit(1);
  }
  process.stdout.write("no CSP violation\n");
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  await main(process.argv.slice(2));
}
