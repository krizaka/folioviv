import { describe, expect, it } from "vitest";

import { castAddress, castEmails } from "../scripts/seed-cast.mjs";

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
