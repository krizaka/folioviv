import { describe, expect, it } from "vitest";

import { DOC_IDS } from "@/lib/site";

import { PUBLIC_DOC_IDS, PUBLIC_ROUTES, stagedAppFiles } from "./routes.mjs";

/** The list of the public export (krizaka-internal#4626): home, docs, privacy, in both languages; nothing that signs in or sells. */
describe("the public routes", () => {
  it("hold the home, the docs and the privacy page in both languages", () => {
    expect(PUBLIC_ROUTES).toEqual(
      expect.arrayContaining(["/fr", "/en", "/fr/docs", "/en/docs", "/fr/privacy", "/en/privacy", "/en/docs/shop"]),
    );
  });

  it.each(["pricing", "explore", "terms", "sign-in", "download", "app", "s", "api"])("leave out %s", (word) => {
    expect(PUBLIC_ROUTES.filter((r) => r.split("/").includes(word))).toEqual([]);
    expect(stagedAppFiles().filter((f) => f.split(/[\\/]/).includes(word))).toEqual([]);
  });

  it("name the guide's pages as the app does", () => {
    expect([...PUBLIC_DOC_IDS]).toEqual([...DOC_IDS]);
  });
});
