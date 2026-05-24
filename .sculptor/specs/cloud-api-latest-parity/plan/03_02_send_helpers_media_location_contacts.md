# Task 3.2: Send helpers — audio, video, document, sticker, location, contacts

## Goal

Add six typed client send helpers (with co-located tests) for the media-id and
data message types that have no helper today: `audio`, `video`, `document`,
`sticker`, `location`, `contacts`. Export them from the client barrel.

## Requirements addressed

REQ-SEND-1, REQ-SEND-2, REQ-SEND-3, REQ-TEST-1

## Background

`@whatsapp-cloudapi/client` exposes one `send<Type>Message.ts` per message type;
each builds a typed request object and calls
`sendRequest(accessToken, from, message, baseUrl)` from
`packages/client/src/internal/sendRequest.ts`. The barrel
`packages/client/src/index.ts` re-exports each helper. Today only text, image,
buttons, cta_url, flow, list, template, markMessageRead, uploadMedia exist; the
ten remaining `CloudAPIRequest` variants have no helper. This task adds six of
them; Task 3.3 adds the other four.

**Reference pattern — `packages/client/src/sendImageMessage.ts`:**

- A params object: `{ accessToken, from, to, mediaId, caption?,
bizOpaqueCallbackData?, baseUrl? }`.
- Validates caption length against `MediaCaptionMaxLength`
  (`packages/client/src/constants.ts`).
- Builds `CloudAPISendImageMessageRequest` with
  `messaging_product: 'whatsapp'`, `recipient_type: 'individual'`, `to`,
  `type`, the content object, and optional `biz_opaque_callback_data`.
- `return sendRequest(accessToken, from, message, baseUrl)`.

**Reference test — `packages/client/src/sendTextMessage.test.ts`:** mocks
`./internal/sendRequest.js` with `vi.mock(... () => ({ sendRequest: vi.fn() }))`,
then `const mockSendRequest = vi.mocked(sendRequest)`, and asserts the exact
4-arg call `mockSendRequest.toHaveBeenCalledWith(token, from, <message>,
baseUrl)`. Because `mockReset: true`, each test sets
`mockSendRequest.mockResolvedValueOnce(...)`.

**The types already exist** in `packages/types/src/cloudapi/request.ts`:

- `CloudAPISendAudioMessageRequest` (`type:'audio'`, `audio:{id?,link?}`)
- `CloudAPISendVideoMessageRequest` (`type:'video'`, `video:{id?,link?,caption?}`)
- `CloudAPISendDocumentMessageRequest`
  (`type:'document'`, `document:{id?,link?,caption?,filename?}`)
- `CloudAPISendStickerMessageRequest` (`type:'sticker'`, `sticker:{id?,link?}`)
- `CloudAPISendLocationMessageRequest`
  (`type:'location'`, `location:{latitude,longitude,name?,address?}`)
- `CloudAPISendContactsMessageRequest` (`type:'contacts'`, `contacts: CloudAPIContact[]`)

audio/video/document/sticker/location/contacts all extend
`CloudAPIMessageRequestWithContext` (so they support `context` reply).

**Addressing (REQ-SEND-3, architecture decision Q4):** every NEW helper accepts
**optional `to` and/or optional `recipient`** (at least one required; mirror the
`to`-takes-precedence rule). `CloudAPIMessageRequestBase` already has both `to?`
and `recipient?`. So each helper's params include `to?: string` and
`recipient?: string`, plus `context?: { messageId: string }` (these types are
`…WithContext`) and `bizOpaqueCallbackData?`.

Task 3.1 added `internal/apiRequest.ts`; these send helpers do **not** use it —
they use the existing `sendRequest` (all are `/messages` POSTs).

## Files to modify/create

- `packages/client/src/sendAudioMessage.ts` (+ `.test.ts`)
- `packages/client/src/sendVideoMessage.ts` (+ `.test.ts`)
- `packages/client/src/sendDocumentMessage.ts` (+ `.test.ts`)
- `packages/client/src/sendStickerMessage.ts` (+ `.test.ts`)
- `packages/client/src/sendLocationMessage.ts` (+ `.test.ts`)
- `packages/client/src/sendContactsMessage.ts` (+ `.test.ts`)
- `packages/client/src/index.ts` — add an `export * from './send<Type>Message.js'`
  line for each (keep the list alphabetized as it currently is).

## Implementation details

For each helper, follow the `sendImageMessage.ts` structure:

