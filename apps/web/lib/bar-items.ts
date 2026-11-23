import { publicBarLinks } from "@krizaka/ui/app-frame";

import { type Locale } from "@/lib/i18n";
import { type PageId, pagePath } from "@/lib/site";

/**
 * The links of the public bar: « Explorer » first (the public side of the product: find a shop), then the family's (Pricing, Docs).
 * The public export (krizaka-internal#4626) holds neither the map nor the pricing page: only the docs are left.
 */
export function barItems(locale: Locale, current: PageId, exploreLabel: string, publicExport = false) {
  const family = publicBarLinks({ pricing: pagePath(locale, "pricing"), docs: pagePath(locale, "docs") }, locale)
    .map((l) => ({ ...l, active: l.id === current || (l.id === "docs" && current.startsWith("docs/")) }))
    .filter((l) => !publicExport || l.id === "docs");
  if (publicExport) {
    return family;
  }
  return [
    { id: "explore", label: exploreLabel, href: pagePath(locale, "explore"), active: current === "explore" },
    ...family,
  ];
}
