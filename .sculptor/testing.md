# Testing

## Test Strategy

TypeScript libraries plus a headless Express emulator — no browser/UI
layer, so no e2e/browser tests. Coverage is Vitest unit/integration
tests co-located next to the source they exercise.

- **client (REQUIRED):** every source file that exports a method MUST
  have a co-located `*.test.ts` with tests. Mock the network layer
  (`internal/sendRequest.ts`; see the `send*Message.test.ts` files) and
  assert the request shape / returned value. `index.ts` (barrel) and
  `constants.ts` export no methods, so they need no test.
- **emulator:** integration-test routes via the Express app with
  `supertest`, asserting HTTP responses and emitted webhooks (see
  `routes/*.test.ts`). Services/utils are covered through the routes.
- **types:** pure type declarations — no runtime tests needed.
- Skip tests only for non-behavioral changes (docs, comments, formatting).

## Test Framework

- **Framework:** Vitest (`vitest@^4`). Root `vitest.config.mjs`
  (`mockReset: true`; runs only `packages/*/src/**/*.test.ts`, never
  compiled `dist`).
- **All tests:** `yarn test` (= `vitest run`)
- **One file:** `yarn vitest run packages/client/src/sendTextMessage.test.ts`
  (add `-t "<test name>"` for a single test; drop `run` for watch mode).
- **Convention:** mirror the source filename (`sendTextMessage.ts` →
  `sendTextMessage.test.ts`). Reference: `packages/client/src/sendTextMessage.test.ts`.

## Manual Testing (optional)

Build, run the emulator CLI
(`yarn workspace @whatsapp-cloudapi/cli wa-emulator`), and issue HTTP
requests against it (e.g. with `curl`).
