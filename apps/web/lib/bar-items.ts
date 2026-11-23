import { publicBarLinks } from "@krizaka/ui/app-frame";

import { type Locale } from "@/lib/i18n";
import { type PageId, pagePath } from "@/lib/site";

/**
 * The links of the public bar: « Explorer » first (the public side of the product: find a shop), then the family's (Pricing, Docs).
 * The public export swaps this module (lib/public-build/bar-items.ts, by an alias of next.config.public.mjs): the app's bundle holds no branch for it.
 */
export function barItems(locale: Locale, current: PageId, exploreLabel: string) {
  const family = publicBarLinks({ pricing: pagePath(locale, "pricing"), docs: pagePath(locale, "docs") }, locale).map(
    (l) => ({ ...l, active: l.id === current || (l.id === "docs" && current.startsWith("docs/")) }),
  );
  return [
    { id: "explore", label: exploreLabel, href: pagePath(locale, "explore"), active: current === "explore" },
    ...family,
  ];
}
