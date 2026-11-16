import Link from "next/link";
import type { ComponentProps } from "react";

/**
 * A link to a shop's public page (krizaka-internal#3945). The shop lives on its own origin once the shop domain is declared: the link then is a
 * plain anchor straight to it (no `/s/<slug>` hop on the app host answered by a 308, no cancelled prefetch of a page another origin serves);
 * otherwise the page is on this origin and the router's link keeps the in-app navigation.
 */
export function ShopLink({ href, ...props }: Readonly<Omit<ComponentProps<"a">, "href"> & { href: string }>) {
  return href.startsWith("/") ? <Link href={href} {...props} /> : <a href={href} {...props} />;
}
