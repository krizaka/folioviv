import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Dependabot alerts closed by krizaka-internal#3222: the lockfile must not resolve a version below the patched one again.
const lock = readFileSync(new URL("../pnpm-lock.yaml", import.meta.url), "utf8");
const resolved = (name) =>
  [...lock.matchAll(new RegExp(`^  '?${name.replace("/", "\\/")}@(\\d+\\.\\d+\\.\\d+)(?=[':(])`, "gm"))].map((m) => m[1]);
const cmp = (a, b) => {
  const [x, y] = [a, b].map((v) => v.split(".").map(Number));
  return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
};

describe("pnpm-lock.yaml holds no version below the patched one", () => {
  it.each([
    ["node-forge", "1.4.3"],
    ["seroval", "1.6.11"],
    ["seroval-plugins", "1.6.11"],
    ["@vitest/mocker", "4.1.12"],
  ])("%s >= %s", (name, patched) => {
    const versions = resolved(name);
    expect(versions.length).toBeGreaterThan(0);
    for (const v of versions) expect(cmp(v, patched)).toBeGreaterThanOrEqual(0);
  });

  it("zod 4 >= 4.6.6 (no zod 3 left)", () => {
    const versions = resolved("zod");
    expect(versions.filter((v) => v.startsWith("3."))).toEqual([]);
    for (const v of versions) expect(cmp(v, "4.6.6")).toBeGreaterThanOrEqual(0);
  });

  it("glob is never in 9.0.0-14.0.1", () => {
    for (const v of resolved("glob")) expect(cmp(v, "9.0.0") < 0 || cmp(v, "14.0.2") >= 0).toBe(true);
  });
});
