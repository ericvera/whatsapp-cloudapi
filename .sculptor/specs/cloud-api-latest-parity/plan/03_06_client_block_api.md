# Task 3.6: Client Block API — blockUsers, unblockUsers, listBlockedUsers

## Goal

Add three typed client helpers (with co-located tests) for the v25.0 Block API:
**block** (POST), **unblock** (DELETE), and **list blocked users** (GET) on
`/{phone-number-id}/block_users`. Export them from the client barrel.

## Requirements addressed

REQ-BLOCK-1, REQ-BLOCK-3, REQ-TEST-1

## Background

`@whatsapp-cloudapi/client` calls the Cloud API via typed helpers. Plumbing:

- `packages/client/src/internal/apiRequest.ts` (Task 3.1) — shared JSON
  `GET`/`POST`/`DELETE` helper that prepends `{baseUrl}/v25.0/{path}`, sets
  `Authorization: Bearer <token>`, and throws `"WhatsApp API Error: …"` on
  non-ok. The Block endpoints are JSON, so all three helpers use it.

**Types** (added in Task 2.2) live in `packages/types/src/cloudapi/block.ts`:
the `block_users` request body and the block/unblock/list response shapes.
Import them from `@whatsapp-cloudapi/types/cloudapi` (names per Task 2.2).

**Endpoint** (confirm field names via the audit
`docs/cloud-api-v25-coverage.md`): `POST` / `DELETE` / `GET`
`/{phone-number-id}/block_users`. The path passed to `apiRequest` is
`` `${phoneNumberId}/block_users` `` (the helper adds `{baseUrl}/v25.0/`).

`mockReset: true` is set, so each test reconfigures its mocks.

## Files to modify/create

- `packages/client/src/blockUsers.ts` (+ `.test.ts`)
- `packages/client/src/unblockUsers.ts` (+ `.test.ts`)
- `packages/client/src/listBlockedUsers.ts` (+ `.test.ts`)
- `packages/client/src/index.ts` — export the three (keep alphabetized).

## Implementation details

1. **blockUsers.ts** — params `{ accessToken, from, users, baseUrl? }` where
   `from` is the phone-number-id and `users` is the list of identifiers to
   block (type per `block.ts`). Build the request body in the shape `block.ts`
   defines, then `apiRequest({ accessToken, method: 'POST', path:
\`${from}/block_users\`, body, baseUrl })`. Return the typed block response.
2. **unblockUsers.ts** — same params; `method: 'DELETE'` with the same body
   shape; return the typed unblock response.
3. **listBlockedUsers.ts** — params `{ accessToken, from, baseUrl? }` (plus
   optional paging params like `limit`/`after` if the audit documents them —
   pass them through the `path` query string if so). `method: 'GET'`, path
   `\`${from}/block_users\``; return the typed list response (`data`+`paging`).
4. Add the three exports to `index.ts`.

## Testing suggestions

Model each `*.test.ts` on the mock-the-internal pattern (mock
`./internal/apiRequest.js`):

- **blockUsers.test.ts** — asserts `apiRequest` called with `method:'POST'`,
  `path:'<id>/block_users'`, and the correctly-shaped body; returns the parsed
  response (with `added_users` / `failed_users` per the type).
- **unblockUsers.test.ts** — `method:'DELETE'`, same path + body; returns
  removed/failed.
- **listBlockedUsers.test.ts** — `method:'GET'`, path `'<id>/block_users'`,
  returns `{ data, paging }`; if paging params are supported, assert they appear
  in the path/query.
- each: custom `baseUrl` forwarded.

## Gotchas

- All three are JSON → use `apiRequest` (not a raw `fetch`).
- The `path` passed to `apiRequest` must NOT have a leading slash and must NOT
  include the version (`apiRequest` adds `{baseUrl}/v25.0/`). Use
  `` `${from}/block_users` ``.
- Match the request/response field names from `block.ts` exactly (the audit
  settled these); a mismatch silently breaks emulator interop in Task 4.4.
- `mockReset: true` → configure the `apiRequest` mock in each test.
- ESM `.js` import extensions.

## Verification checklist

- [ ] `blockUsers.ts` (POST), `unblockUsers.ts` (DELETE), `listBlockedUsers.ts`
      (GET) each call `apiRequest` against `<id>/block_users` with the
      `block.ts` shapes.
- [ ] All three exported from `packages/client/src/index.ts`.
- [ ] `yarn build` type-checks (types from `block.ts` import cleanly).
- [ ] End-to-end tests: `blockUsers.test.ts`, `unblockUsers.test.ts`,
      `listBlockedUsers.test.ts` assert the method/path/body and returned shape;
      pass via
      `yarn vitest run packages/client/src/blockUsers.test.ts packages/client/src/unblockUsers.test.ts packages/client/src/listBlockedUsers.test.ts`.
