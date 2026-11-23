import { headers } from "next/headers";

/** The nonce of a shop page's strict policy (proxy.ts sets it on the request): it signs the page's inline scripts. */
export async function requestNonce(): Promise<string | undefined> {
  return (await headers()).get("x-nonce") ?? undefined;
}
