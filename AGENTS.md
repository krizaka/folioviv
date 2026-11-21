# Folioviv — agent contract

<!-- krizaka-agents-template v2: rendered from krizaka/.github docs/standards/agents-template.md (scripts/agents-md.mjs). The one AGENTS.md standard: six sections in this order, at most 150 lines, bullets and imperatives. The conformance check « agents-template » reads the headings, the length and CLAUDE.md. Detail goes to docs/ via References, not here. -->

## Project context

- Folioviv: the operating system of independent Québec service shops (appointments, invoices, GST/QST figures, public storefront). Restaurants, cafés, bars, bakeries are out (the database refuses them).
- Kind: `product` · team: `folioviv` · registry entry: [repos.json](https://github.com/krizaka/.github/blob/main/repos.json).
- pnpm + Turborepo: `apps/web` (Next.js 16: public page, sign-in, member space, administration, BFF: route handlers are the only HTTP surface), `apps/mobile` (Expo skeleton, outside the workspace), `packages/core` (pure, deterministic domain), `packages/db` (PostgreSQL 16, Drizzle, migrations, the shop's operations).
- Read this file first, then the section of [docs/agents.md](docs/agents.md) for what you touch.
- `CLAUDE.md` is the one line `@AGENTS.md` (or a symlink to this file): never a second copy of it.

## Essential commands

- Install: `pnpm install --frozen-lockfile`; dev: `pnpm dev`; build: `pnpm build`.
- Everything before a push: `pnpm run check` (lint · typecheck · tests; the `precheck` script runs install then check).
- Lint: `pnpm lint` (workspace guard, ESLint, i18n check, ast-grep rules + ratchet, dependency-cruiser, krizaka versions); typecheck: `pnpm typecheck`; tests: `pnpm test`.
- Format: `pnpm format` / `pnpm format:check`; ast-grep codemods: `pnpm sg:fix`; ratchet lock: `pnpm sg:ratchet:update` (never raises a count).
- Database: `pnpm db:rebuild` (`--yes` non-local host, `--cast` demo cast, `--write-expected` after a schema change); `pnpm --filter @folioviv/db db:generate` writes the next migration; seed: `pnpm dev:seed`.
- Other checks: `pnpm check:i18n`, `check:overflow`, `check:hydration`, `check:perf`, `test:visual`, `e2e:walker`.

- Run them on what you changed before every push; CI runs the rest.

## Architecture & conventions

- Follow the [krizaka-engineering skill](https://github.com/krizaka/krizaka-agents/blob/main/plugins/krizaka-engineering/skills/krizaka-engineering/SKILL.md); search its [packages reference](https://github.com/krizaka/krizaka-agents/blob/main/plugins/krizaka-engineering/skills/krizaka-engineering/references/packages.md) before writing anything generic.
- Build only from Krizaka bricks (`@krizaka/ui`, `query`, `i18n`, `icons`, `tokens`, `realtime`, `storage`, `organize`, `privacy`); a missing generic component goes to krizaka-ui, released, then used, never copied. No `@tanstack/*` import, no `fetch` in a client `useEffect`, no hand-written `<table>` or multi-field `<form>`.
- Keep ports and adapters: domain code reads no env, no ambient clock, no database client; route handlers are thin. Payments go through the port `apps/web/lib/payments`; the translation model through `TranslationPort`.
- Work on "the" shop through `requireShop` / `requireOwner` / `requireShopClient` (`lib/access.ts`), never a shop id from the request; another shop's resource answers 404, never 403. Classify each new table in `packages/db/src/tenancy.ts`.
- Write every user string in `apps/web/messages/{en,fr}.json` (English the reference), e-mails in `apps/web/mail-templates/<id>/<locale>/`; never a locale ternary; `--kz-*` token roles only, no hard-coded colour.
- Put limits, prices, durations and flags in administrator settings; env variables are `<CONTEXT>_<THING>`, declared once in `apps/web/lib/env.ts` and in `deploy/digitalocean/app.yaml`.
- Name things by what they do; no `*Utils`, `*Helper`, `*Manager`. One job per function (complexity ≤ 15, nesting ≤ 2, body < 60 lines).
- Default media (avatars, banners, logos) come from `@krizaka/org` (`listDefaults`, `defaultFor`), never hard-coded.

## Guard-rails & known pitfalls (read before coding)

- The checks are the judge ([ADR-015](https://github.com/krizaka/krizaka-internal/blob/main/docs/adr/.github/ADR-015-ai-code-audit-measured-and-enforced.md), [guards](https://github.com/krizaka/.github/blob/main/docs/standards/guards.md)): never `--no-verify`, never a new `eslint-disable`, never a raised ratchet or baseline; never silence an ast-grep rule (fix, or justify a technical fact with `// @fixed: <reason>`).
- Money is integer cents: no float, no `real`, no `numeric` read as a float. GST 5/100 and QST 9975/100000 are exact fractions, applied once per invoice on the taxable subtotal, rounded half away from zero (`@folioviv/core`); change a rate or rounding rule only with a test on known invoices first.
- The ledger is append-only (triggers); a correction is a credit note; an invoice's state is derived (no route moves it, no « bulk paid »). Never silently adopt an AI figure: reconcile against the ledger.
- Folioviv prepares, the merchant files: never file, transmit or promise electronic transmission to Revenu Québec or the CRA (a test scans the e-mails).
- No AI in the product, screens or words (never « IA », « intelligent »); the only model is shop-page translation, labelled « traduction automatique », sending no client data. Anything else reopens krizaka/folioviv#161 first.
- Loi 25: consent per purpose, never pre-ticked; a new table with personal data gets a `@krizaka/privacy` contributor and a `RETENTION_RULES` entry; a public text states a place or flow only where code proves it.
- Never edit a merged migration; dev is rebuilt with `db:rebuild`, never patched by hand; one database per worktree, never a shared or `*_demo` one.
- Sign-up is closed server-side (QA accounts only); a journey that creates a user uses `ownUsers()` and deletes it; the administration lives on admin.folioviv.com only.
- Count-then-insert and check-then-write run in one transaction with a lock, with a concurrency test; a rule (limit, permission, validation) lives in the service, not in a route; validate the original input, never a trimmed copy; a cleanup never masks the original error.
- A new walker route uses a shop guard or is declared in `tenant-isolation.integration.test.ts`; a new env key is declared in the spec or in `NOT_DECLARED` of `env-spec.test.ts`.
- No mobile app in the dev preview (`mobile.*` criteria are `na` in `dev-preview.json` until a build exists). Not deployed: no DigitalOcean app, no DNS. Restaurants stay excluded; the point of sale stays a stub.
- Never write a URL, law article, price or figure you did not read; write `TO VALIDATE`. No secret, capture or log in the repo; no production data in a session.
- Use `?.` and `??` in TypeScript, not a `&&` chain or a null ternary; a closed set is an `as const` object, never `enum`.
- Keep the edit hook in `.claude/settings.json`: `npx --no-install krizaka-edit-check` on `Edit|Write`.

## Expected validation workflow

- [ ] `pnpm run check` is green; fix the cause of a red, never the guard.
- [ ] A fix starts with a failing test (a bug means a missing guard); database rules are proven on a real PostgreSQL, never mocks.
- [ ] Each visible page is checked dark and light, desktop and phone (captures go to Bunny); a notable UX choice has an entry in `docs/UX_DECISIONS.md`.
- [ ] Every review thread is answered (test-first fix, or a reason) and resolved.
- [ ] A feature or fix PR names its journey (`Journey: <name>` or `Journey: n/a — <reason>`); one issue, one small PR (`Closes #<n>`); merge only with green CI.

## References

- [docs/agents.md](docs/agents.md): the previous long AGENTS.md, whole (storefront media and templates, shop-as-a-place, tenancy, Loi 25, ast-grep rule table, ratchet, anti-slop, pre-PR list).
- [docs/UX_DECISIONS.md](docs/UX_DECISIONS.md), [docs/design/](docs/design), [docs/privacy/](docs/privacy), [docs/adr/](docs/adr), [docs/ci-and-deploy.md](docs/ci-and-deploy.md).
- [Org standards](https://github.com/krizaka/.github/tree/main/docs/standards) of krizaka/.github; the [engineering charter](https://github.com/krizaka/.github/blob/main/AGENTS.template.md).
- [krizaka-engineering skill](https://github.com/krizaka/krizaka-agents/blob/main/plugins/krizaka-engineering/skills/krizaka-engineering/SKILL.md).
