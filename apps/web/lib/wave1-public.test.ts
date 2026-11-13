import { readFileSync } from "node:fs";
import { join } from "node:path";

import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { generateMetadata } from "@/app/[locale]/layout";
import robots from "@/app/robots";
import { bindProduct } from "@/lib/brand";
import enRaw from "@/messages/en.json";
import frRaw from "@/messages/fr.json";

import { proxy } from "../proxy";
import { indexableOn } from "./indexing";
import { HOME_SECTIONS, productStatus } from "./landing";
import { llmsText } from "./seo";
import { contactHref } from "./site";

/** Wave 1 of the public-pages meeting (2026-11-05, krizaka-internal#2630): the paused Folioviv site is closed to search engines, shows no price and says one status. */

const en = bindProduct(enRaw);
const fr = bindProduct(frRaw);
const ROOT = join(__dirname, "..");
const read = (path: string) => readFileSync(join(ROOT, path), "utf8");
const words = (node: unknown): string[] => {
  if (typeof node === "string") {
    return [node];
  }
  if (node && typeof node === "object") {
    return Object.values(node).flatMap(words);
  }
  return [];
};

// The fonts are `next/font/local` calls, resolved by the Next compiler only.
vi.mock("@/lib/shop-fonts", () => ({ shopSans: { variable: "" }, shopDisplay: { variable: "" } }));
vi.mock("./shop-directory", async (original) => ({
  ...(await original<typeof import("./shop-directory")>()),
  shopVerdict: vi.fn(async () => ({ kind: "shop" })),
  customHostVerdict: vi.fn(async () => ({ kind: "none" })),
}));

beforeEach(() => vi.stubEnv("APP_ALLOWED_HOSTS", "www.folioviv.com,dev.folioviv.com"));
afterEach(() => vi.unstubAllEnvs());

/** The closed state keys on today's configuration (APP_SEARCH_INDEXING explicitly on AND the host of APP_PUBLIC_URL), never on a typed host. */
describe("the site is closed to search engines unless the configuration explicitly opens it", () => {
  const CLOSED = [{}, { APP_SEARCH_INDEXING: "off" }, { APP_SEARCH_INDEXING: "" }];
  const www = (path: string) =>
    proxy(new NextRequest(`https://www.folioviv.com${path}`, { headers: { host: "www.folioviv.com" } }));
  const configure = (setting: string | undefined) => {
    vi.stubEnv("APP_PUBLIC_URL", "https://www.folioviv.com");
    vi.stubEnv("APP_DEV_HOST", "dev.folioviv.com");
    vi.stubEnv("APP_SEARCH_INDEXING", setting ?? "");
  };

  it("indexableOn: open only when on AND the public host; dev hosts never", () => {
    for (const env of CLOSED) {
      expect(indexableOn("www.folioviv.com", env)).toBe(false);
    }
    const on = {
      APP_SEARCH_INDEXING: "on",
      APP_PUBLIC_URL: "https://www.folioviv.com",
      APP_DEV_HOST: "dev.folioviv.com",
    };
    expect(indexableOn("www.folioviv.com", on)).toBe(true);
    expect(indexableOn("admin.folioviv.com", on)).toBe(false);
    expect(indexableOn("dev.folioviv.com", on)).toBe(false);
  });

  it("no setting, or off: every answer on the public host says noindex and robots.txt disallows everything", async () => {
    for (const setting of [undefined, "off"]) {
      configure(setting);
      for (const path of ["/fr", "/en", "/fr/pricing", "/en/sign-in", "/api/healthz"]) {
        expect(`${setting} ${path} ${(await www(path)).headers.get("x-robots-tag")}`).toBe(
          `${setting} ${path} noindex, nofollow`,
        );
      }
      const res = await www("/robots.txt");
      expect(res.headers.get("x-robots-tag")).toBe("noindex, nofollow");
      expect(await res.text()).toMatch(/^User-agent: \*\nDisallow: \/\n/);
    }
  });

  it("explicitly on: the public host is open, the dev host stays closed", async () => {
    configure("on");
    expect((await www("/en")).headers.get("x-robots-tag")).toBeNull();
    expect(
      (
        await proxy(new NextRequest("https://dev.folioviv.com/api/healthz", { headers: { host: "dev.folioviv.com" } }))
      ).headers.get("x-robots-tag"),
    ).toBe("noindex, nofollow");
  });

  it("robots.ts (the file the build writes) disallows everything for every crawler unless on", () => {
    for (const setting of [undefined, "off"]) {
      configure(setting);
      const r = robots();
      const rules = Array.isArray(r.rules) ? r.rules : [r.rules];
      expect(rules.length).toBeGreaterThan(0);
      for (const rule of rules) {
        expect(rule.disallow).toBe("/");
        expect(rule.allow).toBeUndefined();
      }
    }
    configure("on");
    expect(JSON.stringify(robots())).toContain('"allow":"/"');
  });

  it("the pages say noindex in their <head> (the locale layout) unless on", async () => {
    for (const setting of [undefined, "off"]) {
      configure(setting);
      for (const locale of ["fr", "en"]) {
        const meta = await generateMetadata({ params: Promise.resolve({ locale }) });
        expect(meta.robots).toMatchObject({ index: false, follow: false });
      }
    }
    configure("on");
    expect((await generateMetadata({ params: Promise.resolve({ locale: "en" }) })).robots).toBeUndefined();
  });
});

