#!/usr/bin/env node
// The whole Folioviv cast on a database, the same everywhere (krizaka/.github#356): local (`pnpm run dev:seed`), CI, Maestro, the
// recorders and the dev deployment. The Saint-Henri walker (Léa) with her shop, five clients with their dogs, and
// Éric (the Krizaka studio's owner), Mira (the administrator) — names, languages and roles come from `@krizaka/org`'s cast. Idempotent; refused outside dev.
// Addresses of the walker and the clients are the seed's own fictional `.test` ones; secrets come from the environment and are
// never printed (a database on this machine gets local defaults).
//
//   DATABASE_URL=… [DATABASE_CA_CERT=…] [APP_DATA_ENCRYPTION_KEY=…] [QA_WALKER_PASSWORD=… QA_CLIENTS_PASSWORD=… QA_ADMIN_EMAIL=… QA_ADMIN_PASSWORD=… QA_KRIZAKA_PASSWORD=…] \
//     pnpm --filter @folioviv/web exec tsx scripts/seed-cast.mjs [--clean] [--check]
//
// `--clean` removes what a journey left on the demo shop (a dog, a booking, a client file the cast does not name); `--check` fails
// when anything of the kind is still there, besides comparing the fingerprint (folioviv #1915).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { createDb, migrate, pg, poolConfig } from "@folioviv/db";
import { cleanDemoLeftovers, demoLeftovers } from "@folioviv/db/demo-clean";
import { SAINT_HENRI, SAINT_HENRI_EMAILS, seedSaintHenri } from "@folioviv/db/seed-walker";
import { castOf, persona, seedFingerprint } from "@krizaka/org";

import { hashPassword } from "./qa-accounts.mjs";
import { ensureOwnerStates } from "./seed-owner-states.mjs";

/** What a LOCAL database gets when nothing is given. Never used on a host that is not this machine. */
export const LOCAL_SECRET = "local-cast-password-0123";
const LOCAL_KEY = Buffer.alloc(32, "folioviv-local-cast").toString("base64");

const isLocalHost = (databaseUrl) => {
  try {
    return ["localhost", "127.0.0.1", "::1", "[::1]", "postgres", "db"].includes(new URL(databaseUrl).hostname);
  } catch {
    return false;
  }
};

export const WALKER = persona("folioviv", "lea");
export const ERIC = persona("folioviv", "eric");
export const ADMIN = persona("folioviv", "mira");
/** The company's own account: it owns the real Krizaka shop (folioviv#489), set up through the owner console. Not a demo persona, not a person's login. */
export const KRIZAKA = { id: "krizaka", displayName: "Krizaka", locale: "fr", avatar: "krizaka" };
export const KRIZAKA_EMAIL = "folioviv@krizaka.com";

/**
 * The address of a cast persona that signs in on a shared host: from the environment (`QA_*_EMAIL`, or `APP_QA_*_EMAIL` as the secrets name them),
 * never a built-in one (krizaka-internal#2716). Only a database on this machine falls back to the persona's own fictional `.test` address.
 */
export function castAddress(env, name, p) {
  const given = env[name] ?? env[`APP_${name}`];
  const email = (given ?? (isLocalHost(env.DATABASE_URL ?? "") ? `${p.id}@demo.folioviv.test` : ""))
    .trim()
    .toLowerCase();
  if (!email) {
    throw new Error(`${name} (or APP_${name}) is required on a host that is not this machine: no built-in address`);
  }
  if (!/^[^@\s]+@[^@\s]+$/.test(email)) {
    throw new Error(`${name} is invalid`);
  }
  return email;
}

/**
 * The other fixture accounts of the seeds, each mapped to its persona of the cast (`@krizaka/org`, krizaka-internal#2716). The key is the local part:
 * the seeds make it on `folioviv.test`, a deployment keeps the same people on its own reserved test domain (`akinaza.test` on dev), so an address
 * is a persona's when its local part is here AND its domain is a `.test` one. The cast holds no e-mail; this map is where an address meets a person.
 * A fixture account no one named is junk.
 */
