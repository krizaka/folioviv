import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const seen: { href: string; prefetch: unknown }[] = [];
vi.mock("next/link", () => ({
  default: ({ href, prefetch, children }: { href: string; prefetch?: unknown; children?: unknown }) => {
    seen.push({ href, prefetch });
    return <a href={href}>{children as never}</a>;
  },
}));

import { SiteFooter } from "@/components/SiteFooter";

// krizaka-internal#4137: on a shop's own origin the app's pages (/fr/pricing, /fr/docs…) are another origin: a router prefetch of them
// breaks the CSP `connect-src 'self'`. The shop pages' footer says so (`offOrigin`) and its links do not prefetch; the app's own pages keep it.
describe("SiteFooter prefetch", () => {
  beforeEach(() => {
    seen.length = 0;
  });
  it("does not prefetch the app's pages from a shop's own origin", () => {
    renderToStaticMarkup(<SiteFooter locale="fr" offOrigin />);
    const app = seen.filter((l) => /^\/fr\/(pricing|docs|privacy|terms|download)/.test(l.href));
    expect(app.length).toBeGreaterThan(0);
    for (const l of app) expect(l.prefetch, l.href).toBe(false);
  });
  it("keeps the router's default on the app's own pages", () => {
    renderToStaticMarkup(<SiteFooter locale="fr" />);
    for (const l of seen) expect(l.prefetch, l.href).toBeUndefined();
  });
});
