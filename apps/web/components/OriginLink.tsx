import Link from "next/link";
import type { ComponentProps } from "react";

/** A path of this origin (not `//host`), and not a product page's `/<locale>/s/<slug>…`, which redirects to a shop's own origin once the shop domain is declared (lib/host.ts). */
const SAME_ORIGIN_PATH = /^\/(?!\/|[a-z]{2}\/s\/)/;

/**
 * Whether the router's link may carry `href`: a path of the page's own origin that no redirect sends to another one. The router prefetches its links
 * with a `fetch`, and a fetch to another origin (directly, or through the `/s/<slug>` 308) breaks the CSP `connect-src 'self'` (krizaka-internal#4137).
 */
export const routerLinkable = (href: string, offOrigin = false): boolean => !offOrigin && SAME_ORIGIN_PATH.test(href);

/**
 * The one link of the product's pages (krizaka-internal#4137, #3945): Next's router link for a page of this origin, a plain anchor for anything that
 * ends on another origin — a shop's own domain, the `/s/<slug>` hop to it, or the app's pages seen from a shop's origin (`offOrigin`). No link chooses
 * its own `prefetch`: the origin decides, here.
 */
export function OriginLink({
  href,
  offOrigin = false,
  ...props
}: Readonly<
  Omit<ComponentProps<"a">, "href"> & { href: string; /** The page is a shop's own origin. */ offOrigin?: boolean }
>) {
  const Anchor = routerLinkable(href, offOrigin) ? Link : "a";
  return <Anchor href={href} {...props} />;
}
