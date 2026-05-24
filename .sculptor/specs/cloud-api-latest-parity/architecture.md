# Cloud API Latest-Version Parity — Architecture

## Executive Summary

Bring `@whatsapp-cloudapi/*` (`types`, `client`, `emulator`, `cli`) to
verified parity with WhatsApp Cloud API **v25.0** across the messaging
surface: send message types, webhooks, the full media lifecycle, and the
Block API. The work is **additive** — no public export, signature, or
emulator behavior may regress — and is **driven by a checked-in audit**
(`docs/cloud-api-v25-coverage.md`) that re-verifies every field against
Meta's docs before any code is written.

**Before:** version constants read `v25.0`, but coverage is really ~v24
with a partial, untrusted v25 attempt. `types` already define most v25
shapes; `client` ships 7 send helpers (10 message types have none); media
is image-only upload with bytes discarded and no download/delete; there is
no Block API anywhere.

**After:** an audit doc is the source of truth; `types` are corrected to
match it; `client` exposes a send helper for every v25.0 message type, the
full media lifecycle, and Block API functions; the `emulator` stores and
serves real media bytes for all categories, implements `block_users`, and
properly validates `contacts` / `contact_request`. `cli` is untouched.

## Current Architecture

```
                         @whatsapp-cloudapi monorepo (Yarn 4 workspaces)

  ┌─────────────────────────────────────────────────────────────────────┐
  │ types/  (source of truth, no runtime deps)                           │
  │   cloudapi/request.ts   CloudAPIRequest union (17 variants)          │
  │   cloudapi/response.ts  CloudAPIResponse, MediaUploadResponse, error │
  │   webhook/*.ts          WebhookMessage / WebhookChange unions        │
  │   simulation/request.ts emulator-only sim request shapes            │
  └─────────────────────────────────────────────────────────────────────┘
        ▲ workspace:*                         ▲ workspace:*
        │                                     │
  ┌───────────────────────────┐     ┌──────────────────────────────────┐
  │ client/                   │     │ emulator/  (Express)             │
  │  send<Type>Message.ts ×7  │     │  routes/MessageRoutes.ts         │
  │   text,image,buttons,     │     │   POST /:ver/:pnid/messages      │
  │   cta_url,flow,list,      │     │  routes/MediaRoutes.ts           │
  │   template                │     │   POST /:ver/:pnid/media         │
  │  markMessageRead.ts       │     │   GET/POST /debug/media/*        │
  │  uploadMedia.ts (own fetch)│    │  services/WebhookService.ts      │
  │  internal/sendRequest.ts  │     │  services/MediaPersistenceSvc    │
  │   → POST /:ver/:from/msgs │     │  emulator/WhatsAppEmulator.ts    │
  └───────────────────────────┘     └──────────────────────────────────┘
                                              ▲
                                     ┌────────┴─────────┐
                                     │ cli/ (wa-emulator)│
                                     └──────────────────┘
```

**Client request plumbing today.** `internal/sendRequest.ts` is hardwired
to `POST {base}/v25.0/{from}/messages` and maps request → response type. It
is the _only_ shared HTTP helper. `uploadMedia.ts` bypasses it and does its
own `fetch` to `/{from}/media` (multipart). There is no helper for GET /
DELETE or for non-`/messages` JSON endpoints.

**Emulator request handling today.** `MessageRoutes.handleSendMessage`
validates `to`, deeply validates `image` + the four interactive subtypes
(cta_url, flow, button, list), then `logOutgoingMessage` switches on type.
**All other types still return 200** + a `sent` status webhook — they are
merely _logged_ as "unsupported" (audio, video, document, sticker,
location, contacts) or "as text" (interactive flow/catalog/
call_permission/contact_request via the `else` branch). `MediaRoutes`
accepts only `image/jpeg`+`image/png` ≤5 MB and **discards bytes**, keeping
metadata in an in-memory `Map<string, MockMediaEntry>` (no `data`, no
`sha256`). `MediaPersistenceService` serializes that metadata to a JSON
manifest for import/export.

## Proposed Architecture