1. Import the matching request type + `CloudAPIResponse` from
   `@whatsapp-cloudapi/types/cloudapi`, and `sendRequest` from
   `./internal/sendRequest.js`.
2. Define a params interface. Common fields: `accessToken`, `from`,
   `to?: string`, `recipient?: string`, `context?: { messageId: string }`,
   `bizOpaqueCallbackData?`, `baseUrl?`. Plus type-specific content:
   - **audio:** `mediaId?: string` and/or `link?: string` (at least one).
   - **video:** `mediaId?`/`link?` + `caption?`.
   - **document:** `mediaId?`/`link?` + `caption?` + `filename?`.
   - **sticker:** `mediaId?`/`link?`.
   - **location:** `latitude: number`, `longitude: number`, `name?`, `address?`.
   - **contacts:** `contacts: CloudAPIContact[]` (import `CloudAPIContact`).
3. Validate inputs early (throw `Error` like the existing helpers):
   - Require at least one of `to` / `recipient` (e.g.
     `if (!to && !recipient) throw new Error('Either "to" or "recipient" is
required')`).
   - For audio/video/document/sticker: require at least one of `mediaId`/`link`.
   - For video/document captions: validate against `MediaCaptionMaxLength`
     (reuse the constant; mirror `sendImageMessage.ts`).
4. Build the typed request object: set `messaging_product: 'whatsapp'`, the
   content sub-object, `type`, and conditionally spread `recipient_type:
'individual'` (set it when `to` is used, matching existing helpers — see
   note in Gotchas), `to`, `recipient`, `context` (mapped to
   `{ message_id: context.messageId }`), and `biz_opaque_callback_data`.
   Map `mediaId` → `{ id: mediaId }` in the content object (e.g. `audio.id`).
5. `return sendRequest(accessToken, from, message, baseUrl)`.
6. Add the export lines to `index.ts`.

## Testing suggestions

Model each `*.test.ts` on `sendTextMessage.test.ts`:

- happy path with `to`: asserts the exact request object passed to
  `sendRequest` (messaging_product, type, content, recipient_type, to).
- `recipient`-only path: passes `recipient` (no `to`) and asserts the request
  carries `recipient` and no `to`.
- optional fields: `caption`/`filename` (where applicable), `context`
  (→ `context.message_id`), `bizOpaqueCallbackData`
  (→ `biz_opaque_callback_data`).
- validation errors: neither `to` nor `recipient` throws; missing both
  `mediaId`/`link` throws (audio/video/document/sticker); over-long caption
  throws (video/document).
- custom `baseUrl` is forwarded as the 4th arg.

## Gotchas

- `mockReset: true` → set `mockSendRequest.mockResolvedValueOnce(...)` in each
  test; don't rely on a once-configured mock.
- ESM imports use the `.js` extension (`./internal/sendRequest.js`,
  `'@whatsapp-cloudapi/types/cloudapi'`).
- `recipient_type: 'individual'` — existing helpers always set it alongside
  `to`. When sending to a `recipient` (BSUID) without `to`, do not force
  `recipient_type` (it describes `to`). Keep behavior consistent with the
  existing helpers when `to` is present.
- Only **one** of `mediaId`/`link` should be emitted per content object; don't
  emit empty `id`/`link` keys.
- `context` in params is `{ messageId }` (camelCase, client-facing) but the wire
  field is `context: { message_id }` — map it.
- Keep existing helpers untouched (REQ-LEGACY-1); this is purely additive.

## Verification checklist

- [ ] Six new `send<Type>Message.ts` files exist, each calling `sendRequest`
      and following the `sendImageMessage.ts` shape.
- [ ] Each accepts `to` and/or `recipient` (≥1 required) and the applicable
      `context` / `bizOpaqueCallbackData` options.
- [ ] All six are exported from `packages/client/src/index.ts`.
- [ ] `yarn build` type-checks (no `any` casts; types come from
      `@whatsapp-cloudapi/types/cloudapi`).
- [ ] End-to-end tests: `sendAudioMessage.test.ts`, `sendVideoMessage.test.ts`,
      `sendDocumentMessage.test.ts`, `sendStickerMessage.test.ts`,
      `sendLocationMessage.test.ts`, `sendContactsMessage.test.ts` each cover
      the `to` path, the `recipient` path, optional fields, and validation
      errors; all pass via `yarn vitest run packages/client/src/send*Message.test.ts`.
