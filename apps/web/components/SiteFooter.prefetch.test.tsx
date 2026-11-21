import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routed: string[] = [];
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children?: unknown }) => {
    routed.push(href);
    return <a href={href}>{children as never}</a>;
  },
}));

import { SiteFooter } from "@/components/SiteFooter";

// krizaka-internal#4137: on a shop's own origin the app's pages (/fr/pricing, /fr/docs…) are another origin: a router prefetch of them
// breaks the CSP `connect-src 'self'`. The shop pages' footer says so (`offOrigin`) and draws them as plain anchors; the app's own pages keep the router.
describe("SiteFooter links", () => {
  beforeEach(() => {
    routed.length = 0;
  });
  it("draws no router link from a shop's own origin", () => {
    const html = renderToStaticMarkup(<SiteFooter locale="fr" offOrigin />);
    expect(html).toContain('href="/fr/pricing"');
    expect(routed).toEqual([]);
  });
  it("keeps the router on the app's own pages, never for the /s/<slug> hop", () => {
    renderToStaticMarkup(<SiteFooter locale="fr" />);
    expect(routed).toContain("/fr/pricing");
    expect(routed.some((h) => h.includes("/s/"))).toBe(false);
  });
});
