import type { Locale } from "@/lib/i18n";
import type { PageId } from "@/lib/site";

// A relative path on purpose: the alias of next.config.public.mjs points `@/lib/bar-items` here.
import { barItems as appBarItems } from "../bar-items";

/** The bar of the public export (krizaka-internal#4626): it holds neither the map nor the pricing page, only the docs are left. */
export function barItems(locale: Locale, current: PageId, exploreLabel: string) {
  return appBarItems(locale, current, exploreLabel).filter((l) => l.id === "docs");
}
