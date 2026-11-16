/**
 * The published data of a shop page, kept for a few seconds (krizaka-internal#3945). The page is rendered per request (the CSP nonce is per response and
 * stays so) but its rows (the shop, its services, hours, team, media, community, the published document) change on a save, not on a visit: a short TTL keeps the
 * first byte off the database, and a save by a member of the shop drops the entry at once (`invalidateShop`, called by `requireShop` on a write). The
 * instance that took the write is exact; another instance of the app is at most one TTL late. What depends on the instant (who is in today, the next free
 * time) is never held here. Promises are held, so concurrent visitors share one read; a failed read is not kept; a missing shop is not kept.
 */
const TTL_MS = 15_000; // @fixed: the longest a save may take to show on another instance of the app

interface Entry {
  until: number;
  shopId: string;
  value: Promise<unknown>;
}

/**
 * The entries, kept on `globalThis`: a route handler (the save that calls `invalidateShop`) and the page that reads are separate bundles, one module graph
 * and so one copy of this module each; a module-level map would drop the route's copy and leave the page's (the same reason as `shop-directory`).
 */
const SHARED = Symbol.for("folioviv.shop-cache");
const holder = globalThis as unknown as Record<symbol, Map<string, Entry> | undefined>;
const entries: Map<string, Entry> = holder[SHARED] ?? new Map();
holder[SHARED] = entries;

/** The value for `key` (a shop's address or id, per kind), read at most once per TTL; `shopIdOf` names the shop it belongs to so a save can drop it. */
export async function cachedForShop<T>(
  key: string,
  shopIdOf: (value: T) => string | null,
  read: () => Promise<T>,
  now: () => number = performance.now.bind(performance),
): Promise<T> {
  const held = entries.get(key);
  if (held && held.until > now()) {
    return held.value as Promise<T>;
  }
  const reading = read();
  const placeholder: Entry = { until: now() + TTL_MS, shopId: "", value: reading };
  entries.set(key, placeholder);
  const forget = () => {
    if (entries.get(key) === placeholder) {
      entries.delete(key);
    }
  };
  try {
    const value = await reading;
    const shopId = shopIdOf(value);
    if (shopId === null) {
      forget();
    } else {
      placeholder.shopId = shopId;
    }
    return value;
  } catch (error) {
    forget();
    throw error;
  }
}

/** A save changed this shop: its entries are read again on the next visit. */
export function invalidateShop(shopId: string): void {
  for (const [key, entry] of entries) {
    if (entry.shopId === shopId || entry.shopId === "") {
      entries.delete(key);
    }
  }
}

/** Test seam: forget everything. */
export const clearShopCache = (): void => entries.clear();
