import { existsSync, statSync } from "node:fs";
import path from "node:path";

/** The directories to look in: the fixed install places, then the PATH entries that nobody but their owner can write to. */
function safeDirectories() {
  const fixed = ["/opt/homebrew/bin", "/usr/local/bin", "/usr/bin", "/bin"];
  const fromPath = (process.env.PATH ?? "").split(path.delimiter).filter((dir) => {
    if (!path.isAbsolute(dir)) {
      return false;
    }
    try {
      return (statSync(dir).mode & 0o022) === 0;
    } catch {
      return false;
    }
  });
  return [...new Set([...fixed, ...fromPath])];
}

/** A program by its absolute path, found only in directories others cannot write to (never a bare name looked up in a writable PATH directory). */
export function toolPath(name) {
  const found = safeDirectories()
    .map((dir) => path.join(dir, name))
    .find((file) => existsSync(file));
  if (!found) throw new Error(`${name} not found in a protected directory: install it system-wide`);
  return found;
}
