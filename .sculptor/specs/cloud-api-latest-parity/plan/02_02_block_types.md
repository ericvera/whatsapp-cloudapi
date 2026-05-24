# Task 2.2: Create `cloudapi/block.ts` (Block API request/response types)

## Goal

Define complete, correct TypeScript types for the v25.0 **Block API**
(`block_users` block / unblock / list) in a new `block.ts`, and export them from
the `cloudapi` barrel. These types are consumed by the client Block helpers
(Task 3.6) and the emulator Block routes (Task 4.4).

## Requirements addressed

REQ-BLOCK-2, REQ-TYPES-1, REQ-TYPES-3

## Background

`@whatsapp-cloudapi/types` is the pure-types source of truth (no runtime deps).
The `cloudapi` types live in `packages/types/src/cloudapi/`:

- `request.ts` (send request types), `response.ts` (response types), and
- `index.ts`, the barrel: currently
  ```
  export * from './request.js'
  export * from './response.js'
  ```
  `index.ts` is re-exported from `packages/types/src/index.ts`. **A new file
  `block.ts` must be added to this barrel** with `export * from './block.js'`
  (note the `.js` extension — this repo is ESM and imports use `.js`).

There is **no Block API anywhere in the repo today**. The audit
(`docs/cloud-api-v25-coverage.md`, Task 1.1) records the confirmed v25.0 field
names. The Block API edge is `POST` / `DELETE` / `GET`
`/{phone-number-id}/block_users`:

- **Block (POST)** — request body lists users to block; response reports which
  were added and which failed (with reasons).
- **Unblock (DELETE)** — request body lists users to unblock; response reports
  removed/failed.
- **List (GET)** — response is a paged list of currently blocked users
  (`data` array + `paging` cursors).

User identifiers in v25.0 may be a phone number (`user`) or a business-scoped
user ID; confirm the exact request field name(s) from the audit.

## Files to modify/create

- `packages/types/src/cloudapi/block.ts` — new; request body + block/unblock/
  list response interfaces.
- `packages/types/src/cloudapi/index.ts` — add `export * from './block.js'`.

## Implementation details

1. Read `docs/cloud-api-v25-coverage.md` (Task 1.1) for the confirmed
   `block_users` request/response field names and shapes. Use those names; the
   shapes below are the expected structure to confirm against:
   - **Request body** (POST block / DELETE unblock): a `block_users` (or
     `users`) array of `{ user: string }` entries (confirm the field name).
   - **Block/unblock response**: a `block_users`/`messaging_product` wrapper
     containing `added_users` / `removed_users` and `failed_users` arrays;
     each failed entry has the user identifier plus an `errors` array (code +
     message/title). Confirm exact names against the audit.
   - **List response**: `{ data: <blocked user>[]; paging?: { cursors?:
{ before?: string; after?: string }; next?: string; previous?: string } }`.
2. Create `packages/types/src/cloudapi/block.ts` with these interfaces, each
   with doc comments + a `Ref:` to the Meta block-users docs (REQ-TYPES-3),
   matching the style of `request.ts` / `response.ts`.
3. Add `export * from './block.js'` to
   `packages/types/src/cloudapi/index.ts`.
4. Keep everything type-only — no runtime code.

## Testing suggestions

- Pure type file → no runtime Vitest test required.
- Verify with `yarn build` (tsc --build) — the new types must be importable from
  `@whatsapp-cloudapi/types/cloudapi`.
- Tasks 3.6 (client) and 4.4 (emulator) exercise these types at runtime.

## Gotchas

- Use the `.js` extension in the barrel re-export (`./block.js`) — ESM module
  resolution requires it; a bare `./block` will fail the build.
- Confirm the request field name (`block_users` vs `users`) and the
  user-identifier field (`user`) against the audit — Meta's naming here is easy
  to get wrong, and the emulator/client must match it exactly to interop.
- Keep `types` runtime-free.

## Verification checklist

- [ ] `packages/types/src/cloudapi/block.ts` exists with request, block/unblock
      response, and list response interfaces matching the audit's field names.
- [ ] Each interface has a doc comment + `Ref:` line.
- [ ] `cloudapi/index.ts` re-exports `./block.js`.
- [ ] `yarn build` type-checks; the new types import cleanly from
      `@whatsapp-cloudapi/types/cloudapi`.
