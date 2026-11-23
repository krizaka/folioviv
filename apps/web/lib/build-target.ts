/**
 * Which build this is (krizaka-internal#4626, family epic #4148): the app (a server: accounts, API, database) or the public export (static files
 * of the public pages, nothing that can sign in). Read here, once; `next.config.public.mjs` sets it at build time. A module that differs wholesale
 * between the two is swapped by an alias of that config (components/public-build, lib/public-build): this flag is for the few one-line differences.
 */
export const publicBuild = process.env.NEXT_PUBLIC_BUILD_TARGET === "public";
