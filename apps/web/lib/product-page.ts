import type { ProductScene } from "@krizaka/ui/product-page";
import type { DeviceKind } from "@krizaka/ui/step-showcase";
import { z } from "zod";

import data from "@/content/product-page.json";

import { type RoleMedia, sectionMedia } from "./section-media";

const BUDGET_KEYS = ["hero.title", "hero.lead", "scene.title", "scene.line", "limit", "closing.title"] as const;
type BudgetKey = (typeof BUDGET_KEYS)[number];

const template = z.object({
  /** The registry page whose scenes the template shows. */
  page: z.string(),
  /** The registry role of a scene. */
  sceneRole: z.string(),
  /** The limits band's lines, by id (their words are in the catalogue). */
  limits: z.array(z.string()).min(1).max(3),
  /** The report line the pen marks in the hero's moment. */
  moment: z.object({ flagged: z.number().int().nonnegative() }),
  /** The most words each section may say. */
  budget: z.record(z.enum(BUDGET_KEYS), z.number().int().positive()),
});
export type ProductPageTemplate = z.infer<typeof template>;

export const parseTemplate = (raw: unknown): ProductPageTemplate => template.parse(raw);

/** The product page's structure, parsed once: `content/product-page.json`. */
export const PRODUCT_PAGE: ProductPageTemplate = parseTemplate(data);

/** The words of the template, as the catalogue holds them (`landing.productPage`). */
export interface ProductPageWords {
  hero: { title: string; lead: string };
  scenes: Readonly<Record<string, { title: string; line?: string } | undefined>>;
  limits: { title: string; items: Readonly<Record<string, string | undefined>> };
  closing: { title: string };
}

/** The scenes of the page: the registry's media of the scene role, in the registry's order, one per recording. */
export function sceneMedia(page: ProductPageTemplate = PRODUCT_PAGE): RoleMedia[] {
  const seen = new Set<string>();
  return sectionMedia(page.page, page.sceneRole).filter((m) => !seen.has(m.id) && seen.add(m.id));
}

const wordCount = (text: string) => text.split(/\s+/).filter(Boolean).length;

/** The sections whose words go over their budget, named `hero.title`, `scene.<id>.line`, `limit.<id>`. */
export function overBudget(words: ProductPageWords, budget: ProductPageTemplate["budget"]): string[] {
  const over = (key: BudgetKey, text: string | undefined) => (budget[key] ?? Infinity) < wordCount(text ?? "");
  const scenes = Object.entries(words.scenes).flatMap(([id, s]) => [
    ...(over("scene.title", s?.title) ? [`scene.${id}.title`] : []),
    ...(over("scene.line", s?.line) ? [`scene.${id}.line`] : []),
  ]);
  const limits = Object.entries(words.limits.items).flatMap(([id, text]) =>
    over("limit", text) ? [`limit.${id}`] : [],
  );
  return [
    ...(over("hero.title", words.hero.title) ? ["hero.title"] : []),
    ...(over("hero.lead", words.hero.lead) ? ["hero.lead"] : []),
    ...scenes,
    ...limits,
    ...(over("closing.title", words.closing.title) ? ["closing.title"] : []),
  ];
}

/** The frame a recording is shown in, by the platform it was recorded on. */
const DEVICE: Readonly<Record<string, DeviceKind | undefined>> = {
  web: "browser",
  mac: "desktop",
  windows: "desktop",
  linux: "desktop",
  android: "phone",
  ios: "phone",
};

/** The scenes the page shows in a language: a registry media with its words; one without words is left out. */
export function productScenes(words: ProductPageWords["scenes"]): ProductScene[] {
  return sceneMedia().flatMap((m) => {
    const said = words[m.id];
    return said
      ? [
          {
            ...said,
            id: m.id,
            device: DEVICE[m.platform] ?? "browser",
            poster: m.poster,
            sources: { webm: m.webm, mp4: m.mp4 },
            width: m.width,
            height: m.height,
          },
        ]
      : [];
  });
}

/** The report's lines for the hero's moment: the one at `flagged` carries the pen's mark. */
export function reportLines(lines: readonly string[], flagged: number): { text: string; flagged: boolean }[] {
  return lines.map((text, i) => ({ text, flagged: i === flagged }));
}
