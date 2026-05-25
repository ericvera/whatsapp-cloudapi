# WhatsApp Cloud API v25.0 — Coverage Inventory

> Inventory of what this library implements against the documented WhatsApp
> Cloud API **v25.0** surface: send messages, media, block users, webhooks, and
> business-scoped user IDs (BSUID). Each row states whether the **current code**
> matches the documented spec. Rows marked `🟡` or `➖` carry a numbered note
> below the table explaining the deviation.

## Status legend

A single status dimension: how closely does the code, as it is right now,
conform to the documented v25.0 spec for that item?

| Status           | Meaning                                                                                                                    |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------- |
| ✅ Matches       | **Exactly** matches the documented v25.0 spec for this item.                                                               |
| 🟡 Partial       | Implemented, but not an exact match — a superset, an optionality difference, or a deliberate simplification. See the note. |
| ➖ Not supported | Documented by Meta but not implemented. See the note.                                                                      |

Every `🟡` and `➖` carries a numbered note; each is a conscious decision (a
relaxation or superset we accept, or behaviour we chose not to build), not an
unexplained gap.

## Versions & maintenance

- **API version covered:** `v25.0` (released 2026-02-18; the live reference
  pages used here were "Updated: May 21, 2026").
- **Repo version constants:**
  `WhatsAppCloudAPIVersion` (`packages/client/src/constants.ts`),
  `SupportedVersion` (`packages/emulator/src/constants.ts`),
  `CloudAPIVersion` (`packages/types/src/cloudapi/response.ts`).
- **How to re-run this inventory when Meta ships a new version:**
  1. Bump the three version constants above.
  2. Re-open each URL in [References](#references) (prefer Playwright MCP —
     these pages are JS-rendered; the reference pages also expose a
     **"View as Markdown"** link, e.g. `…/message-api/v25.0.md/`, which WebFetch
     reads cleanly).
  3. Re-walk every table below against the rendered docs and update the
     **Status** column (and the numbered notes) to match the code as it then
     stands.

---

## 1. Send message types (`POST /{phone-number-id}/messages`)

The `CloudAPIRequest` union (`packages/types/src/cloudapi/request.ts`) has 19
variants, each with a typed client helper in `packages/client/src`.

### 1.1 Common message envelope (`CloudAPIMessageRequestBase`)

| Field                      | Documented as                     | Status |
| -------------------------- | --------------------------------- | ------ |
| `messaging_product`        | required (`'whatsapp'`)           | ✅     |
| `recipient_type`           | required (`individual` / `group`) | ✅     |
| `to`                       | phone / group id                  | ✅     |
| `recipient`                | BSUID (see §6)                    | ✅     |
| `type`                     | required discriminant             | ✅     |
| `context.message_id`       | reply threading (all types)       | ✅     |
| `biz_opaque_callback_data` | tracking string (≤512)            | ✅     |
| `message_activity_sharing` | event-sharing override            | ✅     |

`recipient_type` is required (the API defaults it to `individual`). `context` is
a top-level field available on every message type. At least one of `to` /
`recipient` is required — enforced at the type level by
`CloudAPIRecipientAddressing` on `CloudAPIRequest`, with `to` taking precedence
when both are present.

### 1.2 Per-type coverage

Each row is one `CloudAPIRequest` variant. Media `{id|link}` (exactly one)
applies to the media types.

