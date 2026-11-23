import { org } from "@krizaka/org";
import { footerSettingsProblems } from "@krizaka/ui/site-footer";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { LOCALES } from "@/lib/i18n";
import { PUBLIC_ROUTES } from "@/lib/public-build/routes.mjs";
import { PUBLIC_FOOTER, publicFooter, type PublicFooterData } from "@/lib/public-footer";

import { SiteFooter } from "./SiteFooter";

const internal = (href: string) => href.startsWith("/");

describe("the public export's footer, from data (krizaka-internal#4636)", () => {
  it.each(LOCALES)("%s: every internal link is a page the export holds", (locale) => {
    const config = publicFooter(locale);
    const links = [...config.columns.flatMap((c) => c.links), ...config.legal.links];
    expect(links.length).toBeGreaterThan(0);
    for (const l of links.filter((l) => internal(l.href))) {
      expect(PUBLIC_ROUTES, l.href).toContain(l.href);
    }
  });

  it("a page the export does not hold is dropped, and a column left empty with it", () => {
    const footer: PublicFooterData = {
      ...PUBLIC_FOOTER,
      columns: [
        {
          id: "a",
          titleKey: "chrome.footerColumns.product",
          links: [{ labelKey: "download.title", page: "download" }],
        },
        { id: "b", titleKey: "chrome.footerColumns.legal", links: [{ labelKey: "chrome.terms", page: "terms" }] },
        {
          id: "c",
          titleKey: "chrome.footerColumns.product",
          links: [{ labelKey: "chrome.menu.docs.title", page: "docs" }],
        },
      ],
    };
    const config = publicFooter("fr", footer);
    expect(config.columns.map((c) => c.id)).toEqual(["c"]);
    expect(config.columns[0]?.links.map((l) => l.href)).toEqual(["/fr/docs"]);
  });

  it("a column added to the data shows with no code change", () => {
    const footer: PublicFooterData = {
      ...PUBLIC_FOOTER,
      columns: [
        ...PUBLIC_FOOTER.columns,
        { id: "more", titleKey: "chrome.footerColumns.legal", links: [{ labelKey: "chrome.legal", page: "privacy" }] },
      ],
    };
    expect(publicFooter("en", footer).columns.map((c) => c.id)).toContain("more");
  });

  it("the legal line is the publisher's identity from @krizaka/org, never typed, and shows no version", () => {
    const config = publicFooter("fr");
    expect(config.legal.legalName).toBe(org.company.legalName);
    expect(config.legal.neq).toBe(org.company.neq);
    expect(config.legal.city).toBe(org.company.city);
    expect(config.legal.showVersion).toBe(false);
  });

  it("the data passes the footer rules of @krizaka/ui (no duplicate, no empty column, no development address)", () => {
    for (const locale of LOCALES) {
      const config = publicFooter(locale);
      const settings = {
        labelKey: "x",
        columns: config.columns.map((c) => ({
          id: c.id,
          titleKey: c.title,
          links: c.links.map((l) => ({ label: l.label, href: l.href })),
        })),
        legal: { ...config.legal, links: config.legal.links.map((l) => ({ label: l.label, href: l.href })) },
      };
      expect(footerSettingsProblems(settings)).toEqual([]);
    }
  });

  it.each(LOCALES)("%s: renders without a version, a sign-in, a download, pricing or terms", (locale) => {
    const html = renderToStaticMarkup(<SiteFooter locale={locale} />);
    expect(html).not.toMatch(/v\d+\.\d+\.\d+/);
    expect(html).not.toMatch(/\/(download|terms|pricing|sign-in|login)\b/);
    expect(html).toContain(org.company.legalName);
  });
});
