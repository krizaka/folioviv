import { describe, expect, it } from "vitest";

import { crawl, DEMO_SHOPS, readableText, retiredNamesIn, shopUrl } from "./check-retired-names.mjs";

describe("no retired name on a demo page (krizaka-internal#3743)", () => {
  it("refuses the old name in a bio, whatever its case", () => {
    expect(retiredNamesIn("<p>Boutique de démonstration d'Akinaza.</p>")).toEqual(["Akinaza"]);
    expect(retiredNamesIn("<p>AKINAZA</p>")).toEqual(["Akinaza"]);
  });

  it("refuses it in an alt, a title, an aria-label or a meta content", () => {
    expect(retiredNamesIn('<img alt="Logo Akinaza" src="/a.webp">')).toEqual(["Akinaza"]);
    expect(retiredNamesIn('<meta name="description" content="Akinaza">')).toEqual(["Akinaza"]);
    expect(retiredNamesIn('<a aria-label="Akinaza" href="/">x</a>')).toEqual(["Akinaza"]);
  });

  it("does not read an address, a script or a comment", () => {
    expect(retiredNamesIn('<img src="https://cdn.example/sites/akinaza/demo/a.webp" alt="Un salon">')).toEqual([]);
    expect(retiredNamesIn('<script>var x = "Akinaza"</script><style>.akinaza{}</style>')).toEqual([]);
    expect(retiredNamesIn("<!-- Akinaza --><p>Folioviv</p>")).toEqual([]);
  });

  it("passes a page that says Folioviv", () => {
    expect(retiredNamesIn("<p>Boutique de démonstration de Folioviv.</p>")).toEqual([]);
    expect(readableText('<p title="Folioviv">Bonjour</p>')).toContain("Bonjour");
  });

  it("crawls every demo shop in both languages and lists each page that fails", async () => {
    const seen = [];
    const fetcher = async (url) => {
      seen.push(url);
      const bad = url.startsWith("https://encre-vive.") && url.endsWith("/fr");
      return { ok: true, status: 200, text: async () => (bad ? "<p>d'Akinaza</p>" : "<p>Folioviv</p>") };
    };
    const problems = await crawl({ shopHost: "folioviv.shop", fetcher });
    expect(seen).toHaveLength(DEMO_SHOPS.length * 2);
    expect(seen).toContain(shopUrl("cedre-ciseaux", "en", "folioviv.shop"));
    expect(problems).toEqual(["https://encre-vive.folioviv.shop/fr: carries « Akinaza »"]);
  });

  it("reports a page that does not answer", async () => {
    const fetcher = async () => ({ ok: false, status: 404, text: async () => "" });
    expect((await crawl({ shopHost: "folioviv.shop", fetcher })).length).toBe(DEMO_SHOPS.length * 2);
  });
});
