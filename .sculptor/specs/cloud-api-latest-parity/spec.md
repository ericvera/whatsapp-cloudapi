# Cloud API Latest-Version Parity

## Overview

Bring the `@whatsapp-cloudapi` monorepo (`types`, `client`, `emulator`,
`cli`) to accurate parity with the **latest** WhatsApp Cloud API
(**v25.0**, released 2026-02-18) per Meta's official docs, so consumers
can trust the types and the emulator behaves like the real API.

**Why now:** the repo is effectively on **v24** with a **partial,
unverified** attempt to reach v25. The version constants read `v25.0`
(`WhatsAppCloudAPIVersion`, `SupportedVersion`, `CloudAPIVersion`) but
overstate coverage — so existing `(v25.0)`-tagged fields/comments
cannot be trusted. This is a completeness _and_ correctness pass, not a
version bump.

**Approach:**

- **Audit first.** A checked-in, field-by-field gap analysis is the
  first deliverable; it drives the implementation requirements.
- **Target v25.0 only**, verified from scratch (no support for older
  versions).
- **Depth: types → client → emulator** (`types` is the source of
  truth; `cli` rides on the emulator).

**Scope:** messaging (send) + webhooks + media + Block API. Everything
else is out of scope — see Non-Goals.

## Current State (preliminary gap analysis)

This snapshot seeds the formal audit (REQ-AUDIT); the audit re-verifies
everything field-by-field against the v25.0 docs.

**Client — missing send functions.** `client` exports send functions
for text, image, buttons, cta_url, flow, list, template (+
markMessageRead, uploadMedia). The `types` `CloudAPIRequest` union also
defines 10 types with **no** client function: audio, video, document,
sticker, location, contacts, reaction, catalog_message,
call_permission_request, request_contact_info.

**Emulator — `/messages` handling** (`MessageRoutes.logOutgoingMessage`):

| Message type                                                                   | Emulator today                                                                |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| text, image, reaction, interactive (buttons/list/cta_url), template, mark-read | fully handled                                                                 |
| audio, video, document, sticker, location, contacts                            | fall through to `default` → "unsupported" log, **no validation**              |
| interactive flow, catalog_message, call_permission_request, contact_request    | hit the interactive `else` → logged as plain text (`// …log as text for now`) |

**Emulator — media** (`MediaRoutes`): upload accepts only `image/jpeg`
and `image/png` (5 MB); no download, no delete; bytes discarded after
validation.

**Not covered at all** (mostly Non-Goals; Block API is the exception —
now in scope): media download/delete, message-template management,
phone-number registration, business profile, two-step PIN, QR
codes/short links, Flows management API, Calling API, **Block API**,
conversational components, and non-messaging webhook fields.

**Already-landed v25.0 work to re-verify, not assume:** reaction
messages, business-scoped user IDs (BSUIDs), and new error/response
fields appear present — the audit must confirm correctness/completeness
rather than trust the tags.

## Requirements

### Audit — REQ-AUDIT

- **REQ-AUDIT-1 (MUST):** Produce a checked-in gap-analysis doc at
  **`docs/cloud-api-v25-coverage.md`** enumerating the v25.0 messaging
  surface — send message types, `/messages` behaviors, webhook
  payload/status/contact/error fields, media upload/download/delete,
  and the Block API (`block_users`: block/unblock/list) — marking each
  Covered / Partial / Missing with a Meta-docs reference.
- **REQ-AUDIT-2 (MUST):** Be **field-by-field** for the covered
  surface (per message type and webhook object). This doc is the source
  of truth for the requirements below.
- **REQ-AUDIT-3 (SHOULD):** Structure it as a living checklist,
  re-runnable when Meta publishes a new version.
- **REQ-AUDIT-4 (MUST):** Do **not** trust existing `(v25.0)` tags;
  the v24→v25 migration is incomplete, so re-verify every tagged item
  against the docs and mark Missing / Partial / Wrong / Covered.

### Types (source of truth) — REQ-TYPES

