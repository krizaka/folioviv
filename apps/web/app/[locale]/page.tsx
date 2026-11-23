import "@krizaka/ui/product-page.css";

import { ProductPage } from "@krizaka/ui/product-page";
import type { Metadata } from "next";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { publicBuild } from "@/lib/build-target";
import { jsonLdHtml } from "@/lib/csp";
import { heroSignedIn } from "@/lib/hero-session";
import { homeStatus } from "@/lib/home-status";
import { asLocale, getDictionary, type Locale } from "@/lib/i18n";
import { DEMO_SHOP, heroActions } from "@/lib/landing";
import { homePageData, type ProductPageLinks } from "@/lib/product-page-data";
import { pageMetadata, siteJsonLd } from "@/lib/seo";
import { contactHref } from "@/lib/site";
import { shopHref } from "@/lib/shop-links";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  return pageMetadata(asLocale((await params).locale), "home");
}

/**
 * The ways in. The public export has no demo shop and no sign-in to point at: it writes to us, and shows the example report.
 * The app's home follows the session (rendered on the server: no flash of the signed-out action).
 */
async function pageLinks(locale: Locale): Promise<ProductPageLinks> {
  const d = getDictionary(locale).landing;
  const contact = { href: contactHref("home", locale), label: d.productPage.hero.contact };
  if (publicBuild) {
    return { primary: contact, secondary: { href: "#proof", label: d.productPage.hero.sample }, closing: contact };
  }
  const { primary, secondary } = heroActions(locale, await heroSignedIn(), shopHref(DEMO_SHOP, locale));
  const way = (a: { href: string; message: keyof typeof d.actions }) => ({ href: a.href, label: d.actions[a.message] });
  return { primary: way(primary), ...(secondary && { secondary: way(secondary) }), closing: contact };
}

/**
 * The home is `ProductPage` of @krizaka/ui (krizaka-internal#4636, design #4692): the promise beside an example report, the
 * recordings the media registry lists, what it does not do, one way in. The page holds no words and no product's name:
 * `homePageData` builds the template's data from the catalogue and the registry. The company's status sentence closes the page.
 */
export default async function Home({ params }: Readonly<{ params: Promise<{ locale: string }> }>) {
  const locale = asLocale((await params).locale);
  const d = getDictionary(locale).landing;
  const data = homePageData(locale, await pageLinks(locale));
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(siteJsonLd(locale)) }} />
      <SiteHeader locale={locale} current="home" />
      <main id="content" data-landing>
        <ProductPage data={data} />
        <p
          className="mx-auto m-0 max-w-[60ch] px-4 pt-8 text-center text-base text-fg-secondary"
          data-testid="scope-line"
        >
          {d.productPage.about}
        </p>
        <p
          className="mx-auto m-0 max-w-[60ch] px-4 pb-8 pt-2 text-center text-sm text-fg-secondary"
          data-testid="hero-status"
        >
          {d.status[homeStatus()]}
        </p>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
