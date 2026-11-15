import { readFileSync } from "node:fs";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { readEnv } from "@/lib/env";

import { POST } from "./route";

afterEach(() => vi.unstubAllEnvs());

describe("sign-up is closed (krizaka-internal#3733)", () => {
  it("is closed by default: a fresh environment starts closed", () => {
    expect(readEnv({}).AUTH_SIGNUP_ENABLED).toBe(false);
  });

  it("answers 403 SIGNUP_CLOSED and creates nothing when the flag is unset", async () => {
    vi.stubEnv("AUTH_SIGNUP_ENABLED", "");
    const res = await POST();
    expect(res.status).toBe(403);
    expect((await res.json()).code).toBe("SIGNUP_CLOSED");
  });

  it("stays closed for anything but an exact true", async () => {
    vi.stubEnv("AUTH_SIGNUP_ENABLED", "yes");
    expect((await POST()).status).toBe(403);
  });

  it("the deploy file ships it closed", () => {
    const spec = readFileSync(join(__dirname, "../../../../../../deploy/digitalocean/app.yaml"), "utf8");
    const at = spec.indexOf("key: AUTH_SIGNUP_ENABLED");
    expect(at).toBeGreaterThan(-1);
    expect(spec.slice(at, at + 120)).toMatch(/value:\s*"false"/);
  });
});
