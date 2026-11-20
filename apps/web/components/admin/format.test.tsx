import { describe, expect, it } from "vitest";
import { formatDate } from "./format";

describe("admin formatDate", () => {
  it("writes an instant in the console's zone, whatever the machine's zone (no hydration mismatch)", () => {
    const out = formatDate("2026-11-17T05:17:00Z", "en", true);
    expect(out).toContain("Nov 17, 2026");
    expect(out).toMatch(/12:17\s*a\.m\./);
  });

  it("keeps a date-only value on its own day", () => {
    expect(formatDate("2026-10-01", "en")).toContain("Oct 1, 2026");
  });
});