| Type                       | Implementing type                                 | Key fields                                                  | Status |
| -------------------------- | ------------------------------------------------- | ----------------------------------------------------------- | ------ |
| `text`                     | `CloudAPISendTextMessageRequest`                  | `text.{body, preview_url?}`                                 | ✅     |
| `image`                    | `CloudAPISendImageMessageRequest`                 | `image.{id?, link?, caption?}`                              | ✅     |
| `audio`                    | `CloudAPISendAudioMessageRequest`                 | `audio.{id?, link?}`                                        | ✅     |
| `video`                    | `CloudAPISendVideoMessageRequest`                 | `video.{id?, link?, caption?}`                              | ✅     |
| `document`                 | `CloudAPISendDocumentMessageRequest`              | `document.{id?, link?, caption?, filename?}`                | ✅     |
| `sticker`                  | `CloudAPISendStickerMessageRequest`               | `sticker.{id?, link?}`                                      | ✅     |
| `location`                 | `CloudAPISendLocationMessageRequest`              | `location.{latitude, longitude, name?, address?}`           | ✅     |
| `contacts`                 | `CloudAPISendContactsMessageRequest`              | `contacts[]` (`name`/`phones`/`emails`/`addresses`/`org`/…) | ✅     |
| `interactive` cta_url      | `CloudAPISendInteractiveCTAURLRequest`            | `action.parameters.{display_text, url}`                     | ✅     |
| `interactive` button       | `CloudAPISendInteractiveButtonsMessageRequest`    | `action.buttons[]` (1–3)                                    | ✅     |
| `interactive` list         | `CloudAPISendInteractiveListMessageRequest`       | `action.{button, sections[]}` (≤10 rows)                    | ✅     |
| `interactive` flow         | `CloudAPISendFlowMessageRequest`                  | `action.parameters.flow_*`                                  | ✅     |
| `interactive` catalog      | `CloudAPISendCatalogMessageRequest`               | `action.parameters.thumbnail_product_retailer_id`           | ✅     |
| `interactive` call-perm    | `CloudAPISendCallPermissionRequestMessageRequest` | `interactive.action.name`                                   | ✅     |
| `interactive` contact-req  | `CloudAPISendRequestContactInfoMessageRequest`    | `action.name:'request_contact_info'`                        | ✅     |
| `interactive` product      | `CloudAPISendProductMessageRequest`               | `action.{catalog_id, product_retailer_id}`                  | ✅     |
| `interactive` product_list | `CloudAPISendProductListMessageRequest`           | `header`, `body`, `action.{catalog_id, sections[]}`         | ✅     |
| `template`                 | `CloudAPISendTemplateMessageRequest`              | `template.{name, language.code, components?}`               | ✅     |
| `reaction`                 | `CloudAPISendReactionMessageRequest`              | `reaction.{message_id, emoji}`                              | ✅     |
| mark-as-read               | `CloudAPIMarkMessageReadRequest`                  | `{status:'read', message_id, typing_indicator?}`            | ✅     |

---

## 2. Emulator `/messages` behaviour

How the emulator (`packages/emulator/src/routes/MessageRoutes.ts`) behaves
against the documented API. (Its console rendering is an internal dev
convenience, not a documented surface, so it is not assessed here.)

| Behaviour                                                                                                                  | Status |
| -------------------------------------------------------------------------------------------------------------------------- | ------ |
| Reject an unsupported API version (400)                                                                                    | ✅     |
| Accept a send addressed by `to` **or** `recipient` (BSUID); 400 only when both are missing                                 | ✅     |
| Success response shape (`messaging_product`, `contacts[]`, `messages[]`)                                                   | ✅     |
| Mark-as-read response (`{ success: true }`)                                                                                | ✅     |
| Deliver a delivery-status webhook on accept                                                                                | 🟡 ¹   |
| Request validation: `text`, `image`, `contacts`, interactive cta_url/flow/button/list/contact_request/product/product_list | 🟡 ²   |
| Request validation: `audio`, `video`, `document`, `sticker`, `location`, catalog, call_permission                          | ➖ ³   |

**Notes**

1. Fires a single status webhook; it does not reproduce the full documented
   status lifecycle (sent → delivered → read) or the conversation / pricing
   detail.
2. Validates required fields and common limits for these types, but not the
   complete documented constraint set.
3. Accepted and answered `200` (matching real-API acceptance of a well-formed
   body) but not field-validated — intentional dev-tool simplification.

---

## 3. Webhook objects

Webhook types (`packages/types/src/webhook/*.ts`). The BSUID identity-field
presence in §3.1 is verified against the Business-scoped user IDs reference; the
other object shapes are modeled from code and Meta's webhooks docs (object-level
only — field shapes beyond §3.1 were not re-rendered this pass).

| Object                     | Interface(s)                                                                                                                  | Status |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------ |
| Payload / Entry / Metadata | `WebhookPayload`, `WebhookEntry`, `WebhookMetadata`                                                                           | ✅     |
| Change union               | `WebhookChange` (`messages`, `user_id_update`, `business_username_update`, `user_preferences`)                                | ✅     |
| Value                      | `WebhookValue` (`contacts?`, `errors?`, `messages?`, `statuses?`)                                                             | ✅     |
| Inbound message union      | `WebhookMessage` (text/audio/button/contacts/document/image/interactive/location/order/reaction/sticker/system/video/unknown) | ✅     |
| Reaction inbound           | `WebhookReactionMessage` (`emoji?` omitted on removal)                                                                        | ✅     |
| Contacts inbound           | `WebhookMessageContact` (`origin`, `vcard?`)                                                                                  | ✅     |
| Status                     | `WebhookStatus` (`recipient_id?`/`recipient_user_id?`/…, conversation, pricing)                                               | ✅     |
| Contact                    | `WebhookContact` (`wa_id?`/`user_id?`/…, `profile.{name, username?}`)                                                         | ✅     |
| Error                      | `WebhookError` (`code`/`title`/`message`/`error_data.details?`)                                                               | ✅     |
| Referral                   | `WebhookReferral` (CTWA fields incl. `ctwa_clid?`)                                                                            | ✅     |

