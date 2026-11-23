import { ForwardIcon } from "@krizaka/icons";
import { Button } from "@krizaka/ui/button";
import { LandingPage } from "@krizaka/ui/landing-page";
import { Section } from "@krizaka/ui/page";
import type { Metadata } from "next";
import { preconnect } from "react-dom";

import { HeroPhone } from "@/components/home/HeroPhone";
import { NeighbourhoodFeed } from "@/components/home/NeighbourhoodFeed";
import { BookPreview } from "@/components/home/previews/BookPreview";
import { BooksPreview } from "@/components/home/previews/BooksPreview";
import { InvoicePreview } from "@/components/home/previews/InvoicePreview";
import { SectionMedia } from "@/components/media/SectionMedia";
import { OriginLink } from "@/components/OriginLink";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { publicBuild } from "@/lib/build-target";
import { jsonLdHtml } from "@/lib/csp";
import { heroSignedIn } from "@/lib/hero-session";
import { homeFeed } from "@/lib/home-feed";
import { homeStatus } from "@/lib/home-status";
import { asLocale, getDictionary } from "@/lib/i18n";
import { DEMO_SHOP, heroActions, SCREENS } from "@/lib/landing";
import { pageMetadata, siteJsonLd } from "@/lib/seo";
import { preconnectShop, shopHref } from "@/lib/shop-links";
import { heroTake, MEDIA_CDN } from "@/lib/tour";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  return pageMetadata(asLocale((await params).locale), "home");
}

/**
 * The home, short: the promise beside the real app on a phone, the three jobs on real screens (a booking, an invoice, the
 * quarter's books), the founder offer once it is live, one way in, a quiet line of trust. The tax return is prepared, never filed.
 */
export default async function Home({ params }: Readonly<{ params: Promise<{ locale: string }> }>) {
  const locale = asLocale((await params).locale);
  const d = getDictionary(locale).landing;
  const status = homeStatus();
  // The storefront still is the page's LCP: open the CDN's connection now and fetch it at once (React hoists the link into <head>).
  preconnect(MEDIA_CDN);
  // The demo shop is a page of the app: the public export has none.
  if (!publicBuild) {
    preconnectShop(DEMO_SHOP);
  }
  // The hero's action follows the session, rendered on the server: no flash of the signed-out action.
  const feed = await homeFeed(locale);
  // The public export has no demo shop and no sign-in to point at: no action, only the scope line.
  const hero = publicBuild ? null : heroActions(locale, await heroSignedIn(), shopHref(DEMO_SHOP, locale));
  // The three jobs are the real components of the app, drawn with demo data (folioviv#470): below the fold, never the LCP.
  const previews = {
    book: <BookPreview locale={locale} />,
    invoice: <InvoicePreview locale={locale} />,
    books: <BooksPreview locale={locale} />,
  };
  return (
    <>
      <link rel="preload" as="image" href={heroTake(locale).poster} fetchPriority="high" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(siteJsonLd(locale)) }} />
      <SiteHeader locale={locale} current="home" />
      <main id="content">
        <LandingPage
          id="hero"
          title={d.title}
          lead={d.lead}
          visualLabel={d.visualLabel}
          visual={<HeroPhone locale={locale} />}
          actions={
            <>
              {hero ? (
                <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                  <Button asChild variant="primary" size="lg" className="w-full sm:w-auto">
                    <OriginLink href={hero.primary.href}>
                      {d.actions[hero.primary.message]} <ForwardIcon size={16} strokeWidth={2.25} />
                    </OriginLink>
                  </Button>
                  {hero.secondary ? (
                    <Button asChild variant="secondary" size="lg" className="w-full sm:w-auto">
                      <OriginLink href={hero.secondary.href}>{d.actions[hero.secondary.message]}</OriginLink>
                    </Button>
                  ) : null}
                </div>
              ) : null}
              {/* What the product is not for protects the product's claims: under the hero's actions, at a readable size (folioviv#440). */}
              <p className="m-0 mt-4 max-w-prose text-base text-fg-secondary" data-testid="scope-line">
                {d.trust.scope}
              </p>
            </>
          }
          featuresHeading={{ title: d.screensTitle }}
          features={SCREENS.map(({ id }) => ({
            id,
            icon: null,
            title: d.screens[id].title,
            text: d.screens[id].text,
            visual: previews[id],
          }))}
        >
          {feed.flyers.length > 0 && (
            <Section
              id="neighbourhood"
              spacing="sm"
              title={d.feed.title}
              lead={d.feed.lead}
              actions={
                <Button asChild variant="secondary" size="md">
                  <OriginLink href={shopHref(DEMO_SHOP, locale)}>{d.feed.demo}</OriginLink>
                </Button>
              }
            >
              <NeighbourhoodFeed
                initial={feed}
                locale={locale}
                words={{
                  filterLabel: d.feed.filterLabel,
                  all: d.feed.all,
                  boardLabel: d.feed.boardLabel,
                  visit: d.feed.visit,
                  empty: d.feed.empty,
                  error: d.feed.error,
                }}
              />
            </Section>
          )}
          {/* The page a client books from, shown by the recording the media registry gives this role (content/media-registry.json). */}
          <Section id="storefront" spacing="sm" title={d.storefront.title} lead={d.storefront.lead}>
            <SectionMedia page="home" role="storefront" locale={locale} />
          </Section>
          <Section id="limits" spacing="sm" title={d.limits.title} divider>
            <ul className="m-0 flex max-w-[70ch] list-disc flex-col gap-2 pl-5 text-fg-secondary" data-testid="limits">
              {d.limits.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Section>
          <Section id="trust" spacing="sm">
            <p className="m-0 text-sm text-fg-muted" data-testid="trust-line">
              {d.trust.line}
            </p>
            <p className="m-0 mt-1 text-sm text-fg-muted">{d.status[status]}</p>
          </Section>
        </LandingPage>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
