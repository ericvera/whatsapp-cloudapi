# WhatsApp Cloud API v25.0 — Coverage Inventory

> Inventory of what this library implements against the documented WhatsApp
> Cloud API **v25.0** surface: send messages, media, block users, webhooks, and
> business-scoped user IDs (BSUID). Each row states whether the **current code**
> matches the documented spec. Rows marked `➖` carry a numbered note below the
> table explaining the deliberate scope decision.

## Status legend

There is a single status dimension: does the code, as it is right now, match the
documented v25.0 spec for that item?

| Status           | Meaning                                                                                                                                                   |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ✅ Matches       | Current code matches the documented v25.0 spec for this item.                                                                                             |
| ➖ Not supported | Documented by Meta but intentionally not implemented, or implemented with a deliberate simplification. Every `➖` has a numbered note stating the reason. |

Every `➖` is a conscious scope decision (a client helper or emulator behaviour
we chose not to build); there are no unexplained gaps.

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

The `CloudAPIRequest` union (`packages/types/src/cloudapi/request.ts`) has 17
variants, each with a typed client helper in `packages/client/src`.

### 1.1 Common message envelope (`CloudAPIMessageRequestBase`)

| Field                      | Documented as           | Status |
| -------------------------- | ----------------------- | ------ |
| `messaging_product`        | required (`'whatsapp'`) | ✅     |
| `recipient_type`           | `individual` / `group`  | ✅     |
| `to`                       | phone / group id        | ✅     |
| `recipient`                | BSUID (see §6)          | ✅     |
| `type`                     | required discriminant   | ✅     |
| `context.message_id`       | reply threading         | ✅     |
| `biz_opaque_callback_data` | tracking string (≤512)  | ✅     |
| `message_activity_sharing` | event-sharing override  | ✅     |

`to` and `recipient` are both optional at the type level: a send is valid with
either one (`to` takes precedence when both are present). `context.message_id` is
exposed on the reply-capable variants via `CloudAPIMessageRequestWithContext`.

### 1.2 Per-type coverage

Each row is one `CloudAPIRequest` variant. Media `{id|link}` (exactly one)
applies to the media types.

| Type                       | Implementing type                                 | Key fields                                                  | Status |
| -------------------------- | ------------------------------------------------- | ----------------------------------------------------------- | ------ |
| `text`                     | `CloudAPISendTextMessageRequest`                  | `text.{body, preview_url?}`                                 | ✅     |
| `image`                    | `CloudAPISendImageMessageRequest`                 | `image.{id, caption?}`                                      | ➖ ¹   |
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
| `template`                 | `CloudAPISendTemplateMessageRequest`              | `template.{name, language.code, components?}`               | ✅     |
| `reaction`                 | `CloudAPISendReactionMessageRequest`              | `reaction.{message_id, emoji}`                              | ✅     |
| `interactive` product      | —                                                 | `action.{catalog_id, product_retailer_id}`                  | ➖ ²   |
| `interactive` product_list | —                                                 | `action.{catalog_id, sections[]}`                           | ➖ ²   |
| mark-as-read               | `CloudAPIMarkMessageReadRequest`                  | `{status:'read', message_id, typing_indicator?}`            | ✅     |

**Notes**

1. The client and types model `image.id` only; the documented `image.link`
   alternative is intentionally not supported. This is a pre-existing narrowing
   kept to avoid a breaking change (every other media type accepts `id` **or**
   `link`).
2. Single-product (`product`) and multi-product (`product_list`) interactive
   messages are intentionally out of scope: they are not in the
   `CloudAPIRequest` union and were not part of this project's spec.

---

## 2. Emulator `/messages` behaviour

Status here is whether the emulator
(`packages/emulator/src/routes/MessageRoutes.ts`) behaves like the real API for
the documented surface.

| Behaviour                                                                                                            | Status |
| -------------------------------------------------------------------------------------------------------------------- | ------ |
| `version` must equal `SupportedVersion` (400 otherwise)                                                              | ✅     |
| Accept a send addressed by `to` **or** `recipient` (BSUID); 400 only if both are missing                             | ✅     |
| Fire the status webhook on accept                                                                                    | ✅     |
| Mark-as-read handling                                                                                                | ✅     |
| Deep request validation: `text`, `image`, `contacts`, interactive cta_url/flow/button/list/contact_request           | ✅     |
| Deep request validation: `audio`, `video`, `document`, `sticker`, `location`, catalog, call_permission               | ➖ ¹   |
| Type-specific console log: `text`, `image`, `reaction`, `contacts`, contact_request, interactive button/list/cta_url | ✅     |
| Type-specific console log: `audio`, `video`, `document`, `sticker`, `location`, flow, catalog, call_permission       | ➖ ²   |

**Notes**

1. These types are accepted and answered `200` (matching real-API acceptance of
   a well-formed body), but their fields are not validated. Deep validation is a
   convenience the emulator only provides for the most-used types; intentional
   dev-tool simplification.
2. These render via the generic text / "unsupported message" logger rather than
   a dedicated bubble. Cosmetic only — the send still succeeds; intentional.

---

## 3. Webhook objects

Webhook types (`packages/types/src/webhook/*.ts`) model the documented webhook
payloads, including the BSUID-era identity fields.

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

---

## 4. Media lifecycle

Endpoints: `POST /{phone-number-id}/media` (upload), `GET /{media-id}`
(get-URL/metadata), `GET /{media-url}` (download), `DELETE /{media-id}` (delete).

| Surface                        | Type / symbol                                                                        | Status |
| ------------------------------ | ------------------------------------------------------------------------------------ | ------ |
| Upload — returns `{ id }`      | `CloudAPIMediaUploadResponse`; client `uploadMedia`; emulator `POST …/media`         | ✅     |
| Get URL / metadata             | `CloudAPIMediaURLResponse`; client `getMediaUrl`; emulator `GET /{media-id}`         | ✅     |
| Download (binary)              | client `downloadMedia`; emulator `GET …/download`                                    | ✅     |
| Delete — returns `{ success }` | `CloudAPIMediaDeleteResponse`; client `deleteMedia`; emulator `DELETE /{media-id}`   | ✅     |
| Media-ID / URL expiry          | Media IDs expire after 30 days (API) / 7 days (webhook); URLs expire after 5 minutes | ➖ ¹   |

**Notes**

1. The emulator gives uploaded media IDs a 30-day expiry but does not expire
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
| **sticker**  | `image/webp`                                                                                                                                                                                             | 100 KB static / 500 KB animated | ➖ ¹   |

- Inbound media-message download cap: **100 MB** (error `131052`). Mismatched
  MIME error: `131053`.

**Notes**

1. A single 500 KB cap is enforced for stickers; the 100 KB **static**-sticker
   limit is not separately checked (a static WebP up to 500 KB is accepted).
   Intentional simplification — the code does not inspect WebP frames to tell
   static from animated.

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

| Item                                                                                              | Status |
| ------------------------------------------------------------------------------------------------- | ------ |
| Addressing: send via `recipient` (BSUID); `to` takes precedence when both are set                 | ✅     |
| `CloudAPIResponse.contacts[]` carries `input`, `wa_id?`, `user_id?`                               | ✅     |
| Webhook BSUID fields (`WebhookContact`, `WebhookMessageBase`, `WebhookStatus`)                    | ✅     |
| Webhook BSUID changes (`user_id_update`, `business_username_update`, `user_preferences`) — see §3 | ✅     |

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
