import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const spec = readFileSync(join(__dirname, "../../../deploy/digitalocean/app.yaml"), "utf8");

/**
 * The alert rules DigitalOcean accepts at the app scope of this spec. Two refusals fixed this set (krizaka-internal#4233):
 * `JOB_FAILED` is not a valid rule at all (#812), and `JOB_INVOCATION_FAILED` "is not supported at the component scope"
 * (apply run https://github.com/krizaka/.github/actions/runs/45053819594), so a job's failure is alerted here, never in `jobs[].alerts`.
 */
const APP_ALERT_RULES = new Set(["DEPLOYMENT_FAILED", "DOMAIN_FAILED", "JOB_INVOCATION_FAILED"]);

/** The lines of a top-level key's block (up to the next top-level key). */
function block(key: string): string[] {
  const lines = spec.split("\n");
  const start = lines.findIndex((l) => l === `${key}:`);
  if (start < 0) {
    return [];
  }
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => /^\S/.test(l) && !l.startsWith("#"));
  return end < 0 ? rest : rest.slice(0, end);
}

describe("the dev app spec only declares alerts DigitalOcean accepts (krizaka-internal#4233)", () => {
  it("declares no alert on a job: the job rules are refused at the component scope", () => {
    const jobAlerts = block("jobs").filter((l) => /^\s+alerts:/.test(l));
    expect(jobAlerts, "move the rule to the app-level `alerts:`").toEqual([]);
  });

  it("uses only accepted rules at the app scope", () => {
    const rules = block("alerts")
      .map((l) => /^\s*- rule:\s*(\S+)\s*$/.exec(l)?.[1])
      .filter((r): r is string => Boolean(r));
    expect(rules.length).toBeGreaterThan(0);
    for (const rule of rules) {
      expect(APP_ALERT_RULES.has(rule), `${rule} is not accepted by DigitalOcean at the app scope`).toBe(true);
    }
  });
});
