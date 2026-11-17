import { describe, expect, it } from "vitest";

import { llmsText, siteJsonLd } from "./seo";
import { LICENSE_URL } from "./site";

// krizaka-internal#4148: the product names its own licence (FSL-1.1-ALv2), never Apache-2.0 or « open source ».
describe("the product names its own licence", () => {
  it("llms.txt says FSL-1.1-ALv2 with a link to LICENSE.md and no open-source claim", () => {
    const text = llmsText();
    expect(text).toContain("FSL-1.1-ALv2");
    expect(text).toContain(LICENSE_URL);
    expect(text).not.toMatch(/Apache|\bMIT\b|open[- ]source|\blibre\b/i);
  });

  it.each(["en", "fr"] as const)("%s: the JSON-LD licence is the product's LICENSE.md", (locale) => {
    const json = JSON.stringify(siteJsonLd(locale));
    expect(json).toContain(`"license":"${LICENSE_URL}"`);
    expect(json).not.toMatch(/apache/i);
  });
});
