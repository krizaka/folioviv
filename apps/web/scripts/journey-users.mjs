#!/usr/bin/env node
// No junk user in a database a journey ran on (krizaka-internal#2716). Dev and local only; prints counts and journey addresses, never a secret.
// The connection comes from the environment, as for seed-cast.mjs.
//
//   pnpm --filter @folioviv/web exec tsx scripts/journey-users.mjs snapshot <file>   the users there are now, before a run
//   pnpm --filter @folioviv/web exec tsx scripts/journey-users.mjs delete <e-mail…>  delete the users a journey made (e2e-…@folioviv.test only)
//   pnpm --filter @folioviv/web exec tsx scripts/journey-users.mjs check <file>      fails when a user exists that the snapshot did not hold
//   pnpm --filter @folioviv/web exec tsx scripts/journey-users.mjs list              read-only: the users outside the cast (needs the QA_*_EMAIL of the dev cast)
import { readFileSync, writeFileSync } from "node:fs";

import { createDb, pg, poolConfig } from "@folioviv/db";
import { assertNoJunkUsers, deleteJourneyUsers, directoryOwners, usersOutsideCast } from "@folioviv/db/demo-clean";

import { assertNotProduction, castEmails, DEMO_CAST, isCastAddress } from "./seed-cast.mjs";

/** What each command does with the database; `args` are the words after the command. */
export const COMMANDS = {
  async snapshot(db, [file]) {
    const users = await usersOutsideCast(db, []);
    writeFileSync(file, JSON.stringify(users));
    return `journey-users: ${users.length} user(s) before the run`;
  },
  async delete(db, emails) {
    return `journey-users: ${await deleteJourneyUsers(db, emails, DEMO_CAST)} journey user(s) deleted`;
  },
  async check(db, [file]) {
    const before = JSON.parse(readFileSync(file, "utf8"));
    assertNoJunkUsers(before, await usersOutsideCast(db, []));
    return "journey-users: no user left behind";
  },
  async list(db) {
    const directory = new Set(await directoryOwners(db));
    const exact = castEmails(process.env);
    const stray = (await usersOutsideCast(db, [])).filter((e) => !directory.has(e) && !isCastAddress(e, exact));
    const names = stray.length ? `: ${stray.join(", ")}` : "";
    const apart = directory.size
      ? ` (besides ${directory.size} demo-directory shop owner(s), <slug>@folioviv.test)`
      : "";
    return `journey-users: ${stray.length} user(s) outside the cast${names}${apart}`;
  },
};

async function main() {
  assertNotProduction(process.env);
  const [command, ...args] = process.argv.slice(2);
  const run = Object.hasOwn(COMMANDS, command) ? COMMANDS[command] : undefined;
  if (!run) {
    throw new Error("usage: journey-users.mjs snapshot <file> | delete <e-mail…> | check <file> | list");
  }
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("the database address is required");
  }
  const pool = new pg.Pool(poolConfig(url, process.env.DATABASE_CA_CERT, 2));
  try {
    console.log(await run(createDb(pool), args));
  } finally {
    await pool.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(`journey-users: ${error.message}`);
    process.exit(1);
  });
}
