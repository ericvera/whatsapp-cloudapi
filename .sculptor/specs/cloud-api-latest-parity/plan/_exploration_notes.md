# Exploration Notes — cloud-api-latest-parity

Compact reference distilled from reading the codebase. Task files repeat
the parts they need; this is the master index.

## Monorepo layout (Yarn 4 workspaces, ESM-only, strict TS, Node ≥22)

- `packages/types/src` — pure types, no runtime deps. Subpath exports:
  `@whatsapp-cloudapi/types/cloudapi`, `/webhook`, `/simulation`.
- `packages/client/src` — typed send/upload helpers; one file per helper +
  co-located `*.test.ts`.
- `packages/emulator/src` — Express emulator. **No tests exist yet.**
- `packages/cli/src` — `wa-emulator` binary (must stay unchanged).

## Build / test / verify

- Build + typecheck: `yarn build` (tsc --build across workspaces).
- Lint: `yarn lint`. Format: `yarn prettier --write .`.
- Tests: `yarn test` (= `vitest run`). Single file:
  `yarn vitest run packages/client/src/sendTextMessage.test.ts`.
- All-in-one gate: `yarn smoke` (= build && lint && test).
- Vitest configs: root `vitest.config.mjs` + per-package configs, all with
  `mockReset: true` and `include` limited to `src/**/*.test.ts`.

## Conventions

- Conventional Commits (`feat:`/`fix:`/`feat!:`) — drive versioning.
- **No AI attribution** in commits/PRs.
- `yarn` only, never `npm`.

## TYPES — current state (mostly complete; this is correction + additions)

`packages/types/src/cloudapi/request.ts` (1523 lines) already defines the
**full 17-variant `CloudAPIRequest` union** including all 10 "missing-client"
types:

- `CloudAPISendImageMessageRequest` (`type:'image'`) — extends Base, `to` only
- `CloudAPISendAudioMessageRequest` (`type:'audio'`) — extends WithContext,
  `audio:{id?,link?}`
- `CloudAPISendVideoMessageRequest` (`type:'video'`) — WithContext,
  `video:{id?,link?,caption?}`
- `CloudAPISendDocumentMessageRequest` (`type:'document'`) — WithContext,
  `document:{id?,link?,caption?,filename?}`
- `CloudAPISendStickerMessageRequest` (`type:'sticker'`) — WithContext,
  `sticker:{id?,link?}`
- `CloudAPISendLocationMessageRequest` (`type:'location'`) — WithContext,
  `location:{latitude,longitude,name?,address?}`
- `CloudAPISendContactsMessageRequest` (`type:'contacts'`) — WithContext,
  `contacts: CloudAPIContact[]` (rich `CloudAPIContact*` sub-interfaces exist)
- `CloudAPISendTextMessageRequest`, `CloudAPISendTemplateMessageRequest`
- `CloudAPISendInteractiveCTAURLRequest`,
  `CloudAPISendInteractiveButtonsMessageRequest`,
  `CloudAPISendInteractiveListMessageRequest`,
  `CloudAPISendFlowMessageRequest`
- `CloudAPISendReactionMessageRequest` (`type:'reaction'`) — extends Base,
  `reaction:{message_id,emoji}` (empty emoji removes)
- `CloudAPISendCallPermissionRequestMessageRequest` (`type:'interactive'`,
  `interactive.type:'call_permission_request'`) — WithContext
- `CloudAPISendCatalogMessageRequest` (`type:'interactive'`,
  `interactive.type:'catalog_message'`, action params
  `thumbnail_product_retailer_id`) — WithContext
- `CloudAPISendRequestContactInfoMessageRequest` (`type:'interactive'`,
  `interactive.type:'contact_request'`, action name `request_contact_info`) —
  extends Base

`CloudAPIMessageRequestBase` has: `messaging_product`, `recipient_type?`,
`biz_opaque_callback_data?`, `to?`, `recipient?` (BSUID),
`message_activity_sharing?`. **Rule: `to` and `recipient` both optional, at
least one required, `to` takes precedence.** `CloudAPIMessageRequestWithContext`
adds `context?:{message_id}`.

`packages/types/src/cloudapi/response.ts` already has:

- `CloudAPIMediaUploadResponse` — `{id, file_size?, mime_type?, sha256?}`
- `CloudAPIResponse` — contacts[] with `input/wa_id?/user_id?`, messages[] with
  `id/message_status?`
- `CloudAPIErrorResponse` — full v25 error fields
- `CloudAPIMarkReadResponse` — `{success}`
- `CloudAPIVersion = 'v25.0'`
- **MISSING:** media URL/metadata (retrieve) response and media delete response.

`packages/types/src/cloudapi/index.ts` re-exports request + response.
**block.ts does not exist** — must be created and exported here.

Webhook types (`packages/types/src/webhook/*.ts`) are very complete:

- `payload.ts` — `WebhookPayload/Entry/Metadata`, `WebhookChange` union
  (`messages`, `user_id_update`, `business_username_update`, `user_preferences`),
  `WebhookValue`, BSUID update/preference values.
