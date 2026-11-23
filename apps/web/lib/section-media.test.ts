import { describe, expect, it } from "vitest";

import en from "@/messages/en.json";
import fr from "@/messages/fr.json";

import { APP_VIDEOS, videoId } from "./app-videos";
import { MEDIA_REGISTRY, type MediaRegistry, sectionMedia } from "./section-media";

const entry = (id: string, page: string, role: string): MediaRegistry["media"][number] => ({
  id,
  origin: "test",
  owner: "folioviv",
  location: "content/app-videos.json",
  reason: "a fixture",
  uses: [{ page, role }],
});

describe("the pages' media, by role (krizaka-internal#4636)", () => {
  it("every registry entry is a recording of the manifest, with words in both languages", () => {
    const recorded = new Set(APP_VIDEOS.map(videoId));
    for (const m of MEDIA_REGISTRY.media) {
      expect(recorded, m.id).toContain(m.id);
      expect(Object.keys(en.download.videos.items)).toContain(m.id);
      expect(Object.keys(fr.download.videos.items)).toContain(m.id);
    }
  });

  it("the home's storefront section shows the storefront recording, on the media CDN", () => {
    const [clip] = sectionMedia("home", "storefront");
    expect(clip?.id).toBe("web-storefront");
    expect(clip?.mp4).toMatch(/^https:\/\/krizaka-assets\.b-cdn\.net\/sites\/folioviv\/.+\.mp4$/);
    expect(clip?.width).toBeGreaterThan(clip?.height ?? 0);
  });

  it("an entry added to the registry shows on its section, with no code change", () => {
    const registry: MediaRegistry = {
      ...MEDIA_REGISTRY,
      media: [...MEDIA_REGISTRY.media, entry("web-composer", "privacy", "lead")],
    };
    expect(sectionMedia("privacy", "lead")).toEqual([]);
    expect(sectionMedia("privacy", "lead", registry).map((m) => m.id)).toEqual(["web-composer"]);
  });

  it("shows nothing for a recording the manifest does not hold, or a platform without a box", () => {
    const registry: MediaRegistry = {
      frames: { web: { width: 1280, height: 800 } },
      media: [entry("web-missing", "home", "x"), entry("android-today-books", "home", "x")],
    };
    expect(sectionMedia("home", "x", registry)).toEqual([]);
  });
});
