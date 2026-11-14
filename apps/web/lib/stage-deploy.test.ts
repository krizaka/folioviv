import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { readEnv } from "./env";

const dir = join(__dirname, "../../../deploy/digitalocean");
const spec = readFileSync(join(dir, "app.yaml"), "utf8");

describe("the stage of the deployment (folioviv#440)", () => {
  it("is dev by default and prod only when said, nothing else", () => {
    expect(readEnv({}).APP_ENVIRONMENT).toBe("dev");
    expect(readEnv({ APP_ENVIRONMENT: "prod" }).APP_ENVIRONMENT).toBe("prod");
    expect(() => readEnv({ APP_ENVIRONMENT: "staging" })).toThrow();
  });

  it("the dev app spec sets the stage to dev, at build too (the pages are static)", () => {
    // Read line by line: the entry runs from its key to the next key or comment.
    const lines = spec.split("\n");
    const start = lines.findIndex((l) => l.trim() === "- key: APP_ENVIRONMENT");
    expect(start, "APP_ENVIRONMENT is declared").toBeGreaterThanOrEqual(0);
    const rest = lines.slice(start + 1);
    const end = rest.findIndex((l) => l.trim().startsWith("#") || l.trim().startsWith("- key"));
    const block = (end < 0 ? rest : rest.slice(0, end)).join("\n");
    expect(block).toContain("scope: RUN_AND_BUILD_TIME");
    expect(block).toContain('value: "dev"');
  });

  it("no production spec exists yet: the day one does, it must say prod, which hides the notice", () => {
    expect(readdirSync(dir).filter((f) => f.startsWith("prod"))).toEqual([]);
  });

  it("refuses a commercial www host on the dev app (ADR-037 §1, krizaka-internal#3503)", () => {
    // Only the declarations count (a domain, an ingress authority, a URL or a host list value), not the comments.
    const code = spec.split("\n").filter((l) => !l.trim().startsWith("#"));
    const commercial = code.filter((l) => /(^|[\s/"'=,:])www\.[a-z0-9-]+\.com\b/i.test(l));
    expect(commercial, "a dev app must not declare a www.<brand>.com host").toEqual([]);
    expect(code.join("\n")).toMatch(/- domain: dev\.folioviv\.com\n\s+type: PRIMARY/);
  });
});
