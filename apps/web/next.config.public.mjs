import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { PUBLIC_TARGET } from "./lib/public-build/routes.mjs";

/**
 * The public export (krizaka-internal#4626): `scripts/build-public.mjs` stages a project that links the page files of
 * `lib/public-build/routes.mjs` and this file as its `next.config.mjs`, then runs `next build` there. A static export has no
 * server, no proxy and no API: the pages are rendered once, here, and the result is plain files.
 */
const packageVersion = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")).version;
const appVersion = process.env.APP_VERSION?.trim() || packageVersion;

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  // Each page is a folder with an index.html: any static host serves /fr/docs without a rewrite rule.
  trailingSlash: true,
  // The monorepo root: the linked files resolve outside the staged folder.
  // Modules that differ wholesale from the app are swapped here and nowhere else: the bar (no session island, no sign-in), the home's
  // feed (no database), the hero's session, the nonce of a response (a static page has none).
  turbopack: {
    root: fileURLToPath(new URL("../..", import.meta.url)),
    resolveAlias: {
      "@/components/SiteHeader": "./components/public-build/SiteHeader.tsx",
      "@/components/home/NeighbourhoodFeed": "./components/public-build/NeighbourhoodFeed.tsx",
      "@/lib/home-feed": "./lib/public-build/home-feed.ts",
      "@/lib/hero-session": "./lib/public-build/hero-session.ts",
      "@/lib/request-nonce": "./lib/public-build/request-nonce.ts",
    },
  },
  transpilePackages: ["@folioviv/core"],
  reactStrictMode: true,
  poweredByHeader: false,
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_APP_VERSION: appVersion, NEXT_PUBLIC_BUILD_TARGET: PUBLIC_TARGET },
};

export default nextConfig;
