# Cloud API Latest-Version Parity — Implementation Plan

## Summary

Bring the `@whatsapp-cloudapi/*` monorepo (`types`, `client`, `emulator`,
`cli`) to verified parity with WhatsApp Cloud API **v25.0** across the
messaging surface: send message types, webhooks, the full media lifecycle, and
the Block API. The work is **additive** (no public export/signature/emulator
behavior may regress) and is **driven by a checked-in audit**
(`docs/cloud-api-v25-coverage.md`) that re-verifies every field against Meta's
docs before code changes. `types` are already mostly complete, so most type
work is correction + two concrete additions (media-response types, block
types); the bulk of the new code is client helpers and emulator routes.

## Phases

- **Phase 1: Audit** — produce `docs/cloud-api-v25-coverage.md`, a
  field-by-field Covered/Partial/Missing/Wrong checklist verified against the
  live Meta v25.0 docs. This is the source of truth for every type/behavior
  decision that follows.
- **Phase 2: Types** — add the missing media URL/metadata + delete response
  types and the new `block.ts` request/response shapes, then apply any
  audit-identified corrections to `request.ts` / `response.ts` / `webhook/*`.
- **Phase 3: Client** — add the shared `internal/apiRequest.ts` JSON helper,
  the ten missing send helpers, the full media lifecycle (widen upload, get-URL,
  download, delete), and the three Block API functions — each with co-located
  Vitest tests.
- **Phase 4: Emulator** — stand up a supertest-based integration test harness,
  then make media store/serve real bytes for all categories, add media
  metadata/download/delete routes, add `block_users` routes, and properly
  validate/log `contacts` + `contact_request`.
- **Phase 5: Verify & review** — run every test added by the plan to green,
  then launch the Review agent.

## Phase Rationale

The order mirrors the spec's dependency depth: **audit → types → client →
emulator**, with `cli` riding unchanged on the emulator. The audit lands first
because it gates the type corrections (REQ-AUDIT-4: don't trust existing
`(v25.0)` tags). Types are the source of truth, so they precede the client and
emulator that consume them. Within the client, `internal/apiRequest.ts` is a
foundation for the media-lifecycle and Block helpers, so it comes first; the
ten send helpers depend only on already-complete types and the existing
`sendRequest`, so they can land early. The emulator comes last because it
consumes the same types and its integration tests are the heaviest; the
test harness is built first (Phase 4 task 1) so every later emulator task can
copy the pattern. Phase 5's verify-all + review are the mandatory closing
tasks.

## Task Index

| File                                            | Task                                                                           | Phase | Requirements                                                               |
| ----------------------------------------------- | ------------------------------------------------------------------------------ | ----- | -------------------------------------------------------------------------- |
| `01_01_write_v25_coverage_audit.md`             | Write `docs/cloud-api-v25-coverage.md` audit, verified via Playwright MCP      | 1     | REQ-AUDIT-1, REQ-AUDIT-2, REQ-AUDIT-3, REQ-AUDIT-4                         |
| `02_01_media_response_types.md`                 | Add media URL/metadata + delete response types                                 | 2     | REQ-MEDIA-4, REQ-TYPES-1, REQ-TYPES-3                                      |
| `02_02_block_types.md`                          | Create `cloudapi/block.ts` + export                                            | 2     | REQ-BLOCK-2, REQ-TYPES-1, REQ-TYPES-3                                      |
| `02_03_types_audit_corrections.md`              | Apply audit-driven corrections to request/response/webhook types               | 2     | REQ-TYPES-1, REQ-TYPES-2, REQ-TYPES-3, REQ-HOOK-1, REQ-HOOK-2, REQ-AUDIT-4 |
| `03_01_internal_apiRequest.md`                  | Shared `internal/apiRequest.ts` JSON GET/POST/DELETE helper + test             | 3     | REQ-MEDIA-1, REQ-BLOCK-1, REQ-LEGACY-1                                     |
| `03_02_send_helpers_media_location_contacts.md` | Send helpers: audio, video, document, sticker, location, contacts              | 3     | REQ-SEND-1, REQ-SEND-2, REQ-SEND-3, REQ-TEST-1                             |
| `03_03_send_helpers_interactive.md`             | Send helpers: reaction, catalog, call_permission_request, request_contact_info | 3     | REQ-SEND-1, REQ-SEND-2, REQ-SEND-3, REQ-TEST-1                             |
| `03_04_client_media_table_and_upload.md`        | Per-category media table + widen `uploadMedia` to all categories               | 3     | REQ-MEDIA-2, REQ-LEGACY-1, REQ-TEST-1                                      |
| `03_05_client_media_lifecycle.md`               | `getMediaUrl`, `downloadMedia`, `deleteMedia` + tests                          | 3     | REQ-MEDIA-1, REQ-MEDIA-4, REQ-TEST-1                                       |
| `03_06_client_block_api.md`                     | `blockUsers`, `unblockUsers`, `listBlockedUsers` + tests                       | 3     | REQ-BLOCK-1, REQ-BLOCK-3, REQ-TEST-1                                       |
| `04_01_emulator_test_harness.md`                | Add supertest devDeps + integration-test harness + baseline test               | 4     | REQ-TEST-1, REQ-LEGACY-1                                                   |
| `04_02_emulator_media_bytes_upload.md`          | Retain bytes + all categories on upload; `MockMediaEntry` data/sha256          | 4     | REQ-MEDIA-2, REQ-MEDIA-3, REQ-LEGACY-1, REQ-TEST-1                         |
| `04_03_emulator_media_lifecycle_routes.md`      | GET metadata, GET download, DELETE media routes + wiring                       | 4     | REQ-MEDIA-1, REQ-MEDIA-3, REQ-MEDIA-4, REQ-TEST-1                          |
| `04_04_emulator_block_routes.md`                | `routes/BlockRoutes.ts` (POST/DELETE/GET) + wiring + tests                     | 4     | REQ-BLOCK-4, REQ-TEST-1                                                    |
| `04_05_emulator_contacts_contact_request.md`    | Validate + log `contacts` and `contact_request`                                | 4     | REQ-EMU-1, REQ-EMU-2, REQ-EMU-3, REQ-EMU-4, REQ-TEST-1                     |
| `05_01_verify_all_tests.md`                     | Run all tests added in this plan; iterate to green                             | 5     | REQ-TEST-1, REQ-LEGACY-1                                                   |
| `05_02_launch_review.md`                        | Spawn the Review agent                                                         | 5     | —                                                                          |

## Cross-cutting decisions (apply to every task)

- **Conventional Commits**, no AI attribution in commit messages or PR bodies.
- **`yarn` only** (Yarn 4 workspaces).
- **Additive only** (REQ-LEGACY-1): never change an existing export's signature
  or narrow existing validation. Any unavoidable break is called out and shipped
  as a `feat!:` commit (only expected if the audit finds an existing tagged
  field is _Wrong_).
- **Tests are co-located** `*.test.ts` next to source; Vitest with
  `mockReset: true` (root + per-package `vitest.config.mjs`), so each test
  (re)configures its mocks.
- **Emulator tests** use **supertest** (added in task 4.1) against the running
  emulator server; webhook deliveries are asserted by stubbing global `fetch`.
- **Audit verification** uses **Playwright MCP** first
  (`mcp__playwright__browser_navigate` + `browser_snapshot`), WebFetch as
  fallback, existing code as last resort.
