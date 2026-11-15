import { describe, expect, it } from "vitest";

import { castOf } from "@krizaka/org";

import {
  castAddress,
  castEmails,
  FIXTURE_PERSONAS,
  fixturePersona,
  isCastAddress,
  nameFixtureAccounts,
  personaEmails,
} from "../scripts/seed-cast.mjs";

const eric = { id: "eric" };
const SHARED = "postgresql://u:p@db.dev.example:5432/app";

describe("the seed's cast addresses (krizaka-internal#2716)", () => {
  it("never falls back to a built-in address on a shared host: it asks for the e-mail from the environment", () => {
    expect(() => castAddress({ DATABASE_URL: SHARED }, "QA_USER_EMAIL", eric)).toThrow(/no built-in address/);
    expect(() => castEmails({ DATABASE_URL: SHARED })).toThrow(/no built-in address/);
  });

  it("takes the e-mail from QA_*_EMAIL or from the APP_QA_* secret's name, lower-cased", () => {
    expect(castAddress({ DATABASE_URL: SHARED, QA_USER_EMAIL: " Eric@X.test " }, "QA_USER_EMAIL", eric)).toBe(
      "eric@x.test",
    );
    expect(castAddress({ DATABASE_URL: SHARED, APP_QA_USER_EMAIL: "e@x.test" }, "QA_USER_EMAIL", eric)).toBe(
      "e@x.test",
    );
  });

  it("gives a database on this machine the persona's own fictional address", () => {
    expect(castAddress({ DATABASE_URL: "postgres://u:p@localhost:5432/x" }, "QA_USER_EMAIL", eric)).toBe(
      "eric@demo.folioviv.test",
    );
  });
});

describe("the seed maps every fixture account to a persona of the cast (krizaka-internal#2716)", () => {
  const LOCAL = { DATABASE_URL: "postgres://u:p@localhost:5432/x" };

  it("names only personas the cast holds, by local part", () => {
    const ids = new Set(castOf("folioviv").map((p) => p.id));
    for (const [local, id] of Object.entries(FIXTURE_PERSONAS)) {
      expect(ids.has(id), `${local} → ${id}`).toBe(true);
      expect(local).not.toContain("@");
    }
  });

  it("covers the owner-state and studio accounts, on the seed's domain and on a deployment's own test domain", () => {
    expect(fixturePersona("contact.uniqueclient@folioviv.test")).toBe("hugo");
    expect(fixturePersona("Ines.Debut@akinaza.test")).toBe("ines-debut");
    expect(fixturePersona("yan.seul@folioviv.test")).toBe("yan");
    expect(fixturePersona("contact.cafedupark@akinaza.test")).toBe("marie-eve");
  });

  it("never takes a real domain: the same local part on .com is not a persona", () => {
    expect(fixturePersona("yan.seul@example.com")).toBeUndefined();
    expect(isCastAddress("yan.seul@example.com", [])).toBe(false);
    expect(isCastAddress("e2e-guest-en-1@folioviv.test", [])).toBe(false);
    expect(isCastAddress("lea.beaulieu@akinaza.test", [])).toBe(true);
    expect(isCastAddress("someone@x.com", ["someone@x.com"])).toBe(true);
  });

  it("takes the addresses kept in the secrets (Philippe, Myriam) only when they are given", () => {
    expect(personaEmails(LOCAL)).toEqual({});
    const given = personaEmails({ ...LOCAL, APP_QA_PHILIPPE_EMAIL: " P@x.test ", QA_MYRIAM_EMAIL: "m@x.test" });
    expect(given["p@x.test"]).toBe("philippe");
    expect(given["m@x.test"]).toBe("myriam");
    expect(castEmails({ ...LOCAL, QA_MYRIAM_EMAIL: "m@x.test" })).toContain("m@x.test");
  });

  it("names an account that has no name, with its persona's name, language and avatar", async () => {
    const calls: [string, unknown[]][] = [];
    const named = await nameFixtureAccounts(async (sql: string, values: unknown[]) => {
      calls.push([sql, values]);
      return { rowCount: values[0] === "yan.seul" ? 1 : 0 };
    }, LOCAL);
    expect(named).toBe(1);
    const yan = calls.find((c) => c[1][0] === "yan.seul")!;
    expect(yan[1]).toEqual(["yan.seul", "Yan Cloutier", "fr", "boom-bap"]);
    expect(yan[0]).toContain("name IS NULL");
    expect(yan[0]).toContain(".test");
  });
});
