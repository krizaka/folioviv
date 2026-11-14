import { LocaleConsoleProviders } from "@/components/console/LocaleConsoleProviders";

/** What the signed-in space and its sign-in page share: the language slice and the query client. */
export default function AppLayout(props: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  return <LocaleConsoleProviders {...props} />;
}
