import { ThemeProvider } from "@krizaka/ui/theme";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SiteHeader } from "@/components/SiteHeader";

// krizaka-internal#4137: on a shop's own origin the app's pages are another origin; the router prefetches only same-origin links, so the bar's
// links there are absolute (and cost the shop pages' JavaScript nothing): the CSP `connect-src 'self'` has nothing to refuse.
describe("SiteHeader on a shop's own origin", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("links the app's pages by their absolute address once the shop domain is declared", () => {
    vi.stubEnv("APP_SHOP_DOMAIN", "folioviv.shop");
    vi.stubEnv("APP_PUBLIC_URL", "https://dev.folioviv.com");
    const html = renderToStaticMarkup(
      <ThemeProvider defaultMode="dark">
        <SiteHeader locale="fr" current="home" anonymous offOrigin />
      </ThemeProvider>,
    );
    for (const path of ["/fr/explore", "/fr/pricing", "/fr/docs", "/fr/sign-in"]) {
      expect(html, path).toContain(`href="https://dev.folioviv.com${path}"`);
    }
  });

  it("keeps the app's own pages relative", () => {
    vi.stubEnv("APP_SHOP_DOMAIN", "folioviv.shop");
    vi.stubEnv("APP_PUBLIC_URL", "https://dev.folioviv.com");
    const html = renderToStaticMarkup(
      <ThemeProvider defaultMode="dark">
        <SiteHeader locale="fr" current="home" anonymous />
      </ThemeProvider>,
    );
    expect(html).toContain('href="/fr/pricing"');
    expect(html).not.toContain("https://dev.folioviv.com/fr");
  });
});
