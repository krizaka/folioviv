import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { envSchema } from "./env";

const spec = readFileSync(join(__dirname, "../../../deploy/digitalocean/app.yaml"), "utf8");

/** The `- key: NAME` entries of the app spec, with their `type` and `value` lines (the spec is read line by line, as stage-deploy.test.ts does). */
function declared(): Map<string, { secret: boolean; value: string | undefined }> {
  const out = new Map<string, { secret: boolean; value: string | undefined }>();
  const lines = spec.split("\n");
  lines.forEach((line, i) => {
    const key = /^\s*- key:\s*(\S+)\s*$/.exec(line)?.[1];
    if (!key) {
      return;
    }
    let secret = false;
    let value: string | undefined;
    for (const next of lines.slice(i + 1)) {
      if (/^\s*- key:/.test(next) || /^\s*#/.test(next) || !next.trim()) {
        break;
      }
      if (/^\s*type:\s*SECRET\s*$/.test(next)) {
        secret = true;
      }
      const v = /^\s*value:\s*(.*)$/.exec(next);
      if (v) {
        value = v[1]!.trim();
      }
    }
    out.set(key, { secret, value });
  });
  return out;
}

/**
 * Keys the app reads (`envSchema`) that the dev spec deliberately does not declare, each with its reason. A key is declared in the spec
 * unless it is here: adding a variable to `env.ts` without declaring it (or justifying it here) fails this test (krizaka-internal#3249).
 */
const NOT_DECLARED: Record<string, string> = {
  APP_FIXED_NOW:
    "visual and e2e runs only (a fixed clock); honoured on dev stage, so it must never sit in the live spec",
  APP_ALLOWED_HOSTS: "optional: extra preview hosts; unset, only the spec's domains are answered",
  APP_EDGE_PROVIDER: "optional: merchant custom domains (ADR-005 §3); unset = the option cannot be used",
  APP_EDGE_API_TOKEN: "optional: only with APP_EDGE_PROVIDER, which is off on dev",
  APP_EDGE_ZONE_ID: "optional: only with APP_EDGE_PROVIDER, which is off on dev",
  APP_EDGE_CNAME_TARGET: "optional: has a default (edge.folioviv.shop)",
  APP_GEOCODER_URL: "optional: unset = Explorer's address search is off (map and list still work)",
  APP_GEOCODER_ATTRIBUTION_TEXT: "optional: only with APP_GEOCODER_URL",
  APP_GEOCODER_ATTRIBUTION_URL: "optional: only with APP_GEOCODER_URL",
  MAIL_PROVIDER:
    "mail is off on dev: it defaults to none, which keeps every mail pending; declaring it is a privacy-register step (MAIL_ is in contextsNotDeployed of docs/privacy/transfers.json)",
  MAIL_API_KEY: "mail is off on dev (MAIL_PROVIDER=none keeps every mail pending); declared the day it is turned on",
  MAIL_DOMAIN: "only with MAIL_PROVIDER=mailgun, off on dev",
  MAIL_FROM: "only with MAIL_PROVIDER=mailgun, off on dev",
  MAIL_API_URL: "has a default (Mailgun US); only with MAIL_PROVIDER=mailgun",
  ABUSE_TRUSTED_PROXY_HOPS: "has a default (1), right for App Platform",
  PAYMENTS_PRICE_KEY_FOUNDER:
    "has a default: the lookup key of the code's catalogue (price-catalogue); the price itself is data at the vendor",
  PAYMENTS_PRICE_KEY_STARTER: "has a default: the lookup key of the code's catalogue",
  PAYMENTS_PRICE_KEY_SCALE: "has a default: the lookup key of the code's catalogue",
  PAYMENTS_PRICE_KEY_ASSOCIATION: "has a default: the lookup key of the code's catalogue",
  AUTH_CALENDAR_GOOGLE_CLIENT_ID:
    "optional: a calendar provider without both halves is not offered; its flag is off by default",
  AUTH_CALENDAR_GOOGLE_CLIENT_SECRET: "optional: see AUTH_CALENDAR_GOOGLE_CLIENT_ID",
  AUTH_CALENDAR_OUTLOOK_CLIENT_ID:
    "optional: a calendar provider without both halves is not offered; its flag is off by default",
  AUTH_CALENDAR_OUTLOOK_CLIENT_SECRET: "optional: see AUTH_CALENDAR_OUTLOOK_CLIENT_ID",
  APP_FOUNDER_OFFER_ENABLED: "a flag, off by default: turned on only after a test-card checkout is proven live",
  APP_POS_ENABLED: "a flag, off by default: the point of sale stays a stub",
};

describe("the dev app spec declares every variable the app reads (krizaka-internal#3249)", () => {
  const specKeys = declared();
  const schemaKeys = Object.keys(envSchema.shape);

  it("declares every key of the env schema, or justifies it in NOT_DECLARED", () => {
    const missing = schemaKeys.filter((k) => !specKeys.has(k) && !(k in NOT_DECLARED));
    expect(
      missing,
      `declare in deploy/digitalocean/app.yaml (secrets as type: SECRET), or justify in NOT_DECLARED`,
    ).toEqual([]);
  });

  it("keeps the allow-list honest: a real schema key, not declared, with a reason", () => {
    for (const [key, reason] of Object.entries(NOT_DECLARED)) {
      expect(schemaKeys, `${key} is not in the env schema any more: remove it from NOT_DECLARED`).toContain(key);
      expect(specKeys.has(key), `${key} is declared in the spec: remove it from NOT_DECLARED`).toBe(false);
      expect(reason.length, `${key} needs a reason`).toBeGreaterThan(10);
    }
  });

  it("declares the payments webhook and its secrets (the watchdog's probe needs them)", () => {
    for (const key of [
      "PAYMENTS_PROVIDER",
      "PAYMENTS_STRIPE_SECRET_KEY",
      "PAYMENTS_STRIPE_PUBLISHABLE_KEY",
      "PAYMENTS_STRIPE_WEBHOOK_SECRET",
    ]) {
      expect(specKeys.has(key), `${key} is declared`).toBe(true);
    }
  });

  it("holds no secret value in git: a SECRET is a __NAME__ placeholder, and the payments keys are SECRETs", () => {
    for (const [key, { secret, value }] of specKeys) {
      if (secret) {
        expect(value, `${key} is a SECRET: its value is the placeholder`).toBe(`__${key}__`);
      }
    }
    for (const key of [
      "PAYMENTS_STRIPE_SECRET_KEY",
      "PAYMENTS_STRIPE_PUBLISHABLE_KEY",
      "PAYMENTS_STRIPE_WEBHOOK_SECRET",
    ]) {
      expect(specKeys.get(key)?.secret, `${key} is type: SECRET`).toBe(true);
    }
  });
});