- **REQ-TYPES-1 (MUST):** `@whatsapp-cloudapi/types` MUST define
  complete, correct types for every messaging-surface request,
  response, webhook payload, and media response in v25.0 — no missing
  documented fields, no fields v25.0 doesn't define.
- **REQ-TYPES-2 (MUST):** The `CloudAPIRequest`, `WebhookMessage`, and
  `WebhookChange` unions MUST include every documented v25.0 variant
  for the messaging surface.
- **REQ-TYPES-3 (SHOULD):** Each type/field SHOULD carry a doc comment
  referencing the Meta docs, matching the style in `request.ts` /
  `message.ts`.

### Sending messages (client) — REQ-SEND

- **REQ-SEND-1 (MUST):** The client MUST expose a typed send function
  for **every** v25.0 `/messages` message type, including the 10
  currently missing (audio, video, document, sticker, location,
  contacts, reaction, catalog, call-permission-request,
  request-contact-info).
- **REQ-SEND-2 (MUST):** Each new send function MUST follow existing
  client conventions — naming (`send<Type>Message.ts`), parameter
  object shape, use of `internal/sendRequest.ts`, and a co-located
  `*.test.ts` (mirroring `sendTextMessage.ts` / `.test.ts`).
- **REQ-SEND-3 (SHOULD):** Support applicable v25.0 base-request
  options where relevant (`context` reply,
  `biz_opaque_callback_data`, business-scoped `recipient`).

### Webhooks — REQ-HOOK

- **REQ-HOOK-1 (MUST):** Every v25.0 messaging-surface webhook payload,
  message type, status, contact, and error object MUST be represented
  in the `webhook` types with all documented fields.
- **REQ-HOOK-2 (MUST):** The webhook `field` union MUST cover the
  messaging-related fields documented for v25.0 (the `messages` field
  plus the user/BSUID-related fields already present); add any the
  audit finds missing.

### Media (client + emulator) — REQ-MEDIA

- **REQ-MEDIA-1 (MUST):** The client MUST support the full media
  lifecycle — **upload**, **retrieve media URL** (GET `/{media-id}`)
  and **download** the binary, and **delete** by media ID — matching
  v25.0, with correct types.
- **REQ-MEDIA-2 (MUST):** Media upload (**client and emulator**) MUST
  support all v25.0 media categories (image, audio, video, document,
  sticker) with documented MIME types and size limits — not
  image-only.
- **REQ-MEDIA-3 (MUST):** The emulator MUST implement media **download**
  and **delete**: it MUST retain uploaded bytes in memory and return
  them on download, with GET `/{media-id}` returning the documented
  metadata (url, mime_type, sha256, file_size).
- **REQ-MEDIA-4 (MUST):** Media types (upload response, metadata/url
  response, delete response) MUST be complete and correct for v25.0.

### Block API (client + types + emulator) — REQ-BLOCK

- **REQ-BLOCK-1 (MUST):** The client MUST expose typed functions for
  the v25.0 Block API: **block**, **unblock**, and **list blocked
  users** (`block_users` POST / DELETE / GET).
- **REQ-BLOCK-2 (MUST):** `types` MUST define complete, correct
  block_users request/response shapes for v25.0 (user identifier,
  success/failure entries, list paging), verified by the audit.
- **REQ-BLOCK-3 (MUST):** Block API client functions MUST follow
  existing client conventions and have co-located Vitest tests with a
  mocked network layer.
- **REQ-BLOCK-4 (MUST):** The **emulator** MUST implement the
  `block_users` endpoints (POST/DELETE/GET), tracking blocked users in
  memory and returning v25.0-consistent responses, with co-located
  tests.

### Emulator `/messages` (contacts + contact_request only) — REQ-EMU

_(Emulator media and Block API are covered by REQ-MEDIA / REQ-BLOCK;
this section is only about `/messages` message-type handling.)_

- **REQ-EMU-1 (MUST):** The `/messages` handler MUST properly validate
  and log **`contacts`** and interactive **`contact_request`**
  (request_contact_info) per v25.0 constraints — instead of dropping
  `contacts` to "unsupported" and logging `contact_request` as text.
