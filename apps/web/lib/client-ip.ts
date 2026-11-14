import { clientIp as clientIpOf } from "@krizaka/auth";

/**
 * The client's IP address, as far as this deployment can trust it: the rules are `@krizaka/auth`'s `clientIp` (the edge's header, else the
 * entry `ABUSE_TRUSTED_PROXY_HOPS` from the right of `X-Forwarded-For`, then `X-Real-IP`, else null); this reads the deployment's two settings.
 */
// lib-allow: binds the deployment's ABUSE_CLIENT_IP_HEADER and ABUSE_TRUSTED_PROXY_HOPS to the @krizaka/auth function; the rules are not copied
export function clientIp(headers: Headers, env: Record<string, string | undefined> = process.env): string | null {
  return clientIpOf(headers, {
    header: env.ABUSE_CLIENT_IP_HEADER?.trim().toLowerCase() || undefined,
    trustedProxyHops: Math.max(1, Math.min(10, Number(env.ABUSE_TRUSTED_PROXY_HOPS) || 1)),
  });
}
