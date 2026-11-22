import { describe, expect, it } from "vitest";

import { driftReport, WATCHED_SCHEMAS } from "./schema-drift";

const expected = {
  tables: { "public.accounts": ["email", "id"], "organize.tag": ["id", "name"] },
  config: { "public.price_versions": ["folioviv.starter"] },
};

describe("the live dev schema against schema-expected.json", () => {
  it("watches the three application schemas", () => expect([...WATCHED_SCHEMAS]).toEqual(["organize", "privacy", "public"]));

  it("says « no drift » and does not fail when the schema is right", () => {
    expect(driftReport(expected, expected)).toEqual({ drifted: false, line: "no drift" });
  });

  it("names a missing column and fails", () => {
    const actual = { ...expected, tables: { ...expected.tables, "public.accounts": ["id"] } };
    expect(driftReport(expected, actual)).toEqual({
      drifted: true,
      line: "drift: missing column public.accounts.email",
    });
  });

  it("names an extra table and fails", () => {
    const actual = { ...expected, tables: { ...expected.tables, "public.extra": ["x"] } };
    expect(driftReport(expected, actual)).toEqual({ drifted: true, line: "drift: unexpected table public.extra" });
  });

  it("ignores a table of a schema it does not watch", () => {
    const actual = { ...expected, tables: { ...expected.tables, "other.thing": ["x"] } };
    expect(driftReport(expected, actual).drifted).toBe(false);
  });

  it("joins several problems on one line", () => {
    const actual = { tables: { "public.accounts": ["id"] }, config: expected.config };
    expect(driftReport(expected, actual).line).toBe(
      "drift: missing column public.accounts.email; missing table organize.tag",
    );
  });
});
