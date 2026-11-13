import assert from "node:assert/strict";
import { describe, it } from "vitest";

import { duplicateKrizakaVersions, workspaceManifests } from "./check-krizaka-versions.mjs";

describe("one version per @krizaka package across the workspace (krizaka-internal#3387)", () => {
  it("names a package that two manifests declare differently", () => {
    const found = duplicateKrizakaVersions([
      { file: "apps/web/package.json", dependencies: { "@krizaka/settings": "^0.7.0", "@krizaka/ui": "^4.3.0" } },
      { file: "packages/db/package.json", dependencies: { "@krizaka/settings": "0.2.0", "@krizaka/ui": "^4.3.0" } },
    ]);
    assert.deepEqual(found, [
      {
        name: "@krizaka/settings",
        versions: { "apps/web/package.json": "^0.7.0", "packages/db/package.json": "0.2.0" },
      },
    ]);
  });

  it("counts dev and peer dependencies and ignores other scopes", () => {
    const found = duplicateKrizakaVersions([
      { file: "a", devDependencies: { "@krizaka/config": "^0.23.0", react: "1" } },
      { file: "b", peerDependencies: { "@krizaka/config": "^0.17.0", react: "2" } },
    ]);
    assert.deepEqual(
      found.map((f) => f.name),
      ["@krizaka/config"],
    );
  });

  it("accepts identical declarations", () => {
    assert.deepEqual(
      duplicateKrizakaVersions([
        { file: "a", dependencies: { "@krizaka/ui": "4.3.0" } },
        { file: "b", dependencies: { "@krizaka/ui": "4.3.0" } },
      ]),
      [],
    );
  });

  it("holds for this workspace", () => {
    assert.deepEqual(duplicateKrizakaVersions(workspaceManifests()), []);
  });
});
