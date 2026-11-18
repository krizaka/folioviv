import { test } from "vitest";
import { randomBytes } from "node:crypto";
import assert from "node:assert/strict";
import {
  filesNamingFounder,
  GuardErrorCode,
  guardFrom,
  makeSecret,
  namesFounder,
  parseGuard,
} from "./lib/founder-name-guard.mjs";
import { publicPaths, publicTexts } from "./lib/public-surface.mjs";

// Founder decision, 2026-11-05 (rule public-no-founder-name): no founder name on a public surface. Nothing derived from the name is
// in this repository (krizaka-restricted#375): the words are compared by their HMAC under the key of the Actions secret
// FOUNDER_NAME_GUARD. The matcher is proven on a fictional word under a throwaway key; the scan runs with the real secret in the
// « Founder name guard » job of ci.yml, and fails closed there when the secret is missing (FOUNDER_NAME_GUARD_REQUIRED=true).

const sample = parseGuard(makeSecret(["Zorblax", "quinn vantablack"], randomBytes(32)));

test("the matcher finds a refused word, alone, in a pair or glued as a handle, and nothing else", () => {
  assert.equal(namesFounder("Written by ZORBLAX.", sample), true);
  assert.equal(namesFounder("by Quinn\nVantablack", sample), true);
  assert.equal(namesFounder("@quinnvantablack on GitHub", sample), true);
  assert.equal(namesFounder("Quinn alone, Vantablack alone", sample), false);
  assert.equal(namesFounder("Technologies Krizaka Inc.", sample), false);
});

test("without the secret the guard fails closed where it is required, and skips elsewhere", () => {
  assert.throws(
    () => guardFrom({ FOUNDER_NAME_GUARD_REQUIRED: "true" }),
    (e) => e.code === GuardErrorCode.missing,
  );
  assert.match(guardFrom({}).skipped, /skipped/);
});

test("the scan names the files, never the word", () => {
  const entries = [
    ["README.md", "Made in Montréal"],
    ["apps/web/messages/fr.json", '{"by": "Zorblax"}'],
  ];
  assert.deepEqual(filesNamingFounder(entries, sample), ["apps/web/messages/fr.json"]);
});

test("the public surface is the root documents, the manifests and the web app's public folders", () => {
  const listed = [
    "README.md",
    "apps/web/app/page.tsx",
    "apps/web/lib/db.ts",
    "packages/x/package.json",
    "docs/a.md",
    "NOTICE",
  ];
  assert.deepEqual(publicPaths(listed), ["README.md", "apps/web/app/page.tsx", "packages/x/package.json", "NOTICE"]);
});

test("a malformed secret always fails, and never echoes its value", () => {
  const raw = "not json {zorblax}";
  assert.throws(
    () => guardFrom({ FOUNDER_NAME_GUARD: raw }),
    (e) => e.code === GuardErrorCode.malformed && !e.message.includes("zorblax"),
  );
});

const outcome = guardFrom(process.env);
if (outcome.skipped) console.warn(`::warning::${outcome.skipped}`);

test.skipIf(Boolean(outcome.skipped))("a public surface names the founder nowhere", () => {
  const files = publicTexts();
  assert.ok(files.length > 5, "the scan finds the public files");
  assert.deepEqual(filesNamingFounder(files, outcome.guard), []);
});
