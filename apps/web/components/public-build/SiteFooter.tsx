import { org } from "@krizaka/org";
import { SiteFooter as FamilyFooter } from "@krizaka/ui/site-footer";

import { BRAND_ID } from "@/lib/brand-id";
import { type Locale, translator } from "@/lib/i18n";
import { publicFooter } from "@/lib/public-footer";

/**
 * The footer of the public export (krizaka-internal#4636): the family SiteFooter drawn from its data (`content/public-footer.json`):
 * grouped columns of the pages the export holds, then one legal line from `@krizaka/org`, no version, no build hash.
 * Swapped in for `components/SiteFooter` by an alias of next.config.public.mjs; the app's footer is unchanged.
 */
// ui-allow: the export's product footer, swapped in under the app's SiteFooter name by an alias; it composes the library SiteFooter, no copy of it
export function SiteFooter({ locale }: Readonly<{ locale: Locale; offOrigin?: boolean }>) {
  return (
    <FamilyFooter
      current={BRAND_ID}
      family={false}
      org={org}
      config={publicFooter(locale)}
      aria-label={translator(locale)("chrome.footerLabel")}
    />
  );
}
