import { readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

// krizaka-restricted#316 (founder, 2026-11-07): ADRs are at least internal, so this public repository keeps only the stub README.
describe("the ADRs stay out of this public repository", () => {
  it("docs/adr holds the stub README and nothing else", () => {
    expect(readdirSync(new URL("../docs/adr/", import.meta.url))).toEqual(["README.md"]);
  });
});
