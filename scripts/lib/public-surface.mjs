/* The public surface of the repository for the founder-name guard: the files a visitor reads (README and the other root
   documents, every package.json, the web app's messages, content, public files, pages and components), as [path, text]. */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { toolPath } from "./tool-path.mjs";

const PUBLIC =
  /^(README|LICENSE|NOTICE|SECURITY|CONTRIBUTING)[^/]*$|(^|\/)package\.json$|^apps\/web\/(messages|content|public|app|components)\//;
const TEXT = /\.(md|mdx|txt|json|ts|tsx|mjs|js|html|yml|yaml)$|^[A-Z]+$/;

/** The public text files among these tracked paths. */
export const publicPaths = (paths) => paths.filter((f) => PUBLIC.test(f) && TEXT.test(f));

/** [path, text] of every tracked public text file. `listFiles` is the port (git ls-files by default). */
export function publicTexts(listFiles = () => execFileSync(toolPath("git"), ["ls-files"], { encoding: "utf8" })) {
  return publicPaths(listFiles().split("\n")).map((f) => [f, readFileSync(f, "utf8")]);
}
