"use client";

import { ProductBarActions } from "@krizaka/ui/nav-bar";
import Link from "next/link";

/**
 * « Sign in » and « Try Folioviv » (or nothing but the first when sign-up is closed): the bar's actions for a visitor with no session, with no script of
 * their own. On a shop's own origin the sign-in is the app's, another origin: plain anchors, never the router's prefetch (krizaka-internal#4137).
 */
export function SignedOutActions({
  locale,
  placement,
  signupOpen,
  signIn,
  tryIt,
  offOrigin = false,
}: Readonly<{
  locale: "en" | "fr";
  placement: "bar" | "panel";
  signupOpen: boolean;
  signIn: string;
  tryIt: string;
  /** The page is a shop's own origin. */ offOrigin?: boolean;
}>) {
  return (
    <ProductBarActions
      placement={placement}
      signupOpen={signupOpen}
      linkAs={offOrigin ? undefined : Link}
      signIn={{ href: `/${locale}/sign-in`, label: signIn }}
      tryIt={{ href: `/${locale}/sign-up`, label: tryIt }}
    />
  );
}
