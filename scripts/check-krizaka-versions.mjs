#!/usr/bin/env node
/* eslint-disable no-console -- a command-line tool: its output is the interface */
// Fails when one @krizaka/* package is declared with two different versions in the workspace (krizaka-internal#3387).
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FIELDS = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"];

/** The root manifest and every apps/* and packages/* one, parsed, with their path. */
export function workspaceManifests(root = ROOT) {
  const files = ["package.json"];
  for (const group of ["apps", "packages"]) {
    for (const entry of readdirSync(join(root, group), { withFileTypes: true })) {
      const file = `${group}/${entry.name}/package.json`;
      if (entry.isDirectory() && existsSync(join(root, file))) files.push(file);
    }
  }
  return files.map((file) => ({ file, ...JSON.parse(readFileSync(join(root, file), "utf8")) }));
}

/** The @krizaka packages declared with more than one range, with the range each manifest asks. */
export function duplicateKrizakaVersions(manifests) {
  const byName = new Map();
  for (const manifest of manifests) {
    for (const field of FIELDS) {
      for (const [name, range] of Object.entries(manifest[field] ?? {})) {
        if (!name.startsWith("@krizaka/")) continue;
        byName.set(name, { ...byName.get(name), [manifest.file]: range });
      }
    }
  }
  return [...byName]
    .filter(([, versions]) => new Set(Object.values(versions)).size > 1)
    .map(([name, versions]) => ({ name, versions }))
    .sort((a, b) => (a.name > b.name ? 1 : -1));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const found = duplicateKrizakaVersions(workspaceManifests());
  for (const { name, versions } of found) console.error(`${name} has several versions: ${JSON.stringify(versions)}`);
  process.exit(found.length ? 1 : 0);
}
