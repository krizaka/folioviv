import type { ProductPageData } from "@krizaka/ui/product-page";

import { BRAND_ID } from "./brand";
import { getDictionary, type Locale } from "./i18n";
import { PRODUCT_PAGE, productScenes, reportLines } from "./product-page";

/** The page's ways in: the primary (the demo shop, or the contact form), its quiet companion, and the closing one. */
export interface ProductPageLinks {
  primary: { href: string; label: string };
  secondary?: { href: string; label: string };
  closing: { href: string; label: string };
}

/**
 * Everything the home shows, as the template's data (krizaka-internal#4636, design #4692): the words come from the catalogue
 * (`landing.productPage`), the media from the registry (by role). Nothing is typed here, and no product's name: the template draws,
 * the data says. The report in the hero is an example with no amount: figures only ever appear in the app, on demo data.
 */
export function homePageData(locale: Locale, links: ProductPageLinks): ProductPageData {
  const w = getDictionary(locale).landing.productPage;
  const scenes = productScenes(w.scenes);
  return {
    brand: BRAND_ID,
    hero: {
      title: w.hero.title,
      lead: w.hero.lead,
      primary: links.primary,
      ...(links.secondary && { secondary: links.secondary }),
      ...(scenes[0] && { backdrop: scenes[0].poster }),
    },
    moment: {
      label: w.hero.moment,
      tag: w.hero.tag,
      lines: reportLines(w.moment.lines, PRODUCT_PAGE.moment.flagged),
      finding: { verdict: w.moment.verdict, tone: "neutral", title: w.moment.title, reference: w.moment.reference },
      id: "proof",
    },
    scenes: { items: scenes, labels: { play: w.play, pause: w.pause }, id: "what" },
    limits: {
      title: w.limits.title,
      items: PRODUCT_PAGE.limits.flatMap((id) => w.limits.items[id as keyof typeof w.limits.items] ?? []),
    },
    closing: { title: w.closing.title, action: links.closing },
  };
}