```
  docs/cloud-api-v25-coverage.md   ◄── DELIVERED FIRST (REQ-AUDIT)
        │  field-by-field Covered/Partial/Missing/Wrong, drives everything
        ▼
  ┌─────────────────────────────────────────────────────────────────────┐
  │ types/   corrected per audit (REQ-TYPES, REQ-HOOK, REQ-MEDIA-4,      │
  │          REQ-BLOCK-2)                                                 │
  │   + cloudapi/media response types (url/metadata, delete)             │
  │   + cloudapi/block.ts  block_users request/response shapes           │
  └─────────────────────────────────────────────────────────────────────┘
        ▲                                       ▲
  ┌───────────────────────────────┐   ┌──────────────────────────────────┐
  │ client/   (REQ-SEND,MEDIA,BLOCK)│  │ emulator/  (REQ-MEDIA,BLOCK,EMU) │
  │  + send: audio,video,document, │   │  MediaRoutes: all categories,    │
  │    sticker,location,contacts,  │   │   retain bytes (in-mem), GET     │
  │    reaction,catalog,           │   │   /:ver/:mediaId meta, GET        │
  │    call_permission_request,    │   │   download sub-route, DELETE     │
  │    request_contact_info        │   │  BlockRoutes: POST/DELETE/GET    │
  │  + media: getMediaUrl,         │   │   /:ver/:pnid/block_users        │
  │    downloadMedia, deleteMedia  │   │  MessageRoutes: validate+log     │
  │  + block: blockUsers,          │   │   contacts & contact_request     │
  │    unblockUsers, listBlocked   │   │  (other 8 types stay as-is)      │
  │  + internal/apiRequest.ts      │   │  Logger: contactsMessage,        │
  │    (GET/POST/DELETE JSON)      │   │   contactRequestMessage          │
  └───────────────────────────────┘   └──────────────────────────────────┘
                                              ▲
                                     ┌────────┴─────────┐
                                     │ cli/ UNCHANGED    │ (REQ-EMU-4)
                                     └──────────────────┘
```

The dependency order mirrors the spec's depth: **audit → types → client →
emulator**, with `cli` riding unchanged on the emulator.

## Component Deep Dives

### A. Audit document (REQ-AUDIT-1..4)

A new `docs/cloud-api-v25-coverage.md` (new `docs/` dir at repo root). It
is a **living checklist**, organized by surface area:

- Send message types (one row per `/messages` `type`, field-by-field)
- `/messages` behaviors (validation the emulator does / should do)
- Webhook payload / message / status / contact / error objects (per object)
- Media: upload, retrieve-URL, download, delete
- Block API: block / unblock / list

Each row records **Covered / Partial / Missing / Wrong** + a Meta-docs
reference. Crucially (REQ-AUDIT-4) it does **not** trust existing `(v25.0)`
code tags — every tagged item is re-verified. This doc is produced _first_
and is the source of truth for every REQ-TYPES / REQ-HOOK / REQ-MEDIA /
REQ-BLOCK change. It carries no code; it gates the code.

### B. Types corrections (REQ-TYPES-1..3, REQ-HOOK-1..2, REQ-MEDIA-4, REQ-BLOCK-2)

`types` already defines the full `CloudAPIRequest` union (all 17 messaging
variants incl. the 10 "missing-client" ones) and rich webhook types. This
phase is **correction, not greenfield**: apply whatever the audit marks
Wrong/Partial/Missing. Known additions regardless of audit:

- **Media responses** (REQ-MEDIA-4): a _retrieve-URL / metadata_ response
  (`url`, `mime_type`, `sha256`, `file_size`, `id`, `messaging_product`)
  and a _delete_ response (`success: boolean`). Today only
  `CloudAPIMediaUploadResponse` exists.
- **Block API** (REQ-BLOCK-2): a new `cloudapi/block.ts` with the
  `block_users` request body and block/unblock/list response shapes
  (added/removed/failed user entries, list `data` + `paging`). Exact field
  names confirmed by the audit.

Doc comments keep the existing Meta-docs-reference style (REQ-TYPES-3).

### C. Client send helpers for the 10 missing types (REQ-SEND-1..3)

Each new `send<Type>Message.ts` mirrors `sendTextMessage.ts` /
`sendImageMessage.ts`: a typed params object, build the request body, call
`sendRequest` (these are all `/messages` POSTs, so `sendRequest` is
reused unchanged), co-located `*.test.ts` that mocks `sendRequest`. New
files: audio, video, document, sticker, location, contacts, reaction,
catalog, call_permission_request, request_contact_info. All ten are added
to `client/src/index.ts`.

