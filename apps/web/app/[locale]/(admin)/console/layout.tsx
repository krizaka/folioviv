import type { Metadata } from "next";

import { LocaleConsoleProviders } from "@/components/console/LocaleConsoleProviders";
import { PRODUCT_NAME } from "@/lib/brand";

// admin.folioviv.com: never indexed, never cached.
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: `${PRODUCT_NAME} — Administration`,
};

export default function AdminRoot(props: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  return <LocaleConsoleProviders {...props} />;
}
