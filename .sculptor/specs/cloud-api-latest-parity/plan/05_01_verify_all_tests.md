# Task 5.1: Run all tests added in this plan and iterate to green

## Goal

Run every test introduced or modified by this plan and iterate until they all
pass. This is a safety check after all the per-task work — even though each task
verified its own scope, cross-task interactions may have introduced regressions.

## Background

This is the second-to-last task in the plan. By now every feature task (Phases
1–4) is complete and committed: the audit doc, the type additions/corrections,
the ten client send helpers, the client media lifecycle + Block helpers, the
emulator media bytes/lifecycle, the emulator Block routes, and the emulator
contacts/contact_request handling. Per-task verification has already passed, but
the whole suite must be green together (REQ-LEGACY-1: no regressions).

Repo facts:

- Tests are Vitest, co-located `*.test.ts` under `packages/*/src/`.
- Run all: `yarn test` (= `vitest run`). Single file:
  `yarn vitest run <path>`.
- Full pre-commit gate: `yarn smoke` (= `yarn build && yarn lint && yarn test`).

## Files to modify/create

None expected. If you find a failure, fix it in the source file the failure
originates from (not the test, unless the test itself is wrong).

## Implementation details

1. Identify the tests added by this plan (client `send*Message.test.ts`,
   `internal/apiRequest.test.ts`, `getMediaUrl.test.ts`,
   `downloadMedia.test.ts`, `deleteMedia.test.ts`, `uploadMedia.test.ts`,
   `blockUsers.test.ts`, `unblockUsers.test.ts`, `listBlockedUsers.test.ts`;
   emulator `MessageRoutes.test.ts`, `MediaRoutes.test.ts`,
   `BlockRoutes.test.ts`). You can also run the whole suite directly.
2. Run `yarn test` (the whole monorepo) and confirm every test passes —
   including the pre-existing client tests (regression guard).
3. If a test fails: debug, fix the source, re-run. Iterate until green.
4. Run the full pre-commit gate once: `yarn smoke` (build + lint + test).

## Verification checklist

- [ ] `yarn test` passes for the whole monorepo (new + pre-existing tests).
- [ ] `yarn smoke` (build + lint + test) passes end-to-end.

## Commit policy

**Do NOT make an empty commit.** If everything passed first try and you changed
nothing, report success without a commit. If you fixed regressions, commit those
fixes with a descriptive Conventional Commit message (no AI attribution).
