import { z } from "zod";

import data from "@/content/media-registry.json";

import { APP_VIDEOS, type AppVideo, videoId, videoUrl } from "./app-videos";

const frame = z.object({ width: z.number().int().positive(), height: z.number().int().positive() });
const registry = z.object({
  /** The box of each platform's recordings: a platform without one shows no clip (never another platform's shape). */
  frames: z.record(z.string(), frame),
  media: z.array(
    z.object({
      /** A recording of content/app-videos.json: `<platform>-<flow>`. */
      id: z.string(),
      /** Where it comes from: `test` (recorded by the e2e tests), `design`, `founder`. */
      origin: z.string(),
      owner: z.string(),
      location: z.string(),
      /** Why this media on these sections, in one sentence (the review reads it; never rendered). */
      reason: z.string(),
      /** The page sections that show it, by role. */
      uses: z.array(z.object({ page: z.string(), role: z.string() })),
    }),
  ),
});
export type MediaRegistry = z.infer<typeof registry>;

/** The registry of the pages' media, parsed once: `content/media-registry.json` (krizaka-internal#4636, #4482). */
export const MEDIA_REGISTRY: MediaRegistry = registry.parse(data);

/** One media to show: its words id (its name and caption in the messages), its addresses and its box. */
export interface RoleMedia {
  id: string;
  /** The platform it was recorded on (`web`, `android`): the frame it is drawn in. */
  platform: string;
  poster: string;
  webm: string;
  mp4: string;
  width: number;
  height: number;
}

/** The box a recording is shown in, from the registry; undefined for a platform it does not know. */
export const frameOf = (platform: string, media: MediaRegistry = MEDIA_REGISTRY) => media.frames[platform];

/**
 * The media of one page section, by role: every registry entry used there that has a recording and a box, in the registry's
 * order. The page asks « the media of role R on page P »; the registry answers. Nothing listed: nothing shown.
 */
export function sectionMedia(
  page: string,
  role: string,
  media: MediaRegistry = MEDIA_REGISTRY,
  videos: readonly AppVideo[] = APP_VIDEOS,
): RoleMedia[] {
  const ids = media.media.filter((m) => m.uses.some((u) => u.page === page && u.role === role)).map((m) => m.id);
  return ids.flatMap((id) =>
    videos
      .filter((v) => videoId(v) === id)
      .flatMap((v) => {
        const box = frameOf(v.platform, media);
        if (!box) {
          return [];
        }
        return [
          {
            id,
            platform: v.platform,
            poster: videoUrl(v.files.poster),
            webm: videoUrl(v.files.webm),
            mp4: videoUrl(v.files.mp4),
            ...box,
          },
        ];
      }),
  );
}
