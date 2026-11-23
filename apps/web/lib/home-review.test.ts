import { describe, expect, it } from "vitest";

import { bulletinLayout } from "@/components/shop/Bulletin";

describe("the bulletin board never ends on an orphan", () => {
  it.each([
    [1, 1, 3],
    [2, 2, 2],
    [3, 3, 3],
    [4, 4, 2],
    [5, 3, 3],
    [6, 6, 3],
    [7, 6, 3],
    [8, 6, 3],
    [9, 9, 3],
  ])("%i flyers: %i shown in %i columns", (count, shown, columns) => {
    expect(bulletinLayout(count)).toEqual({ shown, columns });
    expect(shown % columns === 0 || shown < columns).toBe(true);
  });
});
