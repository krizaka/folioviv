import en from "@/messages/site/en.json";
import fr from "@/messages/site/fr.json";

import type { Locale } from "./i18n";

/**
 * The words of the public product page. Their own catalogue, read on the server only: the app's `messages/{en,fr}.json` reach the
 * browser through the console's client islands, and these words must not grow the shop pages' client JS (krizaka-internal#4636).
 */
const WORDS = { en: en.productPage, fr: fr.productPage } as const;
export type ProductPageCatalogue = typeof en.productPage;

export const productPageWords = (locale: Locale): ProductPageCatalogue => WORDS[locale];
