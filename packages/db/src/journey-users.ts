import { sql } from "drizzle-orm";

import type { Db } from "./client";
import { cleanDemoLeftovers, type DemoCast } from "./demo-clean";

/**
 * No junk user in a shared database (krizaka-internal#2716). A journey signs in as a persona of the cast, or it creates its user on the
 * reserved test domain with an `e2e-` address and deletes it when it ends; a teardown check compares the users outside the cast before and
 * after the run and fails on any difference.
 */
export const JOURNEY_PREFIX = "e2e-";
export const JOURNEY_DOMAIN = "@folioviv.test";

/** `e2e-<label>@folioviv.test`, a plain label: the only kind of address a journey may create and delete. */
export function isJourneyAddress(email: string): boolean {
  const address = email.trim().toLowerCase();
  const label = address.slice(JOURNEY_PREFIX.length, address.length - JOURNEY_DOMAIN.length);
  return (
    address.startsWith(JOURNEY_PREFIX) &&
    address.endsWith(JOURNEY_DOMAIN) &&
    label.length > 0 &&
    [...label].every((c) => /[a-z0-9-]/.test(c))
  );
}

/** The addresses of the accounts the cast does not name, sorted. Pure reading. */
export async function usersOutsideCast(db: Db, castEmails: readonly string[]): Promise<string[]> {
  const known = castEmails.map((e) => e.trim().toLowerCase());
  const { rows } = (await db.execute(
    sql`SELECT lower(email) AS email FROM accounts ${
      known.length
        ? sql`WHERE lower(email) NOT IN (${sql.join(
            known.map((e) => sql`${e}`),
            sql`, `,
          )})`
        : sql``
    } ORDER BY 1`,
  )) as unknown as { rows: { email: string }[] };
  return rows.map((r) => r.email);
}

/** The teardown check: throws, naming them, when the run left an account behind that the cast does not hold. */
export function assertNoJunkUsers(before: readonly string[], after: readonly string[]): void {
  const had = new Set(before);
  const left = after.filter((email) => !had.has(email));
  if (left.length > 0) {
    throw new Error(
      `the journeys left ${left.length} user(s) outside the cast: ${left.join(", ")} — sign in as a persona, or delete the user in teardown`,
    );
  }
}

/** Deletes the users a journey created: only `e2e-…@folioviv.test` addresses, their client file on the demo shop first. Throws on any other address. Returns how many accounts went. */
export async function deleteJourneyUsers(db: Db, emails: readonly string[], cast: DemoCast): Promise<number> {
  const own = emails.map((e) => e.trim().toLowerCase());
  const foreign = own.filter((e) => !isJourneyAddress(e));
  if (foreign.length > 0)
    throw new Error(`refused: ${foreign.length} address(es) are not journey addresses (e2e-…@folioviv.test)`);
  if (own.length === 0) return 0;
  const cleaned = await cleanDemoLeftovers(db, cast);
  const { rows } = (await db.execute(
    sql`DELETE FROM accounts WHERE lower(email) IN (${sql.join(
      own.map((e) => sql`${e}`),
      sql`, `,
    )}) RETURNING id`,
  )) as unknown as { rows: { id: string }[] };
  return cleaned.accounts + rows.length;
}
