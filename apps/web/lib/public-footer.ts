import { org } from "@krizaka/org";
import type { SiteFooterConfig } from "@krizaka/ui/site-footer";
import { z } from "zod";

import data from "@/content/public-footer.json";
import { getDictionary, type Locale, type MessageKey, translator } from "@/lib/i18n";
import { PUBLIC_PAGES } from "@/lib/public-build/pages.mjs";
import { contactHref, KRIZAKA_URL, LICENSE_URL, type PageId, pagePath, PAGES, REPO_URL } from "@/lib/site";

/** The site's own addresses a footer link may name: the code, its licence, the publisher, its contact form. Never a typed URL in the data. */
const SITE_ADDRESSES = ["repo", "license", "publisher", "contact"] as const;
type SiteAddress = (typeof SITE_ADDRESSES)[number];
const siteAddress = (site: SiteAddress, locale: Locale): string =>
  ({
    repo: REPO_URL,
    license: LICENSE_URL,
    publisher: `${KRIZAKA_URL}/${locale}`,
    contact: contactHref("www-folioviv-footer", locale),
  })[site];

/** A key of the message catalogues: its words exist (in the reference language), or the data is refused. */
const wordsAt = (path: string): unknown =>
  path
    .split(".")
    .reduce<unknown>(
      (node, part) => (typeof node === "object" && node !== null ? Reflect.get(node, part) : undefined),
      getDictionary("en"),
    );
const messageKey = z.custom<MessageKey>((key) => typeof key === "string" && typeof wordsAt(key) === "string", {
  message: "not a message key",
});
const link = z.union([
  z.object({ labelKey: messageKey, page: z.enum(PAGES) }),
  z.object({ labelKey: messageKey, site: z.enum(SITE_ADDRESSES) }),
]);
const settings = z.object({
  labelKey: messageKey,
  columns: z.array(z.object({ id: z.string(), titleKey: messageKey, links: z.array(link) })),
  legal: z.object({ showVersion: z.boolean(), links: z.array(link) }),
  social: z.array(z.string()),
});
export type PublicFooterData = z.infer<typeof settings>;
type Link = z.infer<typeof link>;

/** The footer's data, parsed once: `content/public-footer.json`. */
export const PUBLIC_FOOTER: PublicFooterData = settings.parse(data);

const pageFolder = (page: PageId): string => (page === "home" ? "" : page);
/** A page link is drawn only when the export holds that page (no pricing, terms, download or sign-in there). */
const shown = (l: Link): boolean => !("page" in l) || PUBLIC_PAGES.includes(pageFolder(l.page));

type FooterLink = SiteFooterConfig["columns"][number]["links"][number];

function toLink(l: Link, locale: Locale, t: (key: MessageKey) => string): FooterLink {
  if ("page" in l) {
    return { label: t(l.labelKey), href: pagePath(locale, l.page) };
  }
  return { label: t(l.labelKey), href: siteAddress(l.site, locale), external: true };
}

/**
 * The footer of the public export, resolved for one language: the columns with only the links the export holds, then one
 * legal line (the publisher's legal name, NEQ and city from `@krizaka/org`, never typed) without a version, and the org's socials.
 * Built on the server: `resolveFooterSettings` of @krizaka/ui lives in a client module.
 */
export function publicFooter(locale: Locale, footer: PublicFooterData = PUBLIC_FOOTER): SiteFooterConfig {
  const t = translator(locale);
  const { company } = org;
  return {
    label: t(footer.labelKey),
    columns: footer.columns
      .map((c) => ({ id: c.id, title: t(c.titleKey), links: c.links.filter(shown).map((l) => toLink(l, locale, t)) }))
      .filter((c) => c.links.length > 0),
    legal: {
      legalName: company.legalName,
      neq: company.neq,
      city: company.city,
      showVersion: footer.legal.showVersion,
      links: footer.legal.links.filter(shown).map((l) => toLink(l, locale, t)),
    },
    social: org.links.social
      .filter((s) => footer.social.includes(s.id))
      .map((s) => ({ id: s.id, label: s.label, href: s.url })),
  };
}
