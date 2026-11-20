import { describe, expect, it } from "vitest";

import { bindProduct } from "@/lib/brand";
import enRaw from "@/messages/en.json";
import frRaw from "@/messages/fr.json";

import {
  CANADIAN_CHOICES,
  choiceOf,
  OTHER_CHOICES,
  REGION_CHOICES,
  residencyOfSaved,
  settingsOf,
  statusOfSaved,
} from "./storage-regions";

const en = bindProduct(enRaw);
const fr = bindProduct(frRaw);

const KEYS = ["canada-qc", "canada-on", "canada-ab", "canada", "elsewhere", "unknown", "user-cloud", "device"] as const;

describe("where the administrator keeps the files (folioviv#397)", () => {
  it("offers Toronto, and says Ontario for it", () => {
    const toronto = REGION_CHOICES.find((c) => c.id === "digitalocean-spaces:tor1")!;
    expect(CANADIAN_CHOICES).toContain(toronto);
    expect(toronto.residency).toMatchObject({ key: "canada-on", country: "CA", province: "ON" });
    expect(toronto.endpoint).toBe("https://tor1.digitaloceanspaces.com");
    expect(settingsOf(toronto)).toEqual({
      "storage.provider": "s3",
      "storage.endpoint": "https://tor1.digitaloceanspaces.com",
      "storage.region": "tor1",
    });
  });

  it("never claims Canada for a region outside it, nor for a contradicting endpoint, nor for a Bunny-shaped zone", () => {
    for (const c of OTHER_CHOICES) {
      expect(c.residency.key, c.id).toBe("elsewhere");
    }
    expect(residencyOfSaved({ provider: "s3", endpoint: "nyc3.digitaloceanspaces.com", region: "tor1" })).toBe(
      "elsewhere",
    );
    expect(residencyOfSaved({ provider: "http", endpoint: "storage.bunnycdn.com", region: "" })).toBe("elsewhere");
    expect(residencyOfSaved({ provider: "local", endpoint: "", region: "" })).toBe("device");
  });

  it("finds the choice a saved configuration is", () => {
    expect(choiceOf({ provider: "s3", endpoint: "tor1.digitaloceanspaces.com", region: "tor1" })?.id).toBe(
      "digitalocean-spaces:tor1",
    );
    expect(choiceOf({ provider: "http", endpoint: "storage.bunnycdn.com", region: "" })).toBeNull();
  });

  it("says every residency in both languages", () => {
    for (const messages of [en, fr]) {
      for (const key of KEYS)
        expect((messages.console.admin.storage.residency as Record<string, string>)[key], key).toBeTruthy();
    }
  });

  it("has a translated name for every provider it offers (folioviv#4139: no raw message key)", () => {
    for (const messages of [en, fr]) {
      const names = messages.console.admin.storage.provider as Record<string, string>;
      for (const c of REGION_CHOICES) expect(names[c.preset], `${c.preset} in ${messages === en ? "en" : "fr"}`).toBeTruthy();
    }
  });

  it("does not claim the server's own disk when nothing was saved: the environment decides, or the saved provider is named", () => {
    expect(statusOfSaved({ provider: "local", endpoint: "", region: "" })).toBe("environment");
    expect(statusOfSaved({ provider: "http", endpoint: "storage.bunnycdn.com", region: "" })).toBe("elsewhere");
    expect(statusOfSaved({ provider: "s3", endpoint: "tor1.digitaloceanspaces.com", region: "tor1" })).toBe("canada-on");
  });
});
