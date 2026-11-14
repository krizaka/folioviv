import { test } from "node:test";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

// Founder decision, 2026-11-05 (rule public-no-founder-name): no founder name on a public surface. The name is never written in
// this repository, not even here: the test holds the SHA-256 of each lowercase word of it and hashes the words of every file.
const NAME_WORD_HASHES = new Set([
  "86e08046be6344c1487dfaefe42a67f0fff79414916b0dfcdbb18cab0201a014",
  "a954e93925dca619a33955a410991a9ba133bd5ea18075caf0d6849455c6537e",
]);

const PUBLIC =
  /^(README|LICENSE|NOTICE|SECURITY|CONTRIBUTING)[^/]*$|(^|\/)package\.json$|^apps\/web\/(messages|content|public|app|components)\//;
const TEXT = /\.(md|mdx|txt|json|ts|tsx|mjs|js|html|yml|yaml)$|^[A-Z]+$/;

const sha = (word) => createHash("sha256").update(word).digest("hex");
const namesFounder = (text) => (text.toLowerCase().match(/[\p{L}]+/gu) ?? []).some((w) => NAME_WORD_HASHES.has(sha(w)));

test("a public surface names the founder nowhere", () => {
  const files = execFileSync("git", ["ls-files"], { encoding: "utf8" })
    .split("\n")
    .filter((f) => PUBLIC.test(f) && TEXT.test(f));
  assert.ok(files.length > 5, "the scan finds the public files");
  const offenders = files.filter((f) => !/\.test\.[cm]?[jt]sx?$/.test(f) && namesFounder(readFileSync(f, "utf8")));
  assert.deepEqual(offenders, []);
});

test("the matcher finds a name word and ignores the others", () => {
  assert.equal(namesFounder("Technologies Krizaka Inc."), false);
  assert.equal(namesFounder(`by ${"x"}`), false);
});
