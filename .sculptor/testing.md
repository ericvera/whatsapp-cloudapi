# Testing

## Test Strategy

This repo is a set of TypeScript libraries plus a headless Express
emulator — there is no browser/UI layer, so there are no end-to-end /
browser tests. Coverage is unit/integration tests written with Vitest,
co-located next to the source they exercise.

- **Default:** write Vitest unit tests next to the changed source file.
- **Client package:** mock the network layer (see
  `packages/client/src/internal/sendRequest.ts` and how the existing
  `send*Message.test.ts` files stub it) and assert the request shape /
  returned value.
- **Emulator package:** exercise routes/services directly (or via the
  Express app) and assert the HTTP response and emitted webhooks.
- **Types package:** prefer type-level checks and small runtime assertions
  for any helpers; pure type changes may not need a runtime test.
- Skip tests only for non-behavioral changes (docs, comments, formatting).

## Test Framework

- **Framework:** Vitest (`vitest@^4`). Config: root `vitest.config.mjs`
  (`mockReset: true`; only runs `packages/*/src/**/*.test.ts`, never
  compiled output under `dist`).
- **Run all tests:** `yarn test` (= `vitest run`)
- **Run a test file:** `yarn vitest run packages/client/src/sendTextMessage.test.ts`
- **Run a single test:** `yarn vitest run packages/client/src/sendTextMessage.test.ts -t "<test name>"`
- **Run e2e tests:** none — same command as unit tests.
- **Test location:** co-located with source as `*.test.ts` under
  `packages/<pkg>/src/`.
- **Conventions:** mirror the source filename (`sendTextMessage.ts` →
  `sendTextMessage.test.ts`). See `packages/client/src/sendTextMessage.test.ts`
  as the reference for client tests (fetch mocking, request-body
  assertions).

## Manual Testing (optional)

- **How to test:** build, then run the emulator CLI with
  `yarn workspace @whatsapp-cloudapi/cli wa-emulator` and issue HTTP
  requests against it (e.g. with `curl`).

## Test Debugging (optional)

- **How to debug:** read the Vitest output; narrow with
  `yarn vitest run <file> -t "<name>"`. Use `yarn vitest <file>` (watch
  mode) for iterative debugging.
