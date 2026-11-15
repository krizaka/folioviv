import { hashPassword } from "@krizaka/auth";
import { describe, expect, it } from "vitest";

import { assertQaPersonasSignIn, qaSignInProblems } from "../scripts/qa-sign-in-guard.mjs";
import { castAddress, ensureStaffAccount, moveWalkerToQaAddress, walkerAddress } from "../scripts/seed-cast.mjs";

const SHARED = "postgresql://u:p@db.dev.example:5432/app";
const LONG = "a-long-password-1";
const ENV = {
  DATABASE_URL: SHARED,
  QA_USER_EMAIL: "eric@x.test",
  QA_USER_PASSWORD: LONG,
  QA_ADMIN_EMAIL: "mira@x.test",
  QA_ADMIN_PASSWORD: LONG,
  QA_WALKER_EMAIL: "lea@x.test",
  QA_WALKER_PASSWORD: LONG,
};

const accountsOf = async (rows: Record<string, { status: string; password: string }>) => {
  const hashed = Object.fromEntries(
    await Promise.all(
      Object.entries(rows).map(async ([e, r]) => [
        e,
        { status: r.status, passwordHash: await hashPassword(r.password) },
      ]),
    ),
  );
  return async (email: string) => hashed[email];
};

describe("the seed's guard: every QA persona signs in (krizaka-internal#3827)", () => {
  it("is quiet when ERIC, MIRA and WALKER sign in (CAMILLE is checked only when the seed was given her)", async () => {
    const find = await accountsOf({
      "eric@x.test": { status: "ACTIVE", password: LONG },
      "mira@x.test": { status: "ACTIVE", password: LONG },
      "lea@x.test": { status: "ACTIVE", password: LONG },
    });
    expect(await qaSignInProblems(ENV, find)).toEqual([]);
  });

  it("names the persona that has no account, a disabled one and a wrong password", async () => {
    const find = await accountsOf({
      "eric@x.test": { status: "DISABLED", password: LONG },
      "mira@x.test": { status: "ACTIVE", password: "another-password-9" },
    });
    expect(await qaSignInProblems({ ...ENV, QA_STAFF_EMAIL: "camille@x.test", QA_STAFF_PASSWORD: LONG }, find)).toEqual(
      [
        { name: "ERIC", reason: "account disabled" },
        { name: "CAMILLE", reason: "no account at its address" },
        { name: "MIRA", reason: "the password does not match" },
        { name: "WALKER", reason: "no account at its address" },
      ],
    );
  });

  it("fails the seed with the persona's name and never prints an address or a password", async () => {
    const find = await accountsOf({
      "eric@x.test": { status: "ACTIVE", password: LONG },
      "mira@x.test": { status: "ACTIVE", password: LONG },
    });
    const error = await assertQaPersonasSignIn(ENV, find).catch((e: Error) => e);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain("WALKER (no account at its address)");
    expect((error as Error).message).not.toContain("lea@x.test");
    expect((error as Error).message).not.toContain(LONG);
  });

  it("fails a persona the seed was given nothing for", async () => {
    expect(await qaSignInProblems({ DATABASE_URL: SHARED }, async () => undefined)).toEqual([
      { name: "ERIC", reason: "no address or password given to the seed" },
      { name: "MIRA", reason: "no address or password given to the seed" },
      { name: "WALKER", reason: "no address or password given to the seed" },
    ]);
  });
});

describe("the demo owner's address", () => {
  it("is the QA address from the environment, lower-cased, also under the secret's name", () => {
    expect(walkerAddress({ DATABASE_URL: SHARED, QA_WALKER_EMAIL: " Lea@X.test " })).toBe("lea@x.test");
    expect(walkerAddress({ DATABASE_URL: SHARED, APP_QA_WALKER_EMAIL: "lea@x.test" })).toBe("lea@x.test");
  });

  it("keeps the seed's own address on this machine only: a shared host never guesses it", () => {
    expect(walkerAddress({ DATABASE_URL: "postgres://u:p@localhost:5432/x" })).toBe("lea.beaulieu@folioviv.test");
    expect(() => walkerAddress({ DATABASE_URL: SHARED })).toThrow(/QA_WALKER_EMAIL/);
    expect(() => castAddress({ DATABASE_URL: SHARED }, "QA_WALKER_EMAIL", { id: "lea" })).toThrow(
      /no built-in address/,
    );
  });

  it("moves the account that holds the shop to the QA address, once and only when the QA address is free", async () => {
    const calls: unknown[][] = [];
    const query = async (sql: string, values: unknown[]) => {
      calls.push([sql, values]);
      return { rowCount: calls.length === 1 ? 1 : 0 };
    };
    expect(await moveWalkerToQaAddress(query, "lea@x.test")).toBe(true);
    expect(calls[0]![1]).toEqual(["lea@x.test", "lea.beaulieu@folioviv.test"]);
    expect(String(calls[0]![0])).toContain("NOT EXISTS");
    expect(await moveWalkerToQaAddress(query, "lea@x.test")).toBe(false);
    expect(await moveWalkerToQaAddress(query, "lea.beaulieu@folioviv.test")).toBe(false);
    expect(calls).toHaveLength(2);
  });

  it("makes CAMILLE's sign-in only when the environment names her", async () => {
    const seen: unknown[][] = [];
    const query = async (_sql: string, values: unknown[]) => seen.push(values);
    expect(await ensureStaffAccount(query, {})).toBe(false);
    expect(seen).toHaveLength(0);
    expect(await ensureStaffAccount(query, { QA_STAFF_EMAIL: " Camille@X.test ", QA_STAFF_PASSWORD: LONG })).toBe(true);
    expect(seen[0]![0]).toBe("camille@x.test");
    await expect(ensureStaffAccount(query, { QA_STAFF_EMAIL: "c@x.test", QA_STAFF_PASSWORD: "short" })).rejects.toThrow(
      /12/,
    );
  });
});
