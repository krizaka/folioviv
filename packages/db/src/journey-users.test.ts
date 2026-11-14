import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  assertNoJunkUsers,
  type DemoCast,
  deleteJourneyUsers,
  directoryOwners,
  isJourneyAddress,
  usersOutsideCast,
} from "./demo-clean";
import { joinShop } from "./service-shop";
import { freshDatabase } from "./test/db";
import { account, walkerShop } from "./test/fixtures";

let t: Awaited<ReturnType<typeof freshDatabase>>;
beforeAll(async () => {
  t = await freshDatabase();
});
afterAll(async () => t.drop());

const guestJourney = async (shopId: string, email: string) => {
  const guest = await account(t.db, email);
  await joinShop(t.db, guest.id, guest.email, shopId, {
    fullName: "Camille Roy",
    phone: "514-555-0100",
    language: "en",
    consentService: true,
    consentReminders: false,
  });
};

describe("the teardown check: no junk user in the database (real PostgreSQL 16)", () => {
  it("fails a journey that creates a user and does not delete it, passes once it deletes it", async () => {
    const s = await walkerShop(t.db);
    // The cast of this database: every account the fixtures made. The check starts from « none outside it ».
    const known = await usersOutsideCast(t.db, []);
    const cast: DemoCast = { shopSlug: "pattes-a", clients: known.map((email) => ({ email, dogs: [] })) };
    const before = await usersOutsideCast(t.db, known);
    expect(before).toEqual([]);

    const email = "e2e-guest-en-1@folioviv.test";
    await guestJourney(s.shopId, email);
    const left = await usersOutsideCast(t.db, known);
    expect(() => assertNoJunkUsers(before, left)).toThrow(
      /left 1 user\(s\) outside the cast: e2e-guest-en-1@folioviv\.test/,
    );

    expect(await deleteJourneyUsers(t.db, [email], cast)).toBe(1);
    const after = await usersOutsideCast(t.db, known);
    expect(() => assertNoJunkUsers(before, after)).not.toThrow();
  });

  it("refuses to delete an address that is not a journey one", async () => {
    await expect(
      deleteJourneyUsers(t.db, ["lea.beaulieu@folioviv.test"], { shopSlug: "x", clients: [] }),
    ).rejects.toThrow(/not journey addresses/);
    expect(isJourneyAddress("e2e-honest-12@folioviv.test")).toBe(true);
    expect(isJourneyAddress("ines.debut@folioviv.test")).toBe(false);
    expect(isJourneyAddress("e2e-x@example.com")).toBe(false);
  });

  it("tells the demo directory's shop owners (<slug>@folioviv.test) from the strays", async () => {
    const s = await walkerShop(t.db, "dir");
    expect(await directoryOwners(t.db)).toEqual([]);
    await t.db.execute(
      sql`UPDATE accounts SET email = ${"directory-x@folioviv.test"} WHERE id = (SELECT owner_id FROM shops WHERE id = ${s.shopId})`,
    );
    await t.db.execute(sql`UPDATE shops SET slug = 'directory-x' WHERE id = ${s.shopId}`);
    expect(await directoryOwners(t.db)).toEqual(["directory-x@folioviv.test"]);
  });
});
