import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// One repository switch, `CI_SLEEP` (README, « CI sleep »): while it is `true` every scheduled run and every heavy job skips, and the
// required checks still report. A new workflow must say which side it is on.
const DIR = new URL("../.github/workflows/", import.meta.url);
const files = readdirSync(DIR).filter((f) => f.endsWith(".yml"));
const code = (f) => readFileSync(new URL(f, DIR), "utf8").replace(/^\s*#.*$/gm, "");

// Heavy or scheduled: the file must test vars.CI_SLEEP.
const SLEEPS = [
  "ci.yml", // the image and build legs only
  "desktop.yml",
  "download-videos.yml",
  "e2e-pricing.yml",
  "journeys.yml",
  "lang-guards.yml",
  "mobile-ci.yml",
  "scorecard.yml",
  "visual.yml",
];
// Fast, required, or on demand and cheap: they never sleep.
const AWAKE = [
  "bump-krizaka.yml",
  "dependabot-automerge.yml",
  "docs-map.yml",
  "merge-resolution.yml",
  "release-notes.yml",
  "security.yml",
  "update-visual-baselines.yml",
];

describe("the CI_SLEEP switch", () => {
  it("classifies every workflow as sleeping or awake", () => {
    expect([...SLEEPS, ...AWAKE].sort()).toEqual([...files].sort());
  });

  it.each(SLEEPS)("%s tests vars.CI_SLEEP", (f) => {
    expect(code(f)).toMatch(/vars\.CI_SLEEP (==|!=) 'true'/);
  });

  it("every scheduled workflow sleeps", () => {
    for (const f of files) if (/^\s*schedule:/m.test(code(f))) expect(SLEEPS, f).toContain(f);
  });

  it("every job of a sleeping standalone workflow carries the condition", () => {
    for (const f of ["download-videos.yml", "e2e-pricing.yml", "scorecard.yml", "lang-guards.yml", "desktop.yml"]) {
      const jobs = code(f)
        .split(/^jobs:\n/m)[1]
        .split(/^ {2}(?=[a-z][\w-]*:\n)/m)
        .filter((j) => j.trim());
      for (const job of jobs) expect(job, `${f}: ${job.split("\n")[0]}`).toContain("vars.CI_SLEEP != 'true'");
    }
  });

  it("the awake workflows never mention the switch", () => {
    for (const f of AWAKE) expect(code(f), f).not.toContain("CI_SLEEP");
  });

  it("the required checks still report while asleep", () => {
    // journeys / gate: a stand-in with the literal name, since a skipped caller never produces it.
    const journeys = code("journeys.yml");
    expect(journeys).toMatch(
      /\n {2}journeys-asleep:\n {4}name: journeys \/ gate\n {4}if: \$\{\{ vars\.CI_SLEEP == 'true' \}\}/,
    );
    // visual / Visual regression and mobile-e2e / gate: the org's changes gate answers « nothing relevant », the gates always report; the caller is never skipped.
    expect(code("visual.yml")).toContain("relevant: ${{ vars.CI_SLEEP == 'true' && '^$' ||");
    const mobile = code("mobile-ci.yml");
    expect(mobile.match(/relevant: \$\{\{ vars\.CI_SLEEP == 'true' && '\^\$' \|\|/g)).toHaveLength(2);
    expect(code("visual.yml")).not.toMatch(/\n {4}if:/);
    // ci / CI gate: lint, typecheck, tests and Sonar are untouched; only the image, the build and the after-build script follow the switch.
    const ci = code("ci.yml");
    expect(ci).toContain("container: ${{ vars.CI_SLEEP != 'true' }}");
    expect(ci).not.toMatch(/\n {4}if:/);
    expect(ci).toMatch(/test-script: test:coverage/);
  });
});