- `message.ts` — `WebhookMessage` union (13 types incl. reaction, contacts,
  system, unknown), `WebhookMessageBase` with `from?/from_user_id?/...`,
  `WebhookReferral`, `WebhookMessageContact` (incl. `origin:'contact_request'`).
- `status.ts` — `WebhookStatus` with `recipient_id?/recipient_user_id?`, etc.
- `contact.ts` — `WebhookContact` with `wa_id?/user_id?/parent_user_id?`.
- `error.ts` — `WebhookError`.

**Implication:** REQ-TYPES/REQ-HOOK are largely _verification_ (REQ-AUDIT-4
re-verify the `(v25.0)` tags) + the two concrete additions (media responses,
block types).

## CLIENT — current state

`packages/client/src/index.ts` exports: constants, markMessageRead,
sendButtons, sendCTAURL, sendFlow, sendImage, sendList, sendTemplate, sendText,
uploadMedia. **Missing 10 send helpers + media lifecycle + block API.**

Reference patterns:

- `sendTextMessage.ts` — params object `{accessToken, from, to, ...,
bizOpaqueCallbackData?, baseUrl?}`; builds typed request; calls
  `sendRequest(accessToken, from, message, baseUrl)`. Test (`*.test.ts`) mocks
  `./internal/sendRequest.js` with `vi.mock`, asserts the exact 4-arg call.
- `sendImageMessage.ts` — same shape with `mediaId`, validates caption length
  via `MediaCaptionMaxLength`.
- `sendCTAURLMessage.ts` — destructured params, does client-side validation
  (char limits, URL format) then builds `interactive` body.
- `markMessageRead.ts` — non-send helper; still uses `sendRequest` (mark-read
  is a POST to /messages).
- `internal/sendRequest.ts` — hardwired `POST {baseUrl|graph}/v25.0/{from}/
messages`; maps request→response type; throws on `!response.ok`. Headers via
  `createHeaders(accessToken)` = `{Authorization: Bearer …, Content-Type:
application/json}`. **Only handles POST /messages.**
- `uploadMedia.ts` — bypasses sendRequest, own `fetch` to `/{from}/media`
  (multipart FormData). Validates `ImageMaxFileSize` (5MB) + `ImageSupportedMimeTypes`
  (`image/jpeg`,`image/png`). Test mocks global `fetch` via `vi.stubGlobal`.
- `constants.ts` — `WhatsAppCloudAPIBaseUrl='https://graph.facebook.com'`,
  `WhatsAppCloudAPIVersion='v25.0'`, plus per-feature limit constants. Media:
  `MediaCaptionMaxLength`, `ImageMaxFileSize`, `ImageSupportedMimeTypes`.
  **No per-category media table yet.**

**No `internal/apiRequest.ts`** — must be created for GET/POST/DELETE JSON on
arbitrary paths (media metadata/delete, block API). `downloadMedia` fetches the
binary URL directly (non-JSON).

## EMULATOR — current state

`packages/emulator/src/emulator/WhatsAppEmulator.ts` — Express app. Lifecycle:
`start()` imports media manifest (optional), constructs `MediaRoutes` then
`MessageRoutes`, calls `setupRoutes()`, `app.listen(port,host)`. `stop()`
optionally exports manifest, closes server. Middleware: `cors()`,
`bodyParser.json()`, request-timing logger. `validateVersion` (checks
`req.params.version === SupportedVersion`) and `validatePhoneNumberId` are
per-route middleware.

`setupRoutes()` registers (ORDER MATTERS):

- `POST /:version/:phoneNumberId/messages` (validateVersion, validatePNID)
- `POST /:version/:phoneNumberId/media` (validateVersion, validatePNID)
- `GET /debug/media/list`
- `POST /debug/media/expire/all`, `POST /debug/media/expire/:id`
- `GET /debug/health` ← **2-segment GET; would be shadowed by a
  `GET /:version/:mediaId` route if that is registered first**
- `POST /debug/messages/send-text`, `POST /debug/messages/send-interactive`
- `GET /webhook`

`routes/MediaRoutes.ts` — `mediaStorage: Map<string, MockMediaEntry>`. multer
memoryStorage, 5MB, `fileFilter` hardcoded to `['image/jpeg','image/png']`.
`handleMediaUpload` validates messaging*product, stores metadata, **discards
bytes** (response only `{id}`). Has `isMediaValid(id)` (used by MessageRoutes),
`listMedia`, `expireMedia`, `expireAllMedia`, `getMediaStorage`. Media id =
`media*${nanoid(6)}`. **No GET metadata / download / DELETE.**

`types/media.ts` — `MockMediaEntry{id,filename,mimeType,size,uploadedAt,
expiresAt}`. **No `data`/`sha256`.** Also `MediaListResponse`,
`MediaExpireResponse`.

`services/MediaPersistenceService.ts` — `importMedia`/`exportMedia` serialize
`MockMediaEntry[]` to `media-manifest.json`. **Must strip `data` on export** so
the manifest stays metadata-only.

