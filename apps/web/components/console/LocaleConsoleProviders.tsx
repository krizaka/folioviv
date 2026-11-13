import { ConsoleProviders } from "@/components/console/ConsoleProviders";
import { asLocale, getDictionary } from "@/lib/i18n";

/** The root of the console's pages: the language slice of the route's locale and the query client. */
export async function LocaleConsoleProviders({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  const locale = asLocale((await params).locale);
  const { console: messages } = getDictionary(locale);
  return (
    <ConsoleProviders locale={locale} messages={{ console: messages }}>
      {children}
    </ConsoleProviders>
  );
}
