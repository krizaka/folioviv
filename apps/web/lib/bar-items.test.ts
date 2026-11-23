import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { barItems } from "./bar-items";
import { barItems as exportBarItems } from "./public-build/bar-items";

describe("the bar's links", () => {
  it("lead with Explore, then the family's, in the app", () => {
    const ids = barItems("en", "home", "Explore").map((i) => i.id);
    expect(ids[0]).toBe("explore");
    expect(ids).toContain("docs");
  });

  it("are the docs alone in the public export: no map, no pricing", () => {
    const items = exportBarItems("fr", "docs/shop", "Explorer");
    expect(items.map((i) => i.id)).toEqual(["docs"]);
    expect(items[0]?.active).toBe(true);
    expect(items[0]?.href).toBe("/fr/docs");
  });

  it("swap by an alias of the export's config, so the app's client bundle carries no export branch", () => {
    const config = readFileSync(resolve(__dirname, "../next.config.public.mjs"), "utf8");
    expect(config).toContain('"@/lib/bar-items": "./lib/public-build/bar-items.ts"');
    expect(readFileSync(resolve(__dirname, "./bar-items.ts"), "utf8")).not.toContain("publicExport");
  });
});
