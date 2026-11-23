import { SiteFooter as FamilyFooter, SiteFooterColumn, SiteFooterLink } from "@krizaka/ui/site-footer";
import type { ReactNode } from "react";

import { OriginLink } from "@/components/OriginLink";
import { BRAND_ID } from "@/lib/brand-id";
import { downloadPageOpen } from "@/lib/downloads";
import { productFooterLabels } from "@/lib/footer-labels";
import { format, getDictionary, type Locale, translator } from "@/lib/i18n";
import { indexable } from "@/lib/indexing";
import { DEMO_SHOP } from "@/lib/landing";
import { uiVersion } from "@/lib/platform";
import { shopHref } from "@/lib/shop-links";
import { APP_VERSION, contactHref, LICENSE_URL, pagePath, REPO_URL } from "@/lib/site";

/** A link to one of the product's own pages: `OriginLink` decides, by the page's origin, whether the router carries it (krizaka-internal#4137). */
function PageLink({ href, offOrigin, children }: Readonly<{ href: string; offOrigin: boolean; children: ReactNode }>) {
  return (
    <SiteFooterLink asChild>
      <OriginLink href={href} offOrigin={offOrigin}>
        {children}
      </OriginLink>
    </SiteFooterLink>
  );
}

/**
 * The footer is @krizaka/ui's SiteFooter in product mode (`family={false}`): the product's pages, its source and contact,
 * the publisher line « A Krizaka product » (→ www.krizaka.com), DEV · the version, Montréal. On a deployment kept out of
 * search engines the invitation line ends the signature row — one footer, no strip under it.
 */
// ui-allow: the product footer: it composes the library SiteFooter (imported as FamilyFooter) with this product's columns, no copy of it
export function SiteFooter({
  locale,
  offOrigin = false,
}: Readonly<{
  locale: Locale;
  /** The page is a shop's own origin: the app's pages are another origin, no router link (the CSP `connect-src 'self'`). */ offOrigin?: boolean;
}>) {
  const t = translator(locale);
  return (
    <FamilyFooter
      current={BRAND_ID}
      family={false}
      labels={productFooterLabels(locale)}
      aria-label={t("chrome.footerLabel")}
      env={indexable() ? undefined : "DEV"}
      data-testid="app-version"
      legal={
        <>
          <span>
            {format(getDictionary(locale).chrome.version, { version: APP_VERSION })}
            {uiVersion() ? ` · Krizaka UI ${uiVersion()}` : ""}
          </span>
          {indexable() ? null : <span data-testid="dev-notice">{t("chrome.devNotice")}</span>}
        </>
      }
    >
      <SiteFooterColumn title={t("chrome.footerColumns.product")}>
        <SiteFooterLink asChild>
          <OriginLink href={shopHref(DEMO_SHOP, locale)}>{t("chrome.menu.shop.title")}</OriginLink>
        </SiteFooterLink>
        <PageLink href={pagePath(locale, "pricing")} offOrigin={offOrigin}>
          {t("chrome.menu.pricing.title")}
        </PageLink>
        {downloadPageOpen() ? (
          <PageLink href={pagePath(locale, "download")} offOrigin={offOrigin}>
            {t("download.title")}
          </PageLink>
        ) : null}
        <PageLink href={pagePath(locale, "docs")} offOrigin={offOrigin}>
          {t("chrome.menu.docs.title")}
        </PageLink>
      </SiteFooterColumn>
      <SiteFooterColumn title={t("chrome.footerColumns.legal")}>
        <PageLink href={pagePath(locale, "privacy")} offOrigin={offOrigin}>
          {t("chrome.legal")}
        </PageLink>
        <PageLink href={pagePath(locale, "terms")} offOrigin={offOrigin}>
          {t("chrome.terms")}
        </PageLink>
      </SiteFooterColumn>
      <SiteFooterColumn title="Krizaka">
        <SiteFooterLink href={REPO_URL}>{t("chrome.sourceCode")}</SiteFooterLink>
        <SiteFooterLink href={LICENSE_URL}>{t("chrome.license")}</SiteFooterLink>
        <SiteFooterLink href={contactHref("dev-folioviv-footer", locale)}>{t("chrome.contact")}</SiteFooterLink>
      </SiteFooterColumn>
    </FamilyFooter>
  );
}