**Recipient addressing (REQ-SEND-3).** Several v25 types (reaction,
request_contact_info) are commonly addressed to a business-scoped user ID
(`recipient`) rather than `to`. **Every** new helper's params therefore
accept optional `to` **and/or** optional `recipient` (at least one
required; mirror the type's "`to` takes precedence" rule from
`CloudAPIMessageRequestBase`), plus `context` reply and
`biz_opaque_callback_data` where the underlying type supports them
(i.e. the `…WithContext` variants). Existing helpers keep `to` required
and unchanged (additive — REQ-LEGACY-1).

### D. Client media lifecycle (REQ-MEDIA-1..2)

- `uploadMedia.ts` — widen beyond image-only to all v25 categories
  (image, audio, video, document, sticker) using a per-category MIME +
  size table defined in `client/src/constants.ts` (Q2: duplicated
  per-package, matching today's pattern). Signature stays backward
  compatible (still a single `file: Blob`); validation widens (never
  narrows) so previously-accepted images still pass (REQ-LEGACY-1).
- `getMediaUrl.ts` — GET `/{media-id}` → metadata (incl. `url`).
- `downloadMedia.ts` — GET the returned `url` with auth → binary
  (`Blob`/`ArrayBuffer`).
- `deleteMedia.ts` — DELETE `/{media-id}` → `{ success }`.

These hit non-`/messages` paths (and use GET/DELETE), so they go through
the new `internal/apiRequest.ts` helper (Q1) rather than `sendRequest`.

### E. Client Block API (REQ-BLOCK-1, REQ-BLOCK-3)

`blockUsers.ts`, `unblockUsers.ts`, `listBlockedUsers.ts` →
POST / DELETE / GET `/{phone-number-id}/block_users`. Same plumbing
question as media (Q1). Co-located tests with mocked network layer.

### F. Emulator media: bytes + lifecycle (REQ-MEDIA-2..3)

- **Retain bytes (in-memory only, Q3).** `MockMediaEntry` gains
  `data: Buffer` and `sha256` (computed on upload). Upload stops
  discarding the multer buffer. Bytes live only in the in-memory `Map`.
- **Accept all categories.** multer `fileFilter` + size limit become a
  per-category lookup instead of the hardcoded image-only pair, and the
  upload response gains `file_size` / `mime_type` / `sha256`.
- **GET metadata** at the Graph-style path `GET /:version/:mediaId` →
  `{ url, mime_type, sha256, file_size, id, messaging_product }`. The
  `url` field points back at the emulator's own download sub-route.
- **GET download** at a download sub-route streams the retained bytes
  with the stored MIME type. Entries that lack bytes (e.g. metadata
  imported from a manifest — see below) return 404/410.
- **DELETE** `/:version/:mediaId` removes the entry → `{ success: true }`.

**Persistence (Q3 = in-memory only).** `MediaPersistenceService` keeps
serializing **metadata only**: on export it strips `data` from each entry
(retaining `sha256`), so the manifest shape is unchanged and never bloats
with binary. Imported entries therefore have no bytes — their metadata
lists fine and download returns 404/410. This is a documented dev-only
limitation, consistent with today's discard-after-upload behavior.

**Route disambiguation.** `GET /:version/:mediaId` (2 segments) and the
download sub-route do not collide with `POST /:version/:phoneNumberId/
messages` or `…/media` (3-segment POSTs) — distinct by method, segment
count, and literal suffix. Covered by route tests.

### G. Emulator Block API (REQ-BLOCK-4)

New `routes/BlockRoutes.ts` holding an in-memory `Set<string>` of blocked
user identifiers, wired in `WhatsAppEmulator.setupRoutes` under
`/:version/:phoneNumberId/block_users` (POST add, DELETE remove, GET list)
behind the existing `validateVersion` + `validatePhoneNumberId`
middleware. Responses mirror v25 (added/removed/failed entries; list
`data` + `paging`). Co-located tests exercise the Express routes.

### H. Emulator `/messages`: contacts + contact_request (REQ-EMU-1..3)

Add type guards (`isContactsMessage`, `isContactRequestMessage`) and
validation branches in `handleSendMessage`, plus `logOutgoingMessage`
cases that call two new `Logger` methods (`contactsMessage`,
`contactRequestMessage`) instead of falling to `unsupportedMessage` /
the interactive `else`→text path. Accepted messages keep flowing through
the existing success-response + status-webhook path (REQ-EMU-2). The other
eight unhandled types are **left exactly as-is** (REQ-EMU-3) — they already
return 200 today, so this stays backward compatible.

### I. Internal request plumbing (cross-cutting, Q1)

Media metadata/download/delete and Block API need GET/DELETE on
non-`/messages` paths, which `sendRequest` (POST `/messages` only) can't
do. Resolution (Q1): add a small **`client/src/internal/apiRequest.ts`**
helper for JSON GET/POST/DELETE against an arbitrary path. It centralizes
the `Authorization` header and the existing throw-on-`!ok` error
convention; `sendRequest` stays message-specific (keeping its clean
request-type→response-type mapping), and `uploadMedia` may optionally be
refactored onto it later (not required). The new media (get-URL, delete)
and Block API (block/unblock/list) helpers call `apiRequest`;
`downloadMedia` fetches the binary `url` directly (non-JSON response).

## Data Model Changes

- **`MockMediaEntry`** (`emulator/src/types/media.ts`): add
  `data: Buffer` and `sha256: string`. `MediaPersistenceService` strips
  `data` on export (manifest stays metadata-only, Q3).
- **Media spec table** (Q2 = duplicated per-package):
  `category → { mimeTypes[], maxBytes }` for image, audio, video,
  document, sticker, defined in **both** `client/src/constants.ts` and
  the emulator (its `constants.ts`, consumed by `MediaRoutes`). The
  existing image-only constants are widened in place.
- **`types/cloudapi`**: new media URL/metadata + delete response types
  (REQ-MEDIA-4); new `block.ts` request/response types (REQ-BLOCK-2).
- **Emulator blocked-users store**: in-memory `Set<string>` in
  `BlockRoutes` (no persistence — parity convenience only).
- **No DB / schema migrations** — everything is in-memory or type-level.

## Migration Strategy

Purely **additive, single release**. All changes are new files, new
optional fields, or new union members; existing exports, signatures, type
names, and emulator HTTP behavior are preserved (REQ-LEGACY-1). If the
audit reveals an existing tagged field is _Wrong_ and must change shape in
a breaking way, that single change is called out and shipped as a `feat!:`
Conventional Commit; everything else is `feat:`. No online/offline or
compatibility-window concerns — this is a library + local emulator.

## Files to Modify / Create / Delete

**Create — docs**

- `docs/cloud-api-v25-coverage.md` — the audit (REQ-AUDIT).

**Create — types**

- `packages/types/src/cloudapi/block.ts` — block_users request/response.

**Modify — types**

- `packages/types/src/cloudapi/response.ts` — media URL/metadata + delete
  responses; audit-driven corrections.
- `packages/types/src/cloudapi/request.ts` — audit-driven corrections.
- `packages/types/src/cloudapi/index.ts` — export `block.ts`.
- `packages/types/src/webhook/*.ts` — audit-driven corrections (REQ-HOOK).

**Create — client**

- `send{Audio,Video,Document,Sticker,Location,Contacts,Reaction,Catalog,`
  `CallPermissionRequest,RequestContactInfo}Message.ts` (+ `.test.ts`).
- `getMediaUrl.ts`, `downloadMedia.ts`, `deleteMedia.ts` (+ `.test.ts`).
- `blockUsers.ts`, `unblockUsers.ts`, `listBlockedUsers.ts` (+ `.test.ts`).
- `internal/apiRequest.ts` shared GET/POST/DELETE helper (+ `.test.ts`).

**Modify — client**

- `uploadMedia.ts` — all media categories (+ test).
- `constants.ts` — per-category media MIME + size table.
- `index.ts` — export all new functions.

**Create — emulator**

- `routes/BlockRoutes.ts` (+ `.test.ts`).

**Modify — emulator**

- `routes/MediaRoutes.ts` — retain bytes, all categories, GET metadata,
  GET download, DELETE.
- `routes/MessageRoutes.ts` — contacts + contact_request validation/log.
- `services/Logger.ts` — `contactsMessage`, `contactRequestMessage`.
- `services/MediaPersistenceService.ts` — bytes handling per Q3.
- `types/media.ts` — `data`, `sha256` on `MockMediaEntry`.
- `emulator/WhatsAppEmulator.ts` — wire BlockRoutes + media download/
  delete/metadata routes.

**Delete** — none (additive).

## Alternatives Considered

- **(Q1) Client HTTP plumbing — CHOSEN: shared `internal/apiRequest.ts`.**
  Rejected per-function `fetch` (duplicates auth/error handling across ~6
  new functions) and generalizing `sendRequest` (would muddy its clean
  message-type→response-type mapping that the send helpers depend on).
- **(Q2) Media-spec table — CHOSEN: duplicated per-package.** Rejected a
  shared runtime table in `types`: `types` is today both runtime-dep-free
  and value-free (pure types), and adding runtime constants shifts that
  contract. Duplication matches the current reality (MIME lists are
  already duplicated in client + emulator); drift risk is mitigated by
  each package's own upload tests asserting the accepted matrix.
- **(Q3) Media bytes — CHOSEN: in-memory only, manifest metadata-only.**
  Rejected persisting bytes (base64 in manifest or sidecar files): it
  bloats the manifest for a dev-only convenience and is YAGNI. Cost:
  downloads don't survive a manifest import — documented as a limitation,
  consistent with today's discard-after-upload behavior.
- **(Q4) Send-helper addressing — CHOSEN: `to` and/or `recipient` on all
  new helpers.** Rejected adding `recipient` only to BSUID-documented
  types (less uniform; callers can't predict which helpers support it) and
  keeping `to`-only (fails REQ-SEND-3).
- **Validating all 10 emulator message types now** — rejected: spec
  Non-Goals defer all but contacts/contact_request.
- **Supporting older API versions (v22–v24)** — rejected per spec; v25.0
  only.

## Risks and Mitigations

- **Audit drift / over-trust of existing tags** → REQ-AUDIT-4 mandates
  re-verification; audit lands first and is reviewed before code.
- **Silent backward-incompat break** (e.g. widening upload validation
  rejecting a previously-accepted file, or changing a corrected field) →
  REQ-LEGACY-1 + REQ-TEST-1: existing tests must stay green; any break is
  explicit `feat!:`.
- **Express route collisions** (Graph-style media GET `/:ver/:mediaId`
  vs `/:ver/:pnid/messages`) → disambiguate by HTTP method + segment count
  - literal suffixes; covered by route tests.
- **Binary handling in tests** (Blob/Buffer across client fetch mock and
  emulator multer) → use small fixture buffers; assert sha256 + bytes
  round-trip through upload→download.
- **`mockReset: true`** (root vitest config) means per-test mock setup —
  new client tests must (re)configure the `sendRequest` / fetch mock each
  test, matching existing `*.test.ts`.

## Testing Strategy

Per `.sculptor/testing.md` — Vitest, co-located, no browser/e2e. **Client:**
mock the network layer (the `sendRequest` mock for send helpers; a `fetch`
mock for media/block helpers) and assert request shape + returned value.
**Emulator:** drive the Express app/routes directly and assert HTTP
response + emitted webhooks; for media, assert the upload→getUrl→download
byte/sha256 round-trip and DELETE; for block_users, assert add/remove/list
state transitions; for contacts/contact_request, assert validation
rejects bad payloads and accepted ones return 200 + status webhook.
**Types:** pure type changes need no runtime test; small runtime asserts
for any new value tables. **Non-regression (REQ-LEGACY-1):** the full
existing suite stays green.

## Open Questions

All four architecture decisions (Q1 client plumbing, Q2 media-spec table
location, Q3 emulator media bytes/persistence, Q4 send-helper addressing)
are **resolved** — see Alternatives Considered. The spec's own Open
Questions are empty.

One item the **audit will settle** (not blocking this architecture): the
exact v25 field names/shapes for the Block API responses (added/removed/
failed entries, list `data` + `paging`) and the media URL/metadata
response. `cloudapi/block.ts` and the media response types are written
against whatever the audit confirms; if any existing tagged field is found
**Wrong** and must change shape incompatibly, that one change ships as
`feat!:` (REQ-LEGACY-1).
