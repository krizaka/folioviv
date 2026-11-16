import { beforeEach, describe, expect, it, vi } from "vitest";

import { cachedForShop, clearShopCache, invalidateShop } from "./shop-cache";

let clock = 0;
const now = () => clock;
const shopOf = (v: { id: string } | null) => v?.id ?? null;

beforeEach(() => {
  clock = 0;
  clearShopCache();
});

describe("shop page cache", () => {
  it("reads once within the TTL, and again after it", async () => {
    let reads = 0;
    const read = async () => ({ id: "s1", n: ++reads });
    await cachedForShop("a", shopOf, read, now);
    clock = 14_000;
    expect((await cachedForShop("a", shopOf, read, now)).n).toBe(1);
    clock = 16_000;
    expect((await cachedForShop("a", shopOf, read, now)).n).toBe(2);
  });
  it("shares one read between concurrent visitors", async () => {
    let reads = 0;
    const read = async () => ({ id: "s1", n: ++reads });
    await Promise.all([cachedForShop("a", shopOf, read, now), cachedForShop("a", shopOf, read, now)]);
    expect(reads).toBe(1);
  });
  it("drops a shop's entries on a save, and only that shop's", async () => {
    let reads = 0;
    const read = (id: string) => async () => ({ id, n: ++reads });
    await cachedForShop("a", shopOf, read("s1"), now);
    await cachedForShop("b", shopOf, read("s2"), now);
    invalidateShop("s1");
    await cachedForShop("a", shopOf, read("s1"), now);
    await cachedForShop("b", shopOf, read("s2"), now);
    expect(reads).toBe(3);
  });
  it("keeps neither a missing shop nor a failed read", async () => {
    let reads = 0;
    await cachedForShop("a", shopOf, async () => (++reads, null), now);
    await cachedForShop("a", shopOf, async () => (++reads, null), now);
    expect(reads).toBe(2);
    await expect(
      cachedForShop(
        "b",
        shopOf,
        async () => {
          throw new Error("down");
        },
        now,
      ),
    ).rejects.toThrow("down");
    expect((await cachedForShop("b", shopOf, async () => ({ id: "s1" }), now)).id).toBe("s1");
  });
});

describe("shop page cache across bundles", () => {
  it("a save in a route handler drops what the page holds: two copies of the module share one cache", async () => {
    // Next builds a route handler and a page into separate module graphs: each gets its own copy of this module (#760, e2e:composer).
    vi.resetModules();
    const page = await import("./shop-cache");
    vi.resetModules();
    const route = await import("./shop-cache");
    expect(route).not.toBe(page);
    let reads = 0;
    const read = async () => ({ id: "s1", n: ++reads });
    await page.cachedForShop("p", shopOf, read, now);
    route.invalidateShop("s1");
    expect((await page.cachedForShop("p", shopOf, read, now)).n).toBe(2);
  });
});
