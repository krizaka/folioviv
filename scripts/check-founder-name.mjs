#!/usr/bin/env node
/* The « Founder name guard » job of ci.yml (rule public-no-founder-name, krizaka-restricted#375): no public file names the founder,
   compared by keyed HMAC against the Actions secret FOUNDER_NAME_GUARD. Needs no install. Exit 1 names the files, never the word;
   without the secret it fails when FOUNDER_NAME_GUARD_REQUIRED=true and skips otherwise. */
import { filesNamingFounder, guardFrom } from "./lib/founder-name-guard.mjs";
import { publicTexts } from "./lib/public-surface.mjs";

try {
  const outcome = guardFrom(process.env);
  if (outcome.skipped) {
    console.warn(`::warning::${outcome.skipped}`);
  } else {
    const files = publicTexts();
    const offenders = filesNamingFounder(files, outcome.guard);
    for (const f of offenders)
      console.error(`::error file=${f}::this public file names the founder (rule public-no-founder-name)`);
    console.log(`founder name: ${files.length} public files, ${offenders.length} naming the founder`);
    if (offenders.length > 0) process.exitCode = 1;
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
