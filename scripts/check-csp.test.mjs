import { describe, expect, it } from "vitest";

import { cspProblems, isKnownOwnerEval, pagesOf } from "./check-csp.mjs";

describe("check-csp (krizaka-internal#4137)", () => {
  it("loads the home in both languages, each shop on its own origin and the app's /s/<slug> hop to it", () => {
    expect(pagesOf("http://localhost:3001/", "http://{slug}.shops.localhost:3001", ["pattes-saint-henri"])).toEqual([
      "http://localhost:3001/fr",
      "http://localhost:3001/en",
      "http://pattes-saint-henri.shops.localhost:3001/",
      "http://localhost:3001/fr/s/pattes-saint-henri",
    ]);
  });

  it("says each violation on one line, and nothing for a clean page", () => {
    expect(cspProblems("p", [])).toEqual([]);
    expect(
      cspProblems("http://localhost:3001/fr", [
        { directive: "connect-src", blocked: "http://localhost:3001/fr/s/x?_rsc=1", source: "" },
        { directive: "script-src", blocked: "eval", source: "chunk.js:1" },
      ]),
    ).toEqual([
      "http://localhost:3001/fr: connect-src blocked http://localhost:3001/fr/s/x?_rsc=1 (no source)",
      "http://localhost:3001/fr: script-src blocked eval (chunk.js:1)",
    ]);
  });

  it("knows only the owner bundle's eval probe, never a blocked fetch", () => {
    expect(isKnownOwnerEval({ directive: "script-src", blocked: "eval" })).toBe(true);
    expect(isKnownOwnerEval({ directive: "connect-src", blocked: "http://x/fr/s/y?_rsc=1" })).toBe(false);
    expect(isKnownOwnerEval({ directive: "script-src-elem", blocked: "http://cdn.test/a.js" })).toBe(false);
  });
});
