import { preconnect } from "react-dom";

import { shopDomain, shopOriginOf, shopPageUrl } from "./shop-domain";

/** A shop's page address for a link: the shop's own origin once the shop domain is declared, else the path on the app (`OriginLink` picks the element). */
export const shopHref = (slug: string, locale: string): string => shopPageUrl(slug, locale, process.env);

/** The pattern of `shopHref` for a client list that learns its slugs later (`{slug}` is replaced). */
export const shopHrefPattern = (locale: string): string => shopHref("{slug}", locale);

/** Open the shop origin's connection while the visitor reads, so the click lands on a warm connection (React hoists the link into `<head>`). */
export function preconnectShop(slug: string): void {
  if (shopDomain(process.env)) {
    preconnect(shopOriginOf(slug, process.env));
  }
}
