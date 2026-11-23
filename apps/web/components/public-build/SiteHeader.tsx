import { BrandLockup } from "@/components/BrandLockup";
import { SiteBar } from "@/components/SiteChrome";
import { type Locale, translator } from "@/lib/i18n";
import type { PageId } from "@/lib/site";

/**
 * The bar of the public export (krizaka-internal#4626): the same `SiteBar`, with no session island and no sign-in — a static page knows no
 * visitor. Swapped in for `components/SiteHeader` by an alias of next.config.public.mjs.
 */
export function SiteHeader({ locale, current }: Readonly<{ locale: Locale; current: PageId }>) {
  const t = translator(locale);
  const labels = {
    nav: t("chrome.navLabel"),
    brandHome: t("chrome.brandHome"),
    sourceCode: t("chrome.sourceCode"),
    theme: t("chrome.themeToggle"),
    language: t("chrome.languageLabel"),
    explore: t("chrome.explore"),
    menu: t("chrome.menu.label"),
    preferences: t("chrome.preferences"),
  };
  return (
    <SiteBar
      locale={locale}
      current={current}
      labels={labels}
      brand={<BrandLockup locale={locale} />}
      sessionBar={null}
      sessionPanel={null}
    />
  );
}
