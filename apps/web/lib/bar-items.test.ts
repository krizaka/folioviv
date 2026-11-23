import { describe, expect, it } from "vitest";

import { barItems } from "./bar-items";

describe("the bar's links", () => {
  it("lead with Explore, then the family's, in the app", () => {
    const ids = barItems("en", "home", "Explore").map((i) => i.id);
    expect(ids[0]).toBe("explore");
    expect(ids).toContain("docs");
  });

  it("are the docs alone in the public export: no map, no pricing", () => {
    const items = barItems("fr", "docs/shop", "Explorer", true);
    expect(items.map((i) => i.id)).toEqual(["docs"]);
    expect(items[0]?.active).toBe(true);
    expect(items[0]?.href).toBe("/fr/docs");
  });
});
