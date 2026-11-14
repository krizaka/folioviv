import { lookup as dnsLookup } from "node:dns/promises";
import net from "node:net";

import { CalendarSourceError } from "@folioviv/core";
import { isPrivateAddress } from "@krizaka/storage";

/**
 * An address the owner types is fetched by the server, so it must lead to the public internet and nowhere else (no SSRF): `https` only
 * (`webcal://` is the same address), no credentials in it, no port but 443, no local name, and every address its name resolves to is public.
 * The names are resolved before each request; a name that changes its answer between the check and the request is the residual risk of any fetch
 * that cannot pin the address, and the redirect limit and the size limit bound what it could read.
 */
const LOCAL_NAME = /(^|\.)(localhost|local|internal|lan|home|corp|intranet)$/i;

/** The address to fetch: `webcal://` read as `https://`, everything else refused when it is not a plain public `https` address. */
export function parseCalendarUrl(raw: string): URL {
  const text = raw.trim().replace(/^webcal:\/\//i, "https://");
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    throw new CalendarSourceError("AK_CAL_INVALID", false, "not an address");
  }
  if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443"))
    throw new CalendarSourceError("AK_CAL_INVALID", false, "only plain https addresses");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (LOCAL_NAME.test(host) || (!host.includes(".") && net.isIP(host) === 0))
    throw new CalendarSourceError("AK_CAL_INVALID", false, "not a public address");
  if (net.isIP(host) !== 0 && isPrivateAddress(host))
    throw new CalendarSourceError("AK_CAL_INVALID", false, "not a public address");
  return url;
}

export type Resolver = (host: string) => Promise<string[]>;

const resolveAll: Resolver = async (host) => (await dnsLookup(host, { all: true })).map((a) => a.address);

/** Refuses a name when any address it resolves to is not public. */
export async function assertPublicHost(url: URL, resolve: Resolver = resolveAll): Promise<void> {
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (net.isIP(host) !== 0) return; // already judged by parseCalendarUrl
  let addresses: string[];
  try {
    addresses = await resolve(host);
  } catch {
    throw new CalendarSourceError("AK_CAL_UNREACHABLE", true, "the name does not resolve");
  }
  if (addresses.length === 0 || addresses.some((address) => isPrivateAddress(address)))
    throw new CalendarSourceError("AK_CAL_INVALID", false, "not a public address");
}