### 3.1 BSUID identity-field presence (verified — BSUID reference)

| Field (block)                       | Live-doc presence                                 | Code            | Status |
| ----------------------------------- | ------------------------------------------------- | --------------- | ------ |
| `from` (message)                    | omitted when username adopted & phone unavailable | `from?`         | ✅     |
| `from_user_id` (message)            | **always**                                        | `from_user_id?` | 🟡 ¹   |
| `from_parent_user_id` (message)     | only if parent BSUIDs enrolled                    | optional        | ✅     |
| `wa_id` (contacts)                  | conditional (as `from`)                           | `wa_id?`        | ✅     |
| `user_id` (contacts)                | **always** when the contacts block is present     | `user_id?`      | 🟡 ¹   |
| `parent_user_id` (contacts)         | only if parent BSUIDs enrolled                    | optional        | ✅     |
| `recipient_id` (status)             | conditional                                       | optional        | ✅     |
| `recipient_user_id` (status)        | always, except failed status sent to a phone      | optional        | ✅     |
| `recipient_parent_user_id` (status) | only if parent BSUIDs enrolled                    | optional        | ✅     |

**Notes**

1. The reference says this field appears in every relevant messages webhook, but
   the type marks it optional. Left optional pending a decision (making it
   required is a breaking change to an inbound type — see below).

---

## 4. Media lifecycle

Endpoints: `POST /{phone-number-id}/media` (upload), `GET /{media-id}`
(get-URL/metadata), `GET /{media-url}` (download), `DELETE /{media-id}` (delete).

| Surface                        | Type / symbol                                                                        | Status |
| ------------------------------ | ------------------------------------------------------------------------------------ | ------ |
| Upload — returns `{ id }`      | `CloudAPIMediaUploadResponse`; client `uploadMedia`; emulator `POST …/media`         | 🟡 ¹   |
| Get URL / metadata             | `CloudAPIMediaURLResponse`; client `getMediaUrl`; emulator `GET /{media-id}`         | ✅     |
| Download (binary)              | client `downloadMedia`; emulator `GET …/download`                                    | ✅     |
| Delete — returns `{ success }` | `CloudAPIMediaDeleteResponse`; client `deleteMedia`; emulator `DELETE /{media-id}`   | ✅     |
| Media-ID / URL expiry          | Media IDs expire after 30 days (API) / 7 days (webhook); URLs expire after 5 minutes | 🟡 ²   |

**Notes**

1. The endpoint and emulator return `{ id }` only (matching the docs), but the
   `CloudAPIMediaUploadResponse` type additionally declares optional
   `file_size` / `mime_type` / `sha256` (a v25.0-tagged superset) that are never
   populated by the upload response.
