import { ownClient, SHOP_ROLES, shopClient, shopOfMember, type ShopPermission, type ShopRole } from "@folioviv/db";
import { can, ipAllowed as ipListAllows, requireAdmin as adminVerdict, sessionTokenOf as tokenOf } from "@krizaka/auth";
import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import { after } from "next/server";

import { clientIp } from "./client-ip";
import { db } from "./db";
import { consoleAllowedIps } from "./env";
import { isAdminHost } from "./host";
import { idParam, refuse } from "./http";
import { invalidateShop } from "./shop-cache";
import { resolveSession, type Session, SESSION_COOKIE } from "./session";

/**
 * Who may do what. Pages and API share the rules: a session for the library; for the administration three locks — a
 * session, the ADMIN role, and an address on AUTH_ALLOWED_IPS (empty in production = nobody). A failed lock answers 404
 * on pages (the administration does not announce itself) and 403 on the API.
 */
// lib-allow: binds AUTH_ALLOWED_IPS and the trusted client address to the @krizaka/auth address lock; the rule is not copied
export function ipAllowed(requestHeaders: Headers, env: Record<string, string | undefined> = process.env): boolean {
  return ipListAllows(clientIp(requestHeaders, env), consoleAllowedIps(env));
}

/** admin.folioviv.com answers only addresses of AUTH_ALLOWED_IPS, its sign-in page and sign-in call included; the product host is open. */
export function hostAllowed(requestHeaders: Headers, env: Record<string, string | undefined> = process.env): boolean {
  return !isAdminHost(requestHeaders.get("host")) || ipAllowed(requestHeaders, env);
}

/** The session token of a request: the native apps' `Authorization: Bearer` (which wins: an app never replays a stale cookie), else the web's cookie. */
// lib-allow: binds the app's cookie name to the @krizaka/auth reader; the reading rule is not copied
export const sessionTokenOf = (requestHeaders: Headers): string | undefined =>
  tokenOf(requestHeaders, { cookie: SESSION_COOKIE });

/** The API's caller, from the bearer or the session cookie — or 401. */
export async function requireSession(req: Request): Promise<Session> {
  const session = await resolveSession(sessionTokenOf(req.headers));
  if (!session) throw refuse(401, "UNAUTHENTICATED", "Sign in first");
  return session;
}

/** The API caller's session, or null when there is none (a public page asking who is there). */
export async function optionalSession(req: Request): Promise<Session | null> {
  return resolveSession(sessionTokenOf(req.headers));
}

// lib-allow: the API's answer (status, code, wording) around the @krizaka/auth administration lock; the three locks are not copied
export async function requireAdmin(req: Request): Promise<Session> {
  const session = await requireSession(req);
  const verdict = adminVerdict({ session, ip: clientIp(req.headers), allowedIps: consoleAllowedIps() });
  if (verdict.ok) return session;
  throw refuse(
    verdict.status,
    verdict.code,
    verdict.code === "IP_NOT_ALLOWED" ? "This address may not use the administration" : "Administrators only",
  );
}

/** The session of the page being rendered (a Server Component), or null. */
export async function pageSession(): Promise<Session | null> {
  return resolveSession((await cookies()).get(SESSION_COOKIE)?.value);
}

/** The page's administrator — session, role and address — or null (the page answers 404). */
export async function pageAdmin(): Promise<Session | null> {
  const session = await pageSession();
  if (session?.account.role !== "ADMIN") return null;
  return ipAllowed(await headers()) ? session : null;
}

/**
 * The first line of every console page: the layout is not enough, a page segment can be rendered without it (RSC / prefetch),
 * so each page answers 404 itself unless the visitor is an administrator on an allowed address.
 */
export async function guardAdminPage(): Promise<Session> {
  const admin = await pageAdmin();
  if (!admin) {
    notFound();
  }
  return admin;
}

/**
 * A member of a shop who may do `permission` there: the session, the shop (the one asked for with `?shopId=`, else the one the person
 * works in) and their role. 403 NO_SHOP for someone who belongs to none, 404 for a shop they are not a member of, 403 FORBIDDEN (with the
 * permission) for a role that does not hold it — the table is `SHOP_ROLES`, never a check on a role here.
 */
export async function requireShop(req: Request, permission: ShopPermission) {
  const session = await requireSession(req);
  const asked = new URL(req.url).searchParams.get("shopId");
  const member = await shopOfMember(db(), session.account.id, asked ? idParam(asked) : undefined);
  if (!member) throw asked ? refuse(404, "NOT_FOUND", "Not found") : refuse(403, "NO_SHOP", "You do not run a shop");
  if (!can(SHOP_ROLES, member.role, permission))
    throw refuse(403, "FORBIDDEN", "Your role does not allow this", { permission });
  if (!SAFE_METHODS.has(req.method)) {
    dropShopCache(member.shop.id);
  }
  return { session, shop: member.shop, role: member.role };
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/** A write by a member of the shop: its public page's kept rows are dropped now and once more after the response, when the write has landed. */
function dropShopCache(shopId: string): void {
  invalidateShop(shopId);
  try {
    after(() => invalidateShop(shopId));
  } catch {
    // Outside a request scope (a test, a script): the immediate drop is all there is.
  }
}

/**
 * The agenda a member reads: the whole shop's for whoever handles its bookings (owner, manager), only the appointments
 * assigned to them otherwise (staff: their own agenda, as the web's Today). Data, from the roles: never a role's name.
 */
export const agendaScope = (role: ShopRole, accountId: string): { staffAccountId?: string } =>
  can(SHOP_ROLES, role, "bookings") ? {} : { staffAccountId: accountId };

/** The shop's owner (the settings, billing, deletion — everything). */
export const requireOwner = (req: Request) => requireShop(req, "settings");

/** A client file of the signed-in account (404 for anyone else's: nothing tells it exists). */
export async function requireOwnClient(req: Request, clientId: string) {
  const session = await requireSession(req);
  const client = await ownClient(db(), session.account.id, clientId);
  if (!client) throw refuse(404, "NOT_FOUND", "Not found");
  return { session, client };
}

/** A client file of the walker's shop. */
export async function requireShopClient(req: Request, clientId: string, permission: ShopPermission = "clients") {
  const { session, shop } = await requireShop(req, permission);
  const client = await shopClient(db(), shop.id, clientId);
  if (!client) throw refuse(404, "NOT_FOUND", "Not found");
  return { session, shop, client };
}