`routes/MessageRoutes.ts` (1131 lines) — `handleSendMessage`:

1. mark-as-read short-circuit (`isMarkAsReadRequest`).
2. **requires `to`** (400 if missing) — happens before type validation.
3. deep validation for `image` and the 4 interactive subtypes (cta_url, flow,
   button, list).
4. `logOutgoingMessage(body, normalizedTo, messageId)` switches on `type`:
   - text/image/reaction handled; interactive → buttons/list/cta_url handled,
     **else (flow/catalog/call_permission/contact_request) → logged as text**;
   - template → logged as text; **default → `unsupportedMessage`** (audio,
     video, document, sticker, location, contacts).
5. returns 200 `CloudAPIResponse` + fires `webhookService.sendMessageStatus(...)`
   if configured.

Type guards present: `isCTAURLMessage`, `isFlowMessage`, `isButtonsMessage`,
`isListMessage`, `isMarkAsReadRequest`. **Need `isContactsMessage`,
`isContactRequestMessage`.**

`services/Logger.ts` — `EmulatorLogger` with methods `textMessage`,
`imageMessage`, `reactionMessage`, `interactiveButtonMessage`,
`interactiveListMessage`, `ctaUrlMessage`, `markAsRead`, `unsupportedMessage`,
`validationError`, etc. **Need `contactsMessage`, `contactRequestMessage`.**

`services/WebhookService.ts` — `sendMessageStatus(messageId, to, bizPNID,
displayPN)` posts a `statuses:[{status:'sent',...}]` payload to the configured
webhook URL via `fetch`. Also `sendIncomingMessage`, button/list reply helpers.
Status webhook for accepted contacts/contact_request reuses `sendMessageStatus`
unchanged.

`constants.ts` (emulator) — `SupportedVersion='v25.0'`,
`WhatsAppFlowMessageVersion='3'`, `UnsupportedVersionError`. **No media table.**

## KEY DECISIONS already fixed by the architecture (Q1–Q4)

- **Q1 client plumbing:** new `client/src/internal/apiRequest.ts` for JSON
  GET/POST/DELETE; `sendRequest` stays /messages-only.
- **Q2 media table:** duplicated per-package (client `constants.ts` + emulator
  `constants.ts`), `category → {mimeTypes[], maxBytes}`. Widen existing
  image-only constants in place (never narrow → REQ-LEGACY-1).
- **Q3 emulator media bytes:** retain in-memory only; manifest stays
  metadata-only (export strips `data`); imported entries have no bytes →
  download returns 404/410.
- **Q4 send-helper addressing:** every NEW helper accepts optional `to`
  and/or `recipient` (≥1 required); `…WithContext` ones also accept `context`
  reply + `bizOpaqueCallbackData`. Existing helpers keep `to` required.

## OPEN QUESTIONS for Q&A (to resolve before writing tasks)

1. **Emulator test strategy** — no emulator tests/`supertest` exist. Options:
   (A) start real server + native `fetch` integration tests (no new deps);
   (B) add `supertest` + `@types/supertest` devDeps (standard HTTP assertions);
   (C) direct handler invocation with mocked `req`/`res` (lightest, but multer
   upload hard to exercise). Affects every emulator task.
2. **Route disambiguation for media GET/DELETE** — `GET /:version/:mediaId`
   (2 seg) collides with `GET /debug/health`; register media metadata/download/
   delete routes AFTER all `/debug` + `/webhook` routes; `validateVersion`
   already 400s a `version` that isn't `v25.0`.
3. **contact_request addressing in emulator** — emulator currently 400s when
   `to` is missing; contact_request is usually BSUID-addressed (`recipient`).
   Plan: tests send contact_request WITH `to`; keep recipient-only emulator
   addressing OUT of scope (or widen the missing-`to` check to accept
   `recipient`, additive).

## REQUIREMENT → WORK MAP

- REQ-AUDIT-1..4 → Phase 1 audit doc `docs/cloud-api-v25-coverage.md`.
- REQ-TYPES-1..3, REQ-HOOK-1..2 → Phase 2 type corrections (verify tags) +
  audit-driven fixes.
- REQ-MEDIA-4 → Phase 2 media URL/metadata + delete response types.
- REQ-BLOCK-2 → Phase 2 `block.ts`.
- REQ-SEND-1..3 → Phase 3 ten send helpers (with to/recipient/context).
- REQ-MEDIA-1..2 (client) → Phase 3 apiRequest + uploadMedia widen + getMediaUrl
  - downloadMedia + deleteMedia + media table.
- REQ-BLOCK-1,3 → Phase 3 blockUsers/unblockUsers/listBlockedUsers.
- REQ-MEDIA-2..3 (emulator) → Phase 4 media bytes + lifecycle routes.
- REQ-BLOCK-4 → Phase 4 BlockRoutes.
- REQ-EMU-1..3 → Phase 4 contacts + contact_request handling.
- REQ-LEGACY-1, REQ-TEST-1 → every task additive + co-located tests; final
  verify-all-tests task.
