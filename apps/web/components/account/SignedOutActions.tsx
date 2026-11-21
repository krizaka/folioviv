"use client";

import { ProductBarActions } from "@krizaka/ui/nav-bar";
import Link from "next/link";

/** « Sign in » and « Try Folioviv » (or nothing but the first when sign-up is closed): the bar's actions for a visitor with no session, with no script of their own. */
export function SignedOutActions({
  locale,
  placement,
  signupOpen,
  signIn,
  tryIt,
  base = "",
}: Readonly<{
  locale: "en" | "fr";
  placement: "bar" | "panel";
  signupOpen: boolean;
  signIn: string;
  tryIt: string;
  /** The app's origin when this page is on another (a shop's own): an absolute link is not prefetched (krizaka-internal#4137). */
  base?: string;
}>) {
  return (
    <ProductBarActions
      placement={placement}
      signupOpen={signupOpen}
      linkAs={Link}
      signIn={{ href: `${base}/${locale}/sign-in`, label: signIn }}
      tryIt={{ href: `${base}/${locale}/sign-up`, label: tryIt }}
    />
  );
}