- **REQ-EMU-2 (MUST):** Accepted `contacts` / `contact_request` MUST
  flow through the existing send path (success response + status
  webhook), like other handled types.
- **REQ-EMU-3 (MUST):** All other currently-unhandled types (audio,
  video, document, sticker, location; interactive flow /
  catalog_message / call_permission_request) are **left as-is** in the
  emulator this spec (see Non-Goals).
- **REQ-EMU-4 (SHOULD):** The `cli` package MUST keep working unchanged
  from the user's perspective.

### Non-regression & testing — REQ-LEGACY / REQ-TEST

- **REQ-LEGACY-1 (MUST):** All existing public exports, signatures,
  type names, and emulator validation behavior MUST stay backward
  compatible (additive work). Any unavoidable break MUST be called out
  and use a `feat!:` Conventional Commit.
- **REQ-TEST-1 (MUST):** Every new client function and new emulator
  route/behavior MUST have co-located Vitest tests per
  `.sculptor/testing.md`.

## User Scenarios

Users = developers consuming the published `@whatsapp-cloudapi/*`
packages and the emulator.

- **A — Read the audit:** a maintainer opens
  `docs/cloud-api-v25-coverage.md` and sees, per endpoint/field,
  Covered / Partial / Missing with doc references, and tracks parity to
  completion. (REQ-AUDIT-1, REQ-AUDIT-2)
- **B — Send any message type:** a developer sends every documented
  v25.0 type — including the 10 with no helper today — with fully typed
  bodies and no `any` casts. (REQ-SEND-1, REQ-SEND-2, REQ-TYPES-1)
- **C — Narrow a webhook:** a developer exhaustively narrows an inbound
  payload by `field` and message `type`; every v25.0 payload, status,
  contact, and error field is present and correctly typed. (REQ-HOOK-1,
  REQ-HOOK-2, REQ-TYPES-1)
- **D — Manage media:** a developer uploads each media type, fetches a
  media URL and downloads the binary, and deletes it — via client
  functions, exercised end-to-end against the emulator (which accepts
  all media types and stores/serves real bytes). (REQ-MEDIA-1..4)
- **E — Block users:** a developer blocks, unblocks, and lists blocked
  users via the client, exercised against the emulator's `block_users`
  endpoints. (REQ-BLOCK-1, REQ-BLOCK-2, REQ-BLOCK-4)
- **F — Emulator handles contacts/contact_request:** sending a
  `contacts` or `contact_request` message is validated/logged properly
  and runs through the normal send + status-webhook flow; other
  unhandled types stay as-is. (REQ-EMU-1, REQ-EMU-2, REQ-EMU-3)
- **G — Existing integrations keep working:** current send functions,
  webhook types, and media upload keep working unchanged after the
  upgrade. (REQ-LEGACY-1)

## Non-Goals

- **Business Management endpoints:** message-template management,
  phone-number registration, business profile, two-step PIN, QR
  codes/short links, the Flows _management_ API, the _Calling_ API
  (beyond the existing `call_permission_request` message type), and
  conversational components (welcome messages, ice breakers, commands).
- **Most emulator `/messages` types:** only `contacts` and
  `contact_request` get proper emulator handling; audio, video,
  document, sticker, location, and interactive flow / catalog_message /
  call_permission_request stay as-is in the emulator. (Their **client**
  send functions and **types** are still in scope — only emulator
  `/messages` handling is deferred.)
- **Non-messaging webhook subscription fields** (account/quality,
  template-status, flows/calls updates) beyond what is already present.
- **Older versions:** only v25.0; no correctness guarantee for v22–v24.
- **No new runtime dependencies** and no architectural rewrite — parity
  within the existing structure.
- **Group messaging send flows** are not a focus (existing
  group-related fields may remain).

## Open Questions

None — all scope decisions were resolved during Q&A and are reflected
in Requirements and Non-Goals above.