export const FIXTURE_PERSONAS = {
  "maelle.cedre": "maelle", // owner of the demo shop Cèdre & Ciseaux (demo-shops)
  "ines.encrevive": "ines-encrevive", // owner of Encre Vive Studio
  "camille.ferland": "camille-ferland", // owner of Ferland Conseil
  "ines.debut": "ines-debut", // owner of the empty-shop state (seed-owner-states)
  "yan.seul": "yan", // owner of the one-item-per-list state
  "eric.krizaka": "eric-krizaka", // owner of the Krizaka studio demo (seed-krizaka)
  "contact.studiolumen": "marie-eve", // the studio demo's clients, in the seed's order
  "contact.cafedupark": "marie-eve", // the same client before the rename (the account kept its address)
  "contact.atelierboreal": "olivier",
  "contact.nordstudio": "annie",
  "contact.uniqueclient": "hugo", // the client of the one-item shop
  "camille.staff": "camille-staff", // the staff member of seed-staff-day
};

const localPart = (email) => email.trim().toLowerCase().split("@")[0];
const onTestDomain = (email) => /@[^@]+\.test$/.test(email.trim().toLowerCase());

/** Whether an address is a person of the cast: one of its exact addresses, or a fixture / walker address on a `.test` domain (a deployment's own). */
export function isCastAddress(email, exact) {
  const e = email.trim().toLowerCase();
  const walkers = SAINT_HENRI_EMAILS.map(localPart);
  return exact.includes(e) || fixturePersona(e) !== undefined || (onTestDomain(e) && walkers.includes(localPart(e)));
}

/** The persona id of a fixture address (a local part of the map on a `.test` domain), or undefined. */
export function fixturePersona(email) {
  return onTestDomain(email) ? FIXTURE_PERSONAS[localPart(email)] : undefined;
}

/** The accounts of people whose address lives in the secrets, not in the seed: `QA_<NAME>_EMAIL` (or `APP_QA_<NAME>_EMAIL`), when set. */
const SECRET_PERSONAS = { QA_PHILIPPE_EMAIL: "philippe", QA_MYRIAM_EMAIL: "myriam" };

/** The addresses given by the environment for the cast's own people kept in the secrets → persona id. */
export function personaEmails(env) {
  return Object.fromEntries(
    Object.entries(SECRET_PERSONAS).flatMap(([name, id]) => {
      const given = (env[name] ?? env[`APP_${name}`] ?? "").trim().toLowerCase();
      return given ? [[given, id]] : [];
    }),
  );
}

/**
 * Gives each fixture account that exists its persona's name, language and avatar, where it has no name yet (a name an owner chose is theirs).
 * `query` is `(sql, values) => Promise`; returns how many accounts were named.
 */
export async function nameFixtureAccounts(query, env) {
  let named = 0;
  const byLocalPart = Object.entries(FIXTURE_PERSONAS).map(([local, id]) => ({ id, where: "local", key: local }));
  const byAddress = Object.entries(personaEmails(env)).map(([email, id]) => ({ id, where: "email", key: email }));
  for (const { id, where, key } of [...byLocalPart, ...byAddress]) {
    const p = persona("folioviv", id);
    const match =
      where === "local" ? "split_part(lower(email), '@', 1) = $1 AND email ~* '@[^@]+\\.test$'" : "lower(email) = $1";
    const { rowCount } = await query(
      `UPDATE accounts SET name = $2, locale = $3, avatar_seed = $4 WHERE ${match} AND name IS NULL`,
      [key, p.displayName, p.locale, p.avatar],
    );
    named += rowCount ?? 0;
  }
  return named;
}

/** The e-mails of the cast, passwords not needed: what a users check compares a database with. */
export function castEmails(env) {
  return [
    ...SAINT_HENRI_EMAILS,
    ...Object.keys(personaEmails(env)),
    castAddress(env, "QA_USER_EMAIL", ERIC),
    (env.QA_KRIZAKA_EMAIL ?? env.APP_QA_KRIZAKA_EMAIL ?? KRIZAKA_EMAIL).trim().toLowerCase(),
    castAddress(env, "QA_ADMIN_EMAIL", ADMIN),
  ].map((e) => e.toLowerCase());
}

