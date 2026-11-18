#!/usr/bin/env node
/* The founder-name guard (rule public-no-founder-name; krizaka-restricted#375). The repository is public, so it holds nothing
   derived from the name: no word, no hash. The words to refuse live only in the Actions secret FOUNDER_NAME_GUARD, as keyed
   HMAC-SHA-256 digests with their key: {"key": "<hex>", "hmacs": ["<hex>", ...]}. The check computes HMAC(key, token) for every
   word and every pair of adjacent words of a text and refuses a match; it reports that a text names the founder, never which word.

   Without the secret the guard fails closed when FOUNDER_NAME_GUARD_REQUIRED is "true" (CI on main, in the merge queue and on a
   pull request of this repository); it skips only where secrets cannot exist (a fork's pull request, a contributor's machine).

   The value of the secret is made on the founder's machine, the words read from stdin (never an argument, never in a history):
     node scripts/lib/founder-name-guard.mjs make-secret | gh secret set FOUNDER_NAME_GUARD --org krizaka --visibility selected --repos krizaka-agents-site,folioviv
   One word or handle per line, then Ctrl-D. A pair of words (« first last ») may be given on one line: it is refused as a pair and glued (a handle). */
import { createHmac, randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";

export const GUARD_ENV = "FOUNDER_NAME_GUARD";
export const REQUIRED_ENV = "FOUNDER_NAME_GUARD_REQUIRED";

export const GuardErrorCode = /** @type {const} */ ({
  missing: "FOUNDER_NAME_GUARD_MISSING",
  malformed: "FOUNDER_NAME_GUARD_MALFORMED",
});

export class FounderNameGuardError extends Error {
  /** @param {(typeof GuardErrorCode)[keyof typeof GuardErrorCode]} code */
  constructor(code, message) {
    super(`${code}: ${message}`);
    this.code = code;
  }
}

const HEX = /^[0-9a-f]+$/;
const digest = (key, text) => createHmac("sha256", key).update(text).digest("hex");
const tokens = (text) => text.toLowerCase().match(/\p{L}+/gu) ?? [];

/** The guard held by the secret's value. Throws FOUNDER_NAME_GUARD_MALFORMED (without echoing the value) when it is not one. */
export function parseGuard(raw) {
  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new FounderNameGuardError(GuardErrorCode.malformed, `${GUARD_ENV} is not JSON`);
  }
  const { key, hmacs } = value ?? {};
  if (typeof key !== "string" || key.length < 64 || !HEX.test(key))
    throw new FounderNameGuardError(GuardErrorCode.malformed, "the key must be at least 32 bytes of hex");
  if (
    !Array.isArray(hmacs) ||
    hmacs.length === 0 ||
    !hmacs.every((h) => typeof h === "string" && h.length === 64 && HEX.test(h))
  )
    throw new FounderNameGuardError(
      GuardErrorCode.malformed,
      "hmacs must be a non-empty list of HMAC-SHA-256 hex digests",
    );
  return { key: Buffer.from(key, "hex"), hmacs: new Set(hmacs) };
}

/**
 * The guard from an environment (passed in, never read here from the process): { guard } when the secret is set,
 * { skipped: reason } when it is absent and not required, and FOUNDER_NAME_GUARD_MISSING when it is absent and required.
 */
export function guardFrom(env) {
  const raw = env[GUARD_ENV];
  if (raw) return { guard: parseGuard(raw) };
  if (env[REQUIRED_ENV] === "true")
    throw new FounderNameGuardError(
      GuardErrorCode.missing,
      `${GUARD_ENV} is required here and is not set: the check cannot pass without it`,
    );
  return { skipped: `${GUARD_ENV} is not set (a fork or a local run): the founder-name check is skipped` };
}

/** Does the text name the founder? Every word, and every pair of adjacent words (« a b » and « ab »), is compared by its HMAC. */
export function namesFounder(text, guard) {
  const words = tokens(String(text));
  const seen = (candidate) => guard.hmacs.has(digest(guard.key, candidate));
  return words.some((w, i) => seen(w) || (i > 0 && (seen(`${words[i - 1]} ${w}`) || seen(`${words[i - 1]}${w}`))));
}

/** The paths of the [path, text] entries that name the founder (the paths only: never the word). */
export const filesNamingFounder = (entries, guard) =>
  entries.filter(([, text]) => namesFounder(text, guard)).map(([path]) => path);

/** The secret's value for these words (lower-cased, one per entry), under a fresh random key unless one is given. */
export function makeSecret(words, key = randomBytes(32)) {
  const entries = words.map(tokens).filter((t) => t.length > 0);
  const list = [...new Set(entries.flatMap((t) => (t.length > 1 ? [t.join(" "), t.join("")] : t)))];
  if (list.length === 0) throw new FounderNameGuardError(GuardErrorCode.malformed, "no word given");
  return JSON.stringify({ key: key.toString("hex"), hmacs: list.map((w) => digest(key, w)) });
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv[2] !== "make-secret") {
    console.error("usage: node scripts/lib/founder-name-guard.mjs make-secret < words (one per line)");
    process.exit(2);
  }
  process.stdout.write(makeSecret((await readStdin()).split("\n")));
}
