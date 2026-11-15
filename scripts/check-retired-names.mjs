#!/usr/bin/env node
// What a stranger reads on a demo shop is the product's showcase (krizaka-internal#3743): no page may still carry a retired product name.
// The check reads the rendered HTML of every demo page, in both languages, and refuses a retired name in what a visitor reads or hears
// (the text, an alt, a title, an aria-label, a meta content). An address (src, href, srcset) is not read: a media key keeps its old folder until
// the photos are replaced (krizaka-internal#3742, T8).
//
//   node scripts/check-retired-names.mjs --base https://dev.folioviv.com [--shop-host folioviv.shop]
//
// Exits 1 listing every page × retired name. Nothing else is printed.
import { fileURLToPath } from "node:url";

/** The product's old name; a name joins this list the day it is retired. */
// @fixed: a list of names, not a business parameter
export const RETIRED_NAMES = ["Akinaza"];

/** The demo shops the showcase shows (`packages/db/src/demo-shops.ts`, Saint-Henri). */
export const DEMO_SHOPS = ["pattes-saint-henri", "cedre-ciseaux", "encre-vive", "ferland-conseil"];
export const LOCALES = ["fr", "en"];

const READ_ATTRIBUTES = ["alt", "title", "aria-label", "content", "placeholder"];

/** The page without the stretches between `open` and `close` (a script, a style, a comment), found by position: no backtracking. */
function withoutBlocks(html, open, close) {
  let rest = html;
  let kept = "";
  for (;;) {
    const start = rest.toLowerCase().indexOf(open);
    if (start === -1) {
      return kept + rest;
    }
    const end = rest.toLowerCase().indexOf(close, start);
    kept += rest.slice(0, start) + " ";
    if (end === -1) {
      return kept;
    }
    rest = rest.slice(end + close.length);
  }
}

/** The tags of a page and its text between them, found by position. */
function splitTags(html) {
  const tags = [];
  let text = "";
  let rest = html;
  for (;;) {
    const open = rest.indexOf("<");
    const close = open === -1 ? -1 : rest.indexOf(">", open);
    if (close === -1) {
      return { tags, text: text + rest };
    }
    text += `${rest.slice(0, open)} `;
    tags.push(rest.slice(open, close + 1));
    rest = rest.slice(close + 1);
  }
}

/** What a visitor reads in a page: its text and the words of its attributes, never a script, a style, a comment or an address. */
export function readableText(html) {
  const parts = [];
  const body = withoutBlocks(
    withoutBlocks(withoutBlocks(html, "<script", "</script>"), "<style", "</style>"),
    "<!--",
    "-->",
  );
  const { tags, text } = splitTags(body);
  for (const tag of tags) {
    // The server renders double-quoted values: the pieces between quotes alternate name-side, value, name-side, value…
    const pieces = tag.split('"');
    for (let i = 1; i < pieces.length; i += 2) {
      const before = pieces[i - 1].trimEnd().toLowerCase();
      if (READ_ATTRIBUTES.some((name) => before.endsWith(`${name}=`))) {
        parts.push(pieces[i]);
      }
    }
  }
  parts.push(text);
  return parts.join(" ");
}

/** The retired names a page's rendered HTML carries (case-insensitive), each once. */
export function retiredNamesIn(html, names = RETIRED_NAMES) {
  const text = readableText(html).toLowerCase();
  return names.filter((name) => text.includes(name.toLowerCase()));
}

/** A demo shop's address on a shop host (`https://<slug>.<host>/<locale>`). */
export const shopUrl = (slug, locale, shopHost) => `https://${slug}.${shopHost}/${locale}`;

export async function crawl({ shopHost, fetcher = fetch }) {
  const problems = [];
  for (const slug of DEMO_SHOPS) {
    for (const locale of LOCALES) {
      const url = shopUrl(slug, locale, shopHost);
      const res = await fetcher(url);
      if (!res.ok) {
        problems.push(`${url}: HTTP ${res.status}`);
        continue;
      }
      for (const name of retiredNamesIn(await res.text())) {
        problems.push(`${url}: carries « ${name} »`);
      }
    }
  }
  return problems;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const flag = (name) => process.argv[process.argv.indexOf(name) + 1];
  const shopHost = process.argv.includes("--shop-host") ? flag("--shop-host") : "folioviv.shop";
  const problems = await crawl({ shopHost });
  if (problems.length > 0) {
    console.error(problems.join("\n"));
    process.exit(1);
  }
  console.log(`${DEMO_SHOPS.length * LOCALES.length} demo pages: no retired name`);
}
