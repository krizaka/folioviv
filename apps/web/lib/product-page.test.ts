import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import en from "@/messages/en.json";
import fr from "@/messages/fr.json";

import { overBudget, parseTemplate, PRODUCT_PAGE, reportLines, sceneMedia } from "./product-page";

const WORDS = { en: en.landing.productPage, fr: fr.landing.productPage } as const;

describe("product page template (krizaka-internal#4636, #4692)", () => {
  it("shows the scenes the media registry lists for its role, each with a recording", () => {
    const scenes = sceneMedia();
    expect(scenes.length).toBeGreaterThanOrEqual(2);
    for (const s of scenes) {
      expect(s.poster).toMatch(/^https:/);
      expect(s.webm || s.mp4).toBeTruthy();
    }
  });

  it("has words for every scene it can show, in both languages", () => {
    for (const locale of ["en", "fr"] as const) {
      const scenes: Record<string, unknown> = WORDS[locale].scenes;
      for (const s of sceneMedia()) {
        expect(scenes[s.id], `${locale}:${s.id}`).toBeDefined();
      }
    }
  });

  it("has words for every limit it lists, in both languages", () => {
    for (const locale of ["en", "fr"] as const) {
      const items: Record<string, unknown> = WORDS[locale].limits.items;
      for (const id of PRODUCT_PAGE.limits) expect(items[id], `${locale}:${id}`).toBeTruthy();
    }
  });

  it("keeps every section within its text budget", () => {
    expect(overBudget(WORDS.fr, PRODUCT_PAGE.budget)).toEqual([]);
    expect(overBudget(WORDS.en, PRODUCT_PAGE.budget)).toEqual([]);
  });

  it("names a section that goes over its budget", () => {
    const long = { ...WORDS.fr, hero: { ...WORDS.fr.hero, title: "un deux trois quatre cinq six sept huit neuf dix" } };
    expect(overBudget(long, PRODUCT_PAGE.budget)).toContain("hero.title");
  });

  it("marks the one report line the template says", () => {
    const lines = reportLines(["a", "b", "c"], 1);
    expect(lines.filter((l) => l.flagged).map((l) => l.text)).toEqual(["b"]);
  });

  it("refuses a template without a limit", () => {
    expect(() => parseTemplate({ ...PRODUCT_PAGE, limits: [] })).toThrow();
  });

  it("types no product name where the page is built: the template draws, the data says", () => {
    const files = [join(__dirname, "product-page-data.ts"), join(__dirname, "..", "app", "[locale]", "page.tsx")];
    for (const file of files) {
      expect(readFileSync(file, "utf8"), file).not.toMatch(/Verikora|Sovkora|Folioviv/);
    }
  });

  it("speaks with « vous », promises no date, no compliance and no transmission, and says the merchant files", () => {
    expect(JSON.stringify(fr.landing.productPage)).not.toMatch(/\b(tu|ton|ta|tes|toi|rentres)\b/i);
    for (const w of Object.values(WORDS)) {
      expect(JSON.stringify(w)).not.toMatch(
        /bientôt|soon|prochainement|coming|conforme|compliant|au cent près|to the cent|open source/i,
      );
    }
    expect(WORDS.fr.about).toMatch(/dépose lui-même/);
    expect(WORDS.en.about).toMatch(/files/);
  });
});