/** The accounts of the cast: the walker, the five clients (same order as the seed) and the administrator. */
export function castAccounts(env) {
  const local = isLocalHost(env.DATABASE_URL ?? "");
  const need = (name, fallback) => {
    const value = env[name] ?? (local ? fallback : undefined);
    if (!value || value.length < 12) {
      throw new Error(`${name} is missing or shorter than 12 characters`);
    }
    return value;
  };
  const walkerSecret = need("QA_WALKER_PASSWORD", LOCAL_SECRET);
  const clientsSecret = need("QA_CLIENTS_PASSWORD", LOCAL_SECRET);
  const addressOf = (name, p) => castAddress(env, name, p);
  // The walker's clients are the cast's first client personas, one per address of the seed; the later ones (the studio's contacts, the one-item shop's) get their account from their own seed.
  const clientPersonas = castOf("folioviv")
    .filter((p) => p.role === "client")
    .slice(0, SAINT_HENRI_EMAILS.length - 1);
  return [
    { persona: WALKER, email: SAINT_HENRI_EMAILS[0], role: "USER", secret: walkerSecret },
    ...clientPersonas.map((persona, i) => ({
      persona,
      email: SAINT_HENRI_EMAILS[i + 1],
      role: "USER",
      secret: clientsSecret,
    })),
    {
      persona: ERIC,
      email: addressOf("QA_USER_EMAIL", ERIC),
      role: "USER",
      secret: need("QA_USER_PASSWORD", LOCAL_SECRET),
    },
    {
      persona: KRIZAKA,
      email: (env.QA_KRIZAKA_EMAIL ?? env.APP_QA_KRIZAKA_EMAIL ?? KRIZAKA_EMAIL).trim().toLowerCase(),
      role: "USER",
      secret: need("QA_KRIZAKA_PASSWORD", LOCAL_SECRET),
    },
    {
      persona: ADMIN,
      email: addressOf("QA_ADMIN_EMAIL", ADMIN),
      role: "ADMIN",
      secret: need("QA_ADMIN_PASSWORD", LOCAL_SECRET),
    },
  ];
}

/**
 * The tables the fingerprint counts: the cast's accounts (a list), and the walker's shop with what hangs on it (her id). Éric and Mira may own
 * other rows on a dev database (a studio's shop, older demo data): they are not the seed's, so they never enter the count.
 */
export const FINGERPRINT_QUERIES = {
  accounts: "SELECT count(*)::int AS n FROM accounts WHERE id = ANY($1)",
  shops: "SELECT count(*)::int AS n FROM shops WHERE owner_id = $1",
  clients: "SELECT count(*)::int AS n FROM clients WHERE shop_id IN (SELECT id FROM shops WHERE owner_id = $1)",
  services: "SELECT count(*)::int AS n FROM services WHERE shop_id IN (SELECT id FROM shops WHERE owner_id = $1)",
  appointments:
    "SELECT count(*)::int AS n FROM appointments WHERE shop_id IN (SELECT id FROM shops WHERE owner_id = $1)",
  invoices: "SELECT count(*)::int AS n FROM invoices WHERE shop_id IN (SELECT id FROM shops WHERE owner_id = $1)",
};

export async function fingerprintOf(query, accountIds, walkerId) {
  const counts = {};
  for (const [table, sql] of Object.entries(FINGERPRINT_QUERIES)) {
    const values = sql.includes("ANY($1)") ? [accountIds] : [walkerId];
    counts[table] = (await query(sql, values)).rows[0].n;
  }
  return { counts, fingerprint: seedFingerprint(counts) };
}

/**
 * Whether a database holds the recorded cast. A local or CI database is the seed's alone: the fingerprint is exact. The shared dev
 * database is lived in (bookings made in the app, other tests add clients and appointments), and the seed leaves a shop that already
 * has its invoices alone, so there the check is « everything recorded is there »: the accounts exactly, every other count at least.
 */
export function matchesRecorded(counts, expected, exact) {
  const recorded = Object.fromEntries(
    expected
      .split(";")
      .map((pair) => pair.split("="))
      .map(([k, v]) => [k, Number(v)]),
  );
  return Object.entries(recorded).every(([table, n]) =>
    exact || table === "accounts" ? counts[table] === n : counts[table] >= n,
  );
}

/** What the demo shop holds, and nothing more: the clients of the seed with their dogs. A journey that adds to it must remove what it added. */
export const DEMO_CAST = {
  shopSlug: SAINT_HENRI.shop.slug,
  clients: SAINT_HENRI.clients.map((c) => ({ email: c.email, dogs: c.dogs.map((d) => d.name) })),
};

/** The seed works on dev and local only. */
export function assertNotProduction(env) {
  const environment = env.APP_ENVIRONMENT ?? "dev";
  if (environment !== "dev") {
    throw new Error(`seed-cast works only on dev and local, and APP_ENVIRONMENT is "${environment}" — refused`);
  }
}

