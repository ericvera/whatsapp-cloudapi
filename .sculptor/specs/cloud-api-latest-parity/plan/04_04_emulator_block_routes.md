# Task 4.4: Emulator Block API — `routes/BlockRoutes.ts` (POST/DELETE/GET)

## Goal

Implement the emulator's `block_users` endpoints — **block (POST)**,
**unblock (DELETE)**, and **list (GET)** at
`/:version/:phoneNumberId/block_users` — tracking blocked users in memory and
returning v25.0-consistent responses. Wire them in `WhatsAppEmulator` and add
co-located tests.

## Requirements addressed

REQ-BLOCK-4, REQ-TEST-1

## Background

`@whatsapp-cloudapi/emulator` is an Express app. Routes are grouped in classes
under `packages/emulator/src/routes/` (e.g. `MessageRoutes`, `MediaRoutes`) and
wired in `WhatsAppEmulator.setupRoutes()`
(`packages/emulator/src/emulator/WhatsAppEmulator.ts`). There is **no Block API
in the emulator today**.

Route plumbing to mirror:

- `validateVersion` middleware → `req.params['version'] === 'v25.0'` else 400.
- `validatePhoneNumberId` middleware → `req.params['phoneNumberId']` must equal
  the configured `businessPhoneNumberId` else 400.
- Routes are constructed in `start()` then registered in `setupRoutes()`. Each
  handler is `bind`-ed: e.g.
  `this.app.post(path, this.validateVersion.bind(this),
this.validatePhoneNumberId.bind(this),
this.blockRoutes.handleBlock.bind(this.blockRoutes))`.

Types (added in Task 2.2) live in `packages/types/src/cloudapi/block.ts`: the
`block_users` request body and block/unblock/list response shapes. Import them
and **match their field names exactly** so the client (Task 3.6) interops.

Logger: `packages/emulator/src/services/Logger.ts` (`EmulatorLogger`) — you may
add a small log call for block/unblock (optional; reuse an existing method such
as `mediaOperation`-style logging or `validationError` for bad input). A
dedicated logger method is not required by this task.

Use the supertest harness pattern from Task 4.1.

## Files to modify/create

- `packages/emulator/src/routes/BlockRoutes.ts` — new route class holding an
  in-memory `Set<string>` of blocked user identifiers, with `handleBlock`,
  `handleUnblock`, `handleList` (+ an optional getter for tests/export).
- `packages/emulator/src/emulator/WhatsAppEmulator.ts` — construct `BlockRoutes`
  in `start()` (alongside `MediaRoutes`/`MessageRoutes`) and register its three
  routes in `setupRoutes()`.
- `packages/emulator/src/routes/BlockRoutes.test.ts` — new test file.

## Implementation details

1. **BlockRoutes.ts:**
   - Constructor takes the `EmulatorLogger` (mirror `MediaRoutes`).
   - `private blockedUsers = new Set<string>()`.
   - `handleBlock(req, res)`: read the request body in the `block.ts` request
     shape (the array of user identifiers). Add each identifier to the set.
     Respond `200` with the block response shape (e.g. `added_users` for the
     newly-added ones, `failed_users: []`). Validate the body (400 if the users
     array is missing/empty), mirroring the existing routes' validation-error
     style.
   - `handleUnblock(req, res)`: remove each identifier from the set; respond with
     the unblock response (`removed_users` / `failed_users`). A user not in the
     set may be reported as removed or failed — follow the audit's documented
     behavior; default to reporting it under removed for simplicity unless the
     audit says otherwise.
   - `handleList(req, res)`: respond with `{ data: [...blocked users...],
paging: { … } }` per the list response type. Build each `data` entry in the
     shape `block.ts` defines.
   - Keep everything in memory (no persistence — parity convenience only).
2. **WhatsAppEmulator wiring:**
   - Add a `private blockRoutes: BlockRoutes | null = null` field; construct it
     in `start()` next to the other routes.
   - In `setupRoutes()` add (with the existing null-guard at the top updated to
     include `blockRoutes`):
     - `POST /:version/:phoneNumberId/block_users` (validateVersion,
       validatePhoneNumberId, handleBlock)
     - `DELETE /:version/:phoneNumberId/block_users` (…handleUnblock)
     - `GET /:version/:phoneNumberId/block_users` (…handleList)
3. Match the request/response field names to `block.ts` (the audit settled
   these) so the client Block helpers (Task 3.6) round-trip against the emulator.

## Testing suggestions

`packages/emulator/src/routes/BlockRoutes.test.ts` (supertest against the
running emulator, `port: 0`):

- **block → list:** POST `block_users` with two users → `200` + the response
  reports them added; GET `block_users` → `data` contains both.
- **unblock → list:** DELETE one → response reports it removed; GET shows only
  the remaining user.
- **idempotency/edge:** blocking an already-blocked user; unblocking a
  not-blocked user — assert the documented behavior (no crash, sensible
  response).
- **validation:** POST with a missing/empty users array → `400`.
- **middleware:** wrong version → `400`; wrong phoneNumberId → `400`.
- (Optional) interop sanity: the body shape the client `blockUsers` builds
  (Task 3.6) is accepted here.

## Gotchas

- The `/block_users` routes are 3-segment with a literal suffix — they don't
  collide with `messages`/`media` (different literals) or the 2-segment media
  GET/DELETE from Task 4.3. No special ordering needed, but keep them with the
  other `/:version/:phoneNumberId/...` routes.
- Use **both** `validateVersion` and `validatePhoneNumberId` (these paths have a
  phone-number-id segment), unlike the media GET/DELETE routes.
- Match `block.ts` field names exactly — a mismatch silently breaks client
  interop (Task 3.6) even though both compile.
- In-memory only; do not add persistence.
- `mockReset: true` → per-test setup.

## Verification checklist

- [ ] `BlockRoutes.ts` implements block/unblock/list over an in-memory
      `Set<string>`, returning the `block.ts` response shapes.
- [ ] `WhatsAppEmulator` constructs `BlockRoutes` and registers POST/DELETE/GET
      `/:version/:phoneNumberId/block_users` behind validateVersion +
      validatePhoneNumberId.
- [ ] Request/response field names match `cloudapi/block.ts`.
- [ ] `yarn build` + `yarn lint` pass.
- [ ] End-to-end tests:
      `yarn vitest run packages/emulator/src/routes/BlockRoutes.test.ts`
      passes (block/unblock/list state transitions, validation, middleware).
