# Task 4.1: Emulator integration-test harness (supertest) + baseline test

## Goal

Stand up the emulator package's test infrastructure: add `supertest` as a
devDependency, add a minimal additive accessor so tests can drive the running
Express server, and write a baseline integration test (POST `/messages` text
round-trip) that establishes the pattern every later emulator task copies. The
emulator currently has **zero tests**, so this task de-risks all of Phase 4.

## Requirements addressed

REQ-TEST-1, REQ-LEGACY-1

## Background

`@whatsapp-cloudapi/emulator` is an Express app wrapped by the
`WhatsAppEmulator` class (`packages/emulator/src/emulator/WhatsAppEmulator.ts`).
Key facts:

- `WhatsAppEmulator` constructor builds `this.app` (private `Express`), wires
  `cors()` + `bodyParser.json()` + a timing logger.
- Routes are wired in `start()`: it constructs `MediaRoutes` then
  `MessageRoutes`, calls `setupRoutes()`, then `this.server =
this.app.listen(port, host, cb)`. `this.server` (an `http.Server`) is private.
- `stop()` closes the server.
- Config: `new WhatsAppEmulator({ businessPhoneNumberId, displayPhoneNumber?,
port?, host?, webhook?, persistence?, log? })`. `port` defaults to `4004`,
  `host` to `localhost` (`packages/emulator/src/config/EmulatorConfig.ts`).
  Route middleware `validatePhoneNumberId` requires the URL's `phoneNumberId`
  to equal the normalized `businessPhoneNumberId`; `validateVersion` requires
  the version segment to equal `v25.0` (`SupportedVersion`).
- Webhooks are delivered by `WebhookService.sendWebhook` via **global `fetch`**
  (`packages/emulator/src/services/WebhookService.ts`). Message sends fire the
  status webhook asynchronously (`void this.webhookService.sendMessageStatus(...)`).

The emulator's `package.json` already has `"test": "vitest run"` and the
per-package `vitest.config.mjs` (`include: ['src/**/*.test.ts']`,
`mockReset: true`). **`supertest` is not installed.**

The chosen test approach (confirmed with the user): **supertest against the
running emulator server**, with webhook deliveries asserted by stubbing global
`fetch` (supertest uses superagent, not `fetch`, so stubbing `fetch` does not
interfere with the request under test).

## Files to modify/create

- `packages/emulator/package.json` — add `supertest` + `@types/supertest`
  devDependencies (do this via the yarn command below, not by hand-editing).
- `packages/emulator/src/emulator/WhatsAppEmulator.ts` — add a small additive
  public accessor `getServer(): Server | null` returning `this.server` (used by
  supertest). Do not change any existing behavior.
- `packages/emulator/src/routes/MessageRoutes.test.ts` — new baseline
  integration test (text send round-trip).

## Implementation details

1. Add the dev dependencies (Yarn 4 workspace):
   ```
   yarn workspace @whatsapp-cloudapi/emulator add -D supertest @types/supertest
   ```
2. In `WhatsAppEmulator.ts`, add (additive only):
   ```ts
   public getServer(): Server | null {
     return this.server
   }
   ```
   (`Server` is already imported from `http` at the top of the file.)
3. Create `packages/emulator/src/routes/MessageRoutes.test.ts` establishing the
   reusable pattern. Recommended shape:
   - Use a fixed test `businessPhoneNumberId` (e.g. `'15550000001'`).
   - In `beforeAll`: construct `new WhatsAppEmulator({ businessPhoneNumberId,
port: 0, log: { level: 'quiet' } })` and `await emulator.start()`
     (`port: 0` → OS-assigned ephemeral port, avoids collisions across the
     parallel test files added later).
   - Build the supertest agent from the running server:
     `const request = supertest(emulator.getServer()!)`.
   - In `afterAll`: `await emulator.stop()`.
   - Test: `POST /v25.0/{businessPhoneNumberId}/messages` with a valid text body
     (`{ messaging_product:'whatsapp', to:'+15551234567', type:'text',
text:{ body:'hi' } }`); assert `200` and the response shape
     (`messaging_product:'whatsapp'`, `contacts[0].input`, `messages[0].id`).
   - Add a negative test: wrong version segment (e.g. `/v1.0/...`) → `400`.
4. Keep the baseline test minimal — its job is to prove the harness. Later tasks
   (4.2–4.5) add their own `*.test.ts` files using the same start/stop +
   `supertest(emulator.getServer()!)` pattern.

## Testing suggestions

- The deliverable IS the test; verify it passes:
  `yarn vitest run packages/emulator/src/routes/MessageRoutes.test.ts`.
- Confirm `yarn build` still compiles (the new `getServer()` accessor + the
  supertest types).

## Gotchas

- **`port: 0`** gives each test file its own ephemeral port — important because
  Vitest runs test files in parallel; a hardcoded port (e.g. 4004) would collide
  across files.
- `supertest(server)` needs the server to be listening — call it **after**
  `await emulator.start()`.
- The URL path must use the real version (`v25.0`) and the **same**
  `businessPhoneNumberId` configured on the emulator, or `validatePhoneNumberId`
  / `validateVersion` returns `400`.
- For webhook-asserting tests (later tasks): configure the emulator with a
  `webhook` config and `vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok:
true, status: 200 }))`; because the status webhook fires asynchronously
  (`void …`), await it with `vi.waitFor(() => expect(mockFetch)
.toHaveBeenCalled())` before asserting the payload.
- `mockReset: true` resets mocks between tests — set up `fetch`/`vi.stubGlobal`
  per test or in `beforeEach`.
- Do not introduce a shared helper file under `src/` that the build would
  publish; inline the start/stop in each test file (or place a helper under
  `src/__test__/`, which the package's `files` globs exclude from the npm
  tarball).

## Verification checklist

- [ ] `supertest` + `@types/supertest` are in the emulator's devDependencies
      (installed via `yarn workspace … add -D`).
- [ ] `WhatsAppEmulator` has an additive `getServer()` accessor; no existing
      behavior changed.
- [ ] `MessageRoutes.test.ts` starts the emulator on an ephemeral port, sends a
      text message via supertest, asserts `200` + response shape, and asserts a
      bad version → `400`.
- [ ] `yarn build` compiles; `yarn lint` passes.
- [ ] End-to-end tests:
      `yarn vitest run packages/emulator/src/routes/MessageRoutes.test.ts`
      passes.
