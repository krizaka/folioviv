#!/usr/bin/env bash
# The critical journeys with the teardown check (krizaka-internal#2716): the users there are before the run, the run, then a check that no user
# is left behind (a journey signs in as a persona of the cast, or deletes the user it made). The journeys' own verdict is kept: a failed
# journey and a left-behind user both fail the step. Same command on a deployed dev database: set DATABASE_URL and BASE_URL.
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1
users=(pnpm --filter @folioviv/web exec tsx scripts/journey-users.mjs)
before="$(mktemp)"
trap 'rm -f "$before"' EXIT
"${users[@]}" snapshot "$before" || exit 1
pnpm exec playwright test -c apps/web/e2e/journeys/playwright.config.mjs "$@"
status=$?
"${users[@]}" check "$before" || status=1
exit "$status"
