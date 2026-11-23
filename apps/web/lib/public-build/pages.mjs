/** The page folders under `app/[locale]/` that the public export holds ("" is the home; `docs/[page]` are the five guide pages the docs hub links to). Plain data, no file read: the pages themselves import it (the footer), `routes.mjs` re-exports it for the build script. */
export const PUBLIC_PAGES = ["", "docs", "docs/[page]", "privacy"];
