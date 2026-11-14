import { sql } from "drizzle-orm";

import type { Db } from "./client";

/**
 * Keeps the demo shop equal to its cast (krizaka/.github#356, folioviv #1915). A journey that runs on the shared dev database adds a dog, a
 * booking, sometimes a client of its own; this finds what the cast does not hold and removes it, through the schema's own foreign keys (a
 * visit report, then its booking, then the visit, then the dog, then the client file, then a sign-in that nothing else uses).
 */
export type DemoCast = {
  shopSlug: string;
  /** The clients of the cast, by e-mail, with the dogs the cast gives each one. */
  clients: readonly { email: string; dogs: readonly string[] }[];
};

export type Leftovers = { clients: string[]; dogs: string[] };
export type Cleaned = {
  clients: number;
  dogs: number;
  bookings: number;
  visits: number;
  accounts: number;
  kept: number;
};

type Rows<T> = { rows: T[] };

/** The client files and dogs of the demo shop that the cast does not name. Pure reading. */
export async function demoLeftovers(db: Db, cast: DemoCast): Promise<Leftovers> {
  const { rows } = (await db.execute(sql`
    SELECT c.id AS client_id, lower(coalesce(c.email, '')) AS email, d.id AS dog_id, d.name AS dog
      FROM clients c
      JOIN shops s ON s.id = c.shop_id AND s.slug = ${cast.shopSlug}
      LEFT JOIN dependants d ON d.client_id = c.id AND d.erased_at IS NULL
     WHERE c.erased_at IS NULL`)) as unknown as Rows<{
    client_id: string;
    email: string;
    dog_id: string | null;
    dog: string | null;
  }>;
  const known = new Map(cast.clients.map((c) => [c.email.toLowerCase(), new Set(c.dogs)]));
  const clients = new Set<string>();
  const dogs: string[] = [];
  for (const r of rows) {
    const dogsOf = known.get(r.email);
    if (!dogsOf) clients.add(r.client_id);
    else if (r.dog_id && r.dog && !dogsOf.has(r.dog)) dogs.push(r.dog_id);
  }
  return { clients: [...clients], dogs };
}

const list = (ids: string[]) =>
  sql.join(
    ids.map((id) => sql`${id}::uuid`),
    sql`, `,
  );

/** Removes the leftovers, all or nothing. A client file with an invoice is never removed: it throws, and nothing changes. */
export async function cleanDemoLeftovers(db: Db, cast: DemoCast): Promise<Cleaned> {
  const found = await demoLeftovers(db, cast);
  const done: Cleaned = { clients: 0, dogs: 0, bookings: 0, visits: 0, accounts: 0, kept: 0 };
  if (found.clients.length === 0 && found.dogs.length === 0) return done;
  await db.transaction(async (tx) => {
    const none = sql`NULL::uuid`;
    const C = found.clients.length ? list(found.clients) : none;
    const D = found.dogs.length ? list(found.dogs) : none;
    const billed = (await tx.execute(
      sql`SELECT count(*)::int AS n FROM invoices WHERE client_id IN (${C})`,
    )) as unknown as Rows<{ n: number }>;
    if (billed.rows[0]!.n > 0)
      throw new Error(`demo-clean: ${billed.rows[0]!.n} invoice(s) hang on a leftover client file — not removed`);
    const accountsOf = (await tx.execute(
      sql`SELECT account_id AS id FROM clients WHERE id IN (${C}) AND account_id IS NOT NULL`,
    )) as unknown as Rows<{ id: string }>;
    const bookings = (await tx.execute(
      sql`SELECT id, appointment_id FROM bookings WHERE client_id IN (${C}) OR dependant_id IN (${D})`,
    )) as unknown as Rows<{ id: string; appointment_id: string }>;
    const bookingIds = bookings.rows.map((b) => b.id);
    const visitIds = [...new Set(bookings.rows.map((b) => b.appointment_id))];
    if (bookingIds.length) {
      await tx.execute(sql`DELETE FROM visit_reports WHERE booking_id IN (${list(bookingIds)})`);
      await tx.execute(sql`DELETE FROM bookings WHERE id IN (${list(bookingIds)})`);
    }
    // A visit left with no seat and no invoice was only theirs.
    const visits = (await tx.execute(sql`
      DELETE FROM appointments a
       WHERE (a.client_id IN (${C}) ${visitIds.length ? sql`OR a.id IN (${list(visitIds)})` : sql``})
         AND NOT EXISTS (SELECT 1 FROM bookings b WHERE b.appointment_id = a.id)
         AND NOT EXISTS (SELECT 1 FROM invoices i WHERE i.appointment_id = a.id)
       RETURNING a.id`)) as unknown as Rows<{ id: string }>;
    const dogs = (await tx.execute(sql`DELETE FROM dependants WHERE id IN (${D}) RETURNING id`)) as unknown as Rows<{
      id: string;
    }>;
    const clients = (await tx.execute(sql`DELETE FROM clients WHERE id IN (${C}) RETURNING id`)) as unknown as Rows<{
      id: string;
    }>;
    done.bookings = bookingIds.length;
    done.visits = visits.rows.length;
    done.dogs = dogs.rows.length;
    done.clients = clients.rows.length;
    // A sign-in kept only if something else uses it (a shop, a team seat): the foreign key says so, and the account stays.
    const cast_ = sql.join(
      cast.clients.map((c) => sql`${c.email.toLowerCase()}`),
      sql`, `,
    );
    for (const a of accountsOf.rows) {
      try {
        await tx.transaction(async (inner) => {
          const gone = (await inner.execute(
            sql`DELETE FROM accounts WHERE id = ${a.id}::uuid AND lower(email) NOT IN (${cast_}) RETURNING id`,
          )) as unknown as Rows<{ id: string }>;
          done.accounts += gone.rows.length;
        });
      } catch {
        done.kept += 1;
      }
    }
  });
  return done;
}

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
