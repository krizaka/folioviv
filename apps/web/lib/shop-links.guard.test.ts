import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { shopPageUrl } from "@/lib/shop-domain";

const read = (path: string) => readFileSync(join(__dirname, "..", path), "utf8");

// krizaka-internal#3945: a shop link on the app host (`/<locale>/s/<slug>`) is answered by a 308 to the shop's origin, and Next drops its prefetch.
// Our own links go to the shop's canonical origin directly.
describe("our own shop links skip the redirect hop", () => {
  for (const file of ["components/explore/ExploreView.tsx", "app/[locale]/page.tsx", "components/SiteFooter.tsx"]) {
    it(`${file} never links to /s/<slug> on the app host`, () => {
      const source = read(file);
      expect(source).not.toMatch(/\/s\/\$\{/);
      expect(source).toContain("shopHref");
    });
  }
  it("builds the shop's own origin once the shop domain is declared", () => {
    expect(shopPageUrl("pattes", "fr", { APP_SHOP_DOMAIN: "folioviv.shop", APP_PUBLIC_URL: "https://www.folioviv.com" })).toBe(
      "https://pattes.folioviv.shop/fr",
    );
  });
});
