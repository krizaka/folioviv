// The users a journey creates are its own to delete (krizaka-internal#2716): an address on the reserved test domain, deleted when the journey ends.
// A journey that signs in goes as a persona of the cast instead and creates nothing. `scripts/ci-journeys-run.sh` then checks that no user is left.
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const WEB = fileURLToPath(new URL("../..", import.meta.url));

/** `address(label)` makes a unique journey address and remembers it; `cleanup()` (afterAll) deletes every one, whatever the journey's outcome. */
export function ownUsers() {
  const made = [];
  return {
    address(label) {
      const email = `e2e-${label}-${Date.now()}-${made.length}@folioviv.test`;
      made.push(email);
      return email;
    },
    cleanup() {
      if (made.length === 0) return;
      execFileSync("pnpm", ["exec", "tsx", "scripts/journey-users.mjs", "delete", ...made], {
        cwd: WEB,
        stdio: "inherit",
      });
    },
  };
}
