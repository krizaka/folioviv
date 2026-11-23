import type { FeedView } from "@/lib/feed-view";

/** The home's feed in the public export: no database read, an empty board (an empty feed draws no section). */
export async function homeFeed(): Promise<FeedView> {
  return { flyers: [], quartiers: [], quartier: null };
}
