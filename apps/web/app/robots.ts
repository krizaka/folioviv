import type { MetadataRoute } from "next";

import { indexableOn, publicHost } from "@/lib/indexing";
import { CRAWLERS } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

// Read per request, not baked at build: the setting is the runtime's, as for the proxy.
export const dynamic = "force-dynamic";

/** When open, the public pages are open to every crawler; the signed-in space and the API are not for them. */
export default function robots(): MetadataRoute.Robots {
  // Closed unless the indexing setting is explicitly on for the configured public host (wave 1, krizaka-internal#2630). A closed site names no sitemap.
  if (!indexableOn(publicHost())) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  const disallow = ["/api/", "/en/app", "/fr/app", "/en/sign-in", "/fr/sign-in"];
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      ...CRAWLERS.map((userAgent) => ({ userAgent, allow: "/", disallow })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