describe("no price anywhere public: the pages that show a price are gone from the public face", () => {
  it("the home does not mount the founder offer and has no offer section", () => {
    expect(read("app/[locale]/page.tsx")).not.toMatch(/FounderOffer|price-catalogue|founder-offer/);
    expect(HOME_SECTIONS).toEqual(["hero", "screens", "trust"]);
  });

  it("the public pricing page reads no catalogue and no plan: it says access is by invitation", () => {
    const page = read("app/[locale]/pricing/page.tsx");
    expect(page).not.toMatch(/price-catalogue|pricing-view|founder-offer|PricingPage|billing/);
    expect(page).toContain("contactHref");
    for (const m of [fr, en]) {
      expect(m.pricing.access.title).toBeTruthy();
      expect(m.pricing.access.cta).toBeTruthy();
    }
    expect(fr.pricing.access.lead).toBe("Accès sur invitation : écrivez-nous.");
    expect(en.pricing.access.lead).toBe("Access by invitation: write to us.");
  });

  it("no amount, no fee and no percentage in the words a visitor reads (home, pricing invitation, meta, terms, privacy, llms.txt)", () => {
    const AMOUNT =
      /\d[\d\s.,]*\s?\$|\$\s?\d|\b\d+\s?(CAD|USD)\b|par mois|per month|\/\s?mois|\/\s?month|cardRate|debitRate|debitCap|\{price\}/i;
    const FEES = /frais\b.*(carte|débit)|(card|debit).*\bfees?\b/i;
    for (const m of [fr, en]) {
      // The founder offer's words wait, unmounted, for the day the product resumes: the rest of the landing is what a visitor reads.
      const landing = Object.fromEntries(Object.entries(m.landing).filter(([key]) => key !== "founder"));
      for (const text of [...words(landing), ...words(m.pricing.access), ...words(m.meta)]) {
        expect(text).not.toMatch(AMOUNT);
        expect(text).not.toMatch(FEES);
      }
      // The terms still say who pays whom, but name no amount.
      for (const text of [...words(m.terms), ...words(m.privacy)]) {
        expect(text).not.toMatch(AMOUNT);
      }
    }
    expect(llmsText()).not.toMatch(/\d\s?\$|\$\s?\d/);
  });

  it("the terms point to no pricing page", () => {
    for (const m of [fr, en]) {
      expect(JSON.stringify(m.terms)).not.toMatch(/page des tarifs|pricing page/i);
    }
  });
});

describe("no code name in a public address either", () => {
  it("the contact link names the commercial product and site", () => {
    for (const locale of ["fr", "en"] as const) {
      expect(contactHref("folioviv-pricing", locale)).not.toMatch(/akinaza/i);
    }
  });
});

describe("one status, the same word everywhere: paused", () => {
  it("the product is paused, whatever its dev-preview checklist says", () => {
    expect(productStatus({ criteria: { a: { na: "x" }, b: { evidence: "https://x" } } })).toBe("paused");
    expect(productStatus({ criteria: { a: { evidence: null } } })).toBe("paused");
  });

  it("En pause / Paused", () => {
    expect(fr.landing.status.paused).toMatch(/^En pause/);
    expect(en.landing.status.paused).toMatch(/^Paused/);
  });
});

describe("the line is « taxes préparées », never « réglées »", () => {
  it("the title, the lead and the description", () => {
    expect(fr.landing.title).toBe("Vos rendez-vous et vos factures réglés, vos taxes préparées.");
    expect(en.landing.title).toBe("Your bookings and invoices sorted, your taxes prepared.");
    for (const text of [fr.landing.title, fr.landing.lead, fr.meta.description]) {
      expect(text).not.toMatch(/taxes?[^.]{0,20}réglé/i);
    }
    for (const text of [en.landing.title, en.landing.lead, en.meta.description]) {
      expect(text).not.toMatch(/taxes?,? sorted/i);
    }
    expect(fr.meta.description).toMatch(/taxes préparées/);
    expect(en.meta.description).toMatch(/taxes prepared/);
  });

  it("no code name in the words of the public face", () => {
    for (const m of [fr, en]) {
      for (const text of [...words(m.landing), ...words(m.meta), ...words(m.pricing.access)]) {
        expect(text).not.toMatch(/akinaza/i);
      }
    }
  });
});
