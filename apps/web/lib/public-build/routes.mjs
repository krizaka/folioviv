import { readdirSync } from "node:fs";
import { join } from "node:path";

import { PUBLIC_PAGES } from "./pages.mjs";

/**
 * The public export of Folioviv (krizaka-internal#4626): the pages a visitor may read while the product is paused and has no sign-in there.
 * One list, read by the build script (which stages exactly these page files), the export check and its test.
 * A page is added here AND reviewed for server parts: nothing else is ever exported. Left out: pricing, explore, terms, sign-in, download.
 */
export const PUBLIC_LOCALES = ["fr", "en"];

export { PUBLIC_PAGES } from "./pages.mjs";

/** The five pages of the guide (`DOC_IDS` of lib/site.ts, checked equal by a test: this file is plain JS for the build script). */
export const PUBLIC_DOC_IDS = ["shop", "bookings", "invoices", "books", "data"];

/** The routes the export holds, as the check reads them in the output folder (`/fr`, `/fr/docs`, `/fr/docs/shop`, …). */
export const PUBLIC_ROUTES = PUBLIC_LOCALES.flatMap((locale) => [
  `/${locale}`,
  `/${locale}/docs`,
  ...PUBLIC_DOC_IDS.map((id) => `/${locale}/docs/${id}`),
  `/${locale}/privacy`,
]);

/** The HTML files of `public/` (the search console's verification): copied as they are, they are files of the site, never a route. */
export const PUBLIC_ASSET_PAGES = readdirSync(new URL("../../public", import.meta.url))
  .filter((name) => name.endsWith(".html"))
  .map((name) => `/${name.replace(/\.html$/, "")}`);

/** Files of `app/` the staged project needs besides the page files (styles, icons): never a route of their own. */
export const PUBLIC_APP_ASSETS = ["globals.css", "icon.svg", "apple-icon.png"];

/** What the staged project links to, unchanged, from `apps/web`: the code the pages import (and the build-time files they read). */
export const PUBLIC_SHARED_ENTRIES = [
  "components",
  "lib",
  "messages",
  "content",
  "public",
  "package.json",
  "postcss.config.mjs",
];

/** The target the staged build is made for (read at build time by lib/build-target.ts). */
export const PUBLIC_TARGET = "public";

/** The files of `app/` the staged project links, relative to it: the locale layout, the page of each exported folder, the assets. */
export const stagedAppFiles = () => [
  ...PUBLIC_APP_ASSETS,
  join("[locale]", "layout.tsx"),
  ...PUBLIC_PAGES.map((page) => join("[locale]", page, "page.tsx")),
];
