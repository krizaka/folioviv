const INTL = { en: "en-CA", fr: "fr-CA" } as const;

/** The console's zone: server and browser must write the same text, so never the machine's zone. */
export const ADMIN_TIME_ZONE = "America/Toronto";

/** A date for the console: medium date, and the time when asked. A `YYYY-MM-DD` day stays on its own day. */
export function formatDate(iso: string, locale: "en" | "fr", time = false): string {
  const dayOnly = iso.length === 10; // `YYYY-MM-DD`: an instant always carries its time
  const timeZone = dayOnly ? "UTC" : ADMIN_TIME_ZONE;
  return new Date(iso).toLocaleString(
    INTL[locale],
    time ? { dateStyle: "medium", timeStyle: "short", timeZone } : { dateStyle: "medium", timeZone },
  );
}

export { formatMoney } from "@/lib/format";
