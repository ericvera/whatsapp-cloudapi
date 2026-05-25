# Code

## Code Structure

Yarn 4 workspaces monorepo (`packages/*`). Node `>=22`, ESM-only,
strict TypeScript. Published to npm as `@whatsapp-cloudapi/*`.

- **types:** `packages/types/src` (shared TypeScript types for the
  WhatsApp Cloud API — `cloudapi/`, `webhook/`, `simulation/`. No
  runtime deps. Other packages depend on this via `workspace:*`.)
- **client:** `packages/client/src` (typed client for sending Cloud
  API messages — `sendTextMessage.ts`, `sendImageMessage.ts`, etc.,
  plus `internal/sendRequest.ts`.)
- **emulator:** `packages/emulator/src` (Express-based local emulator
  of the Cloud API — `routes/`, `services/`, `emulator/`, `config/`,
  `utils/`.)
- **cli:** `packages/cli/src` (`index.ts` — `wa-emulator` binary that
  runs the emulator from the command line.)

## Branch Naming

- **Feature branches:** `<name>/<feature-description>`
- **Bug-fix branches:** `<name>/fix-<description>`
- **Example:** `eric/support-reactions`, `eric/fix-list-validation`

## Build

- **Full build:** `yarn build` (runs `tsc --build` across all
  workspaces; also serves as the type-check.)

## Run

The only runnable artifact is the emulator CLI (the rest are libraries).
**After build:** `yarn workspace @whatsapp-cloudapi/cli wa-emulator` (or
`node packages/cli/dist/index.js`).

## Pre-commit Verification

- **Format:** `yarn prettier --write .`
- **Check (lint + types):** `yarn lint && yarn build`
- **Unit tests:** `yarn test`
- **All-in-one:** `yarn smoke` (= `yarn build && yarn lint && yarn test`)
- Note: the husky `pre-commit` hook runs `lint-staged` (eslint +
  prettier on staged files) automatically; `yarn smoke` is the fuller
  gate to run before opening a PR.

## Publishing Changes

- **Push command:** `git push -u origin <branch>`
- **Create MR/PR (base command):** `gh pr create --base main` <!-- autonomous skills append --title / --body at runtime -->
- **Auto-publish allowed:** `no` <!-- read by autonomous skills; they stop after committing and let the user push/open the PR -->
- **No AI attribution (REQUIRED):** Commit messages and PR/MR bodies MUST NOT contain any AI co-author or "co-developed by"/"generated with" trailers — no `Co-Authored-By: Claude`, no `Co-authored-by: Sculptor`, none. Use plain messages.
- Note: npm publishing is fully automated by CI. On merge to `main`,
  `.github/workflows/publish.yml` runs conventional-changelog, bumps
  versions, publishes all four packages to npm, and creates a GitHub
  release. **Commit messages must follow Conventional Commits** (e.g.
  `feat:`, `fix:`, `feat!:` for breaking) since they drive the version
  bump and changelog.

### Merge defaults

- **Delete source branch on merge:** `yes`
- **Squash on merge:** `yes` <!-- keeps a single Conventional Commit on main for the changelog; set via `gh pr merge --squash` at merge time -->
- **Auto-merge when CI passes:** `no`
- **Open as draft:** `no`

## Proof of Work

Every MR/PR opened by an autonomous skill must include evidence that the
bug existed and is now fixed. The MR/PR body walks a reviewer through:

1. **Original bug** — exact description (and ticket link, if any).
2. **Reproduction** — repro steps, plus before-evidence (failing test
   output / error trace) showing the buggy behavior.
3. **Hypothesis** — what code path was responsible and why.
4. **Fix** — what changed and why it addresses the cause.
5. **Proof the fix works** — after-evidence (passing test output),
   plus a link or hash for the failing-test commit.

### Evidence tooling

- **UI-visible bugs:** N/A — this repo has no UI (libraries + a
  headless CLI emulator).
- **Non-UI bugs:** paste the failing-then-passing Vitest output
  (`yarn vitest run <file>`), and reference the commit that added the
  failing regression test.
- **Other artifacts (optional):** for emulator HTTP behavior, a
  request/response transcript (e.g. `curl`) against the running
  emulator.

### Required vs optional

- **Required for every MR/PR:** yes — a regression test plus its
  passing output.

## Dependencies

- **Install:** `yarn` (Yarn 4, `packageManager: yarn@4.12.0`)
- Note: project memory — **always use `yarn`, never `npm`.**

## Environment Setup

- No env vars or external services required for tests/build. The
  emulator runs entirely locally.