/** `--clean` removes what a journey left on the demo shop; `--check` fails while anything of the kind is still there. */
async function cleanAndCheckLeftovers(db, argv) {
  if (argv.includes("--clean")) {
    const cleaned = await cleanDemoLeftovers(db, DEMO_CAST);
    console.log(
      `demo-clean: ${cleaned.clients} client file(s), ${cleaned.dogs} dog(s), ${cleaned.bookings} booking(s), ${cleaned.visits} visit(s), ${cleaned.accounts} sign-in(s) removed`,
    );
  }
  if (!argv.includes("--check")) {
    return;
  }
  const left = await demoLeftovers(db, DEMO_CAST);
  if (left.clients.length + left.dogs.length > 0) {
    throw new Error(
      `the demo shop holds data the cast does not name: ${left.clients.length} client file(s), ${left.dogs.length} dog(s) — run with --clean`,
    );
  }
}

async function main() {
  assertNotProduction(process.env);
  const env = process.env;
  const url = env.DATABASE_URL ?? "";
  if (!url) {
    throw new Error("DATABASE_URL is required");
  }
  const keyText = env.APP_DATA_ENCRYPTION_KEY ?? (isLocalHost(url) ? LOCAL_KEY : undefined);
  const key = Buffer.from(keyText ?? "", "base64");
  if (key.length !== 32) {
    throw new Error("APP_DATA_ENCRYPTION_KEY must be 32 bytes, base64");
  }
  const accounts = castAccounts(env);
  const pool = new pg.Pool(poolConfig(url, env.DATABASE_CA_CERT, 2));
  try {
    await migrate(pool, fileURLToPath(new URL("../../../packages/db/drizzle", import.meta.url))); // idempotent: the app does the same at start
    const ids = [];
    // The visual run fixes the instant the pages are drawn at (APP_FIXED_NOW, dev only): the cast is seeded around the same one.
    const fixedNow = process.env.APP_FIXED_NOW;
    for (const a of accounts) {
      const [row] = (
        await pool.query(
          `INSERT INTO accounts (email, role, locale, name, avatar_seed, email_verified_at, password_hash) VALUES ($1, $2, $3, $4, $6, now(), $5)
           ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role, status = 'ACTIVE', password_hash = EXCLUDED.password_hash, name = coalesce(accounts.name, EXCLUDED.name), avatar_seed = EXCLUDED.avatar_seed
           RETURNING id`,
          [a.email, a.role, a.persona.locale, a.persona.displayName, await hashPassword(a.secret), a.persona.avatar],
        )
      ).rows;
      ids.push(row.id);
    }
    const result = await seedSaintHenri(createDb(pool), key, fixedNow ? new Date(fixedNow) : new Date());
    console.log(
      `seed-cast: ${WALKER.displayName} (${SAINT_HENRI.shop.name}), ${accounts.length - 4} clients, ${ERIC.displayName}, ${ADMIN.displayName} (administrator); shop ${result.created ? "created" : "already there"}`,
    );
    // The two owner states of the page audit (#405: an empty shop, a shop with one item per list): outside the fingerprint, which counts the cast alone.
    await ensureOwnerStates(pool, accounts[0].secret);
    // The fixture accounts the other seeds create (owners of the demo shops, the studio's contacts, the staff) carry their persona's name.
    const named = await nameFixtureAccounts((sql, values) => pool.query(sql, values), env);
    console.log(`seed-cast: ${named} fixture account(s) named after their persona`);
    const { fingerprint, counts } = await fingerprintOf((sql, values) => pool.query(sql, values), ids, ids[0]);
    console.log(`fingerprint: ${fingerprint}`);
    await cleanAndCheckLeftovers(createDb(pool), process.argv);
    if (process.argv.includes("--check")) {
      const expected = JSON.parse(
        readFileSync(new URL("./cast-fingerprint.json", import.meta.url), "utf8"),
      ).fingerprint;
      const exact = isLocalHost(url);
      if (!matchesRecorded(counts, expected, exact)) {
        throw new Error(
          `the seeded data differs from the recorded fingerprint\n  expected ${expected}\n  got      ${fingerprint}`,
        );
      }
      console.log(
        exact
          ? "fingerprint: matches the recorded one"
          : "fingerprint: everything recorded is there (this database is lived in: counts may exceed it)",
      );
    }
  } finally {
    await pool.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    await main();
  } catch (error) {
    console.error(`seed-cast: ${error.message}`);
    process.exit(1);
  }
}