2. The emulator gives uploaded media IDs a 30-day expiry but does not expire
   download **URLs** after 5 minutes (a returned URL stays valid for the
   emulator's lifetime). Intentional dev-tool simplification.

### 4.1 Supported media types (per-category MIME + size)

Enforced by both client `uploadMedia` and emulator `MediaRoutes`
(`MediaSpecByCategory` in each package's `constants.ts`).

| Category     | MIME types                                                                                                                                                                                               | Max size                        | Status |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | ------ |
| **image**    | `image/jpeg`, `image/png`                                                                                                                                                                                | 5 MB                            | ✅     |
| **audio**    | `audio/aac`, `audio/amr`, `audio/mpeg`, `audio/mp4`, `audio/ogg`                                                                                                                                         | 16 MB                           | ✅     |
| **video**    | `video/3gpp`, `video/mp4`                                                                                                                                                                                | 16 MB                           | ✅     |
| **document** | `text/plain`, `application/pdf`, `application/vnd.ms-excel`, `…spreadsheetml.sheet`, `application/msword`, `…wordprocessingml.document`, `application/vnd.ms-powerpoint`, `…presentationml.presentation` | 100 MB                          | ✅     |
| **sticker**  | `image/webp`                                                                                                                                                                                             | 100 KB static / 500 KB animated | 🟡 ¹   |

- Inbound media-message download cap: **100 MB** (error `131052`). Mismatched
  MIME error: `131053`.

**Notes**

1. A single 500 KB cap is enforced for stickers; the 100 KB **static**-sticker
   limit is not separately checked (a static WebP up to 500 KB is accepted). The
   code does not inspect WebP frames to tell static from animated.

---

## 5. Block API (`/{phone-number-id}/block_users`)

Synchronous; per-number errors. Documented limits: block only users who messaged
in the last 24 h; cannot block another WABA; ≤1,000 users/request; blocklist cap
64,000.

| Surface                                          | Type / symbol                                                                 | Status |
| ------------------------------------------------ | ----------------------------------------------------------------------------- | ------ |
| Block request body                               | `CloudAPIBlockUsersRequest` (`messaging_product`, `block_users[].user`)       | ✅     |
| Block — `POST` (`added_users`)                   | `CloudAPIBlockUsersResponse`; client `blockUsers`; emulator `POST`            | ✅     |
| Unblock — `DELETE` (`removed_users`)             | `CloudAPIUnblockUsersResponse`; client `unblockUsers`; emulator `DELETE`      | ✅     |
| List blocked — `GET` (`data` + `paging`)         | `CloudAPIListBlockedUsersResponse`; client `listBlockedUsers`; emulator `GET` | ✅     |
| Partial-failure shape (`failed_users` + `error`) | typed by `block.ts`                                                           | ✅     |
| Partial-failure — emulator emits it              | emulator `BlockRoutes`                                                        | ➖ ¹   |
| List pagination (`limit`/`after`/`before`)       | emulator `BlockRoutes`                                                        | ➖ ²   |

**Notes**

1. The emulator always reports full success; it never synthesises the
   partial-failure response (`failed_users` + top-level `error`). The shape is
   fully typed for real-API consumers, but the emulator has no notion of which
   users would actually fail to block. Intentional dev-tool limitation.
2. The emulator returns the full blocklist with empty cursors and ignores the
   `limit` / `after` / `before` query parameters. Intentional dev-tool
   limitation.

### 5.1 Field reference

| Field                                        | Type          | Where               |
| -------------------------------------------- | ------------- | ------------------- |
| request `block_users[].user`                 | string        | POST/DELETE body    |
| `added_users[].{input, wa_id}`               | string        | POST success        |
| `removed_users[].{input, wa_id}`             | string        | DELETE success      |
| `failed_users[].{input, wa_id?}`             | string        | POST/DELETE partial |
| `failed_users[].errors[].{message, code}`    | string/number | POST/DELETE partial |
| `failed_users[].errors[].error_data.details` | string        | partial             |
| list `data[].{messaging_product, wa_id}`     | string        | GET                 |
| list `paging.cursors.{after, before}`        | string        | GET                 |

`errors[].code` is modelled as a **number** (`CloudAPIBlockUserError.code`).

### 5.2 Block API error codes

`139100` Failed to block/unblock some users · `139101` Blocklist limit (64k) ·
`139102` Blocklist concurrent update (`version_id` mismatch) · `139103` Internal
error · `130429` Rate limit hit. (Carried as numeric `code` values on the typed
error objects.)

---

## 6. Business-scoped user IDs (BSUID)

| Item                                                                                                                       | Status |
| -------------------------------------------------------------------------------------------------------------------------- | ------ |
| Addressing: send via `recipient` (BSUID); `to` takes precedence when both are set                                          | ✅     |
| `CloudAPIResponse.contacts[]` carries `input`, `wa_id?`, `user_id?`                                                        | ✅     |
| Webhook BSUID identity fields — presence verified, see §3.1 (`from_user_id` / contacts `user_id` typed optional vs always) | 🟡     |
| Webhook BSUID changes (`user_id_update`, `business_username_update`, `user_preferences`) — see §3                          | ✅     |

---

## References

| Surface                                                  | URL                                                                                                              |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Media (upload/get-url/download/delete + supported types) | https://developers.facebook.com/docs/whatsapp/cloud-api/reference/media                                          |
| Block users (block/unblock/list + error codes)           | https://developers.facebook.com/docs/whatsapp/cloud-api/block-users/                                             |
| Messages reference (Message schema)                      | https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages (markdown: `…/message-api/v25.0.md/`) |
| Send templates guide                                     | https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-message-templates                            |
| Text messages                                            | https://developers.facebook.com/docs/whatsapp/cloud-api/messages/text-messages                                   |
| Error codes                                              | https://developers.facebook.com/docs/whatsapp/cloud-api/support/error-codes                                      |
| Webhooks components                                      | https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/components                                      |
| Set up webhooks                                          | https://developers.facebook.com/docs/whatsapp/cloud-api/guides/set-up-webhooks                                   |
| Business-scoped user IDs                                 | https://developers.facebook.com/docs/whatsapp/business-scoped-user-ids                                           |
| Typing indicators                                        | https://developers.facebook.com/docs/whatsapp/cloud-api/typing-indicators                                        |
