import { ThemeProvider } from "@krizaka/ui/theme";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push() {}, replace() {}, refresh() {}, prefetch() {} }),
  usePathname: () => "/fr",
}));
vi.mock("@/lib/hero-session", () => ({ heroSignedIn: async () => false }));

import Home from "@/app/[locale]/page";
import { sceneMedia } from "@/lib/product-page";
import en from "@/messages/site/en.json";
import fr from "@/messages/site/fr.json";

const text = (s: string) => s.replace(/'/g, "&#x27;");

describe("the home, rendered (the product page template, krizaka-internal#4636)", async () => {
  const render = async (locale: "en" | "fr") =>
    renderToStaticMarkup(<ThemeProvider>{await Home({ params: Promise.resolve({ locale }) })}</ThemeProvider>);
  const pages = { en: await render("en"), fr: await render("fr") };

  it("draws the template: the promise, the example report, the recordings, the limits, one way in", () => {
    for (const html of Object.values(pages)) {
      expect(html).toContain("kz-pp-hero");
      expect(html).toContain("kz-pp-limits");
      expect(html).toContain("kz-pp-closing");
      expect(html).toContain('id="proof"');
      expect(html).toContain('id="what"');
    }
  });

  it("shows every recording the media registry lists for the scene role, with no code change", () => {
    for (const html of Object.values(pages)) {
      for (const scene of sceneMedia()) expect(html).toContain(scene.poster);
    }
  });

  it("says what it does not do, and that the merchant files, in each language", () => {
    expect(pages.en).toContain(text(en.productPage.limits.items.taxes));
    expect(pages.fr).toContain(text(fr.productPage.limits.items.taxes));
    expect(pages.fr).toContain(text(fr.productPage.about));
    expect(pages.en).toContain(text(en.productPage.about));
  });

  it("keeps the company's status sentence, no date promise, no tutoiement", () => {
    for (const html of Object.values(pages)) {
      expect(html).not.toMatch(/bientôt|soon|prochainement|coming/i);
    }
    expect(pages.fr).not.toMatch(/rentres à l|\btu\b/i);
  });
});
