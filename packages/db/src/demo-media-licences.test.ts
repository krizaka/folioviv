import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DEMO_SHOPS } from "./demo-shops";

const root = join(__dirname, "..", "..", "..");
const rows = readFileSync(join(root, "docs", "demo-media-licences.md"), "utf8")
  .split("\n")
  .filter((l) => l.startsWith("| ") && !l.startsWith("| Shop") && !l.startsWith("| :--"))
  .map((l) =>
    l
      .split("|")
      .slice(1, -1)
      .map((c) => c.trim()),
  );

describe("the demo media licence register (krizaka-internal#3751)", () => {
  it("gives every photo its URL, author, licence, date, face and status", () => {
    expect(rows.length).toBeGreaterThanOrEqual(19);
    for (const [shop, slot, url, author, licence, date, face, status] of rows) {
      const where = `${shop} / ${slot}`;
      expect(shop && slot && author, where).toBeTruthy();
      expect(url, where).toMatch(/^https:\/\/unsplash\.com\/photos\/[\w-]+$/);
      expect(licence, where).toBe("Unsplash License");
      expect(date, where).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(["aucun", "à vérifier"], where).toContain(face);
      expect(["vérifié", "à vérifier"], where).toContain(status);
      // A photo is verified only once its face is: nobody is recognisable under a made-up first name.
      if (status === "vérifié") expect(face, where).toBe("aucun");
    }
  });

  it("covers each demo shop and never lists a duplicate photo", () => {
    const shops = new Set(rows.map((r) => r[0]));
    for (const demo of DEMO_SHOPS) expect(shops.has(demo.shop.slug), demo.shop.slug).toBe(true);
    expect(new Set(rows.map((r) => r[2])).size).toBe(rows.length);
  });

  // Ratchet toward « no b-cdn.net URL in the demo data »: the count only goes down, to 0 once the licensed set is in storage.
  it("does not add a Bunny address to the demo data", () => {
    const dir = join(root, "packages", "db", "src");
    const files = readdirSync(dir).filter((f) => /^demo-.*\.(json|ts)$/.test(f) && !f.endsWith(".test.ts"));
    const count = files.reduce((n, f) => n + (readFileSync(join(dir, f), "utf8").match(/b-cdn\.net/g)?.length ?? 0), 0);
    expect(count).toBeLessThanOrEqual(BUNNY_BASELINE);
  });
});

// @fixed: the number of Bunny addresses left in the demo data at the time of this guard; only ever lowered.
const BUNNY_BASELINE = 22;
