import { DEMO_SHOPS, publicShop, publishedShopPage, seedDemoShops } from "@folioviv/db";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { ShopPageView } from "@/components/shop/ShopPageView";
import { db, migrate, pool } from "@/lib/db";
import { resolveDefaults } from "@/lib/default-media";
import { proposedDefaults } from "@/lib/default-media-settings";
import { buildStorefront } from "@/lib/storefront";

/**
 * krizaka-internal#3743: the public page of a showcase demo shop (Encre Vive, a workshop) renders no « Images du métier » block and none of the
 * trade's proposed workshop images, because the seed turns `use_defaults` off. Real PostgreSQL (DATABASE_IT=1).
 */
const enabled = process.env.DATABASE_IT === "1" && !!process.env.DATABASE_URL;

describe.runIf(enabled)("Encre Vive's rendered page", () => {
  beforeAll(async () => {
    vi.stubEnv("REALTIME_BUS", "memory");
    await migrate();
    await seedDemoShops(db());
  });
  afterAll(async () => {
    vi.unstubAllEnvs();
    await pool().end();
  });

  const render = async (locale: "fr" | "en") => {
    const page = (await publicShop(db(), "encre-vive"))!;
    const defaults = await proposedDefaults(page);
    const view = buildStorefront({ page, locale, now: new Date("2026-11-15T15:00:00Z"), defaults });
    const { page: document } = await publishedShopPage(db(), page.shop.id);
    return {
      defaults,
      html: renderToStaticMarkup(<ShopPageView page={document} view={view} locale={locale} today="2026-11-15" />),
    };
  };

  it("offers no proposed image, shows no « Images du métier » and none of the workshop default URLs", async () => {
    expect(DEMO_SHOPS.map((d) => d.shop.slug)).toContain("encre-vive");
    const fr = await render("fr");
    expect(fr.defaults).toBeUndefined();
    expect(fr.html).not.toContain("Images du métier");
    const urls = [...resolveDefaults("workshop").gallery, ...resolveDefaults("workshop").service].map((i) => i.src);
    for (const url of urls) expect(fr.html).not.toContain(url);
    expect((await render("en")).html).not.toContain("Pictures of the trade");
  });
});
