# WhatsApp Cloud API v25.0 — Coverage Audit

> **Source of truth** for the `cloud-api-latest-parity` work. Every type and
> behaviour change in Phases 2–4 must trace back to a row here. This document is
> code-free: it describes _coverage_, not implementation.

## Header

- **API version covered:** `v25.0` (released 2026-02-18; the live reference
  pages used here were "Updated: May 21, 2026").
- **Repo version constants (already `v25.0`):**
  `WhatsAppCloudAPIVersion` (`packages/client/src/constants.ts`),
  `SupportedVersion` (`packages/emulator/src/constants.ts`),
  `CloudAPIVersion` (`packages/types/src/cloudapi/response.ts`).
- **How this audit was produced:** field tables read from the live Meta docs via
  Playwright MCP (`browser_navigate` + `browser_snapshot`) and the reference's
  "View as Markdown" export via WebFetch. Code compared against
  `packages/types/src/cloudapi/*`, `packages/types/src/webhook/*`,
  `packages/client/src/*`, `packages/emulator/src/*`.
- **How to re-run when Meta ships a new version:**
  1. Bump the three version constants above.
  2. Re-open each URL in [References](#references) (prefer Playwright MCP —
     these pages are JS-rendered; the reference pages also expose a
     **"View as Markdown"** link, e.g.
     `…/message-api/v25.0.md/`, which WebFetch reads cleanly).
  3. Re-walk every table below, updating the **Status** column and the
     `Verified` marker. Treat all `(vXX.0)` doc-comment tags in the code as
     **unverified** until re-checked against the rendered docs (REQ-AUDIT-4).

### Legend

| Marker       | Meaning                                                                           |
| ------------ | --------------------------------------------------------------------------------- |
| ✅ Covered   | Present in code and matches the live docs.                                        |
| 🟡 Partial   | Present but incomplete, or tagged but not fully verifiable / mildly off.          |
| ❌ Missing   | In the live docs, absent from code.                                               |
| ⚠ Wrong      | Present in code but does **not** match the live docs (shape/placement is wrong).  |
| 🔬 Verified  | Re-checked against the rendered live docs in this audit pass.                     |
| 📄 Code-only | Documented from existing code; live doc table not independently re-rendered here. |

---

## 1. Send message types (`POST /{phone-number-id}/messages`)

The `CloudAPIRequest` union (`packages/types/src/cloudapi/request.ts`) has 17
variants. Meta's `Message` schema additionally defines `product` and
`product_list` (single/multi-product) interactive messages — **out of scope**
for this plan (not in the union, not in the spec). 🔬 verified against the
message-api markdown schema.

### 1.1 Common message envelope (`CloudAPIMessageRequestBase`)

| Field                      | Required (docs)          | Code          | Status | Notes                                                                                                   |
| -------------------------- | ------------------------ | ------------- | ------ | ------------------------------------------------------------------------------------------------------- |
| `messaging_product`        | ✓ (`'whatsapp'`)         | ✓             | ✅ 🔬  | Literal `'whatsapp'`.                                                                                   |
| `recipient_type`           | ✓ (`individual`/`group`) | optional      | 🟡 🔬  | Docs mark required (default `individual`). Code keeps optional — additive, harmless.                    |
| `to`                       | ✓ (phone/group id)       | optional      | 🟡 🔬  | Docs mark required. Code makes it optional to allow BSUID addressing via `recipient`; `to` precedence.  |
| `recipient`                | — (BSUID; see §6)        | optional      | ✅ 📄  | Business-scoped user ID addressing. Documented under business-scoped-user-ids.                          |
| `type`                     | ✓                        | per-variant   | ✅ 🔬  | Discriminant.                                                                                           |
| `context.message_id`       | — (reply)                | `WithContext` | ✅ 🔬  | Reply threading. Present on the `…WithContext` variants only.                                           |
| `biz_opaque_callback_data` | —                        | optional      | 🟡 📄  | Tracking string (≤512). Present in code; not detailed in the rendered schema excerpt — keep.            |
| `message_activity_sharing` | — (v25.0)                | optional      | 🟡 📄  | MM Lite / Cloud API event-sharing override. `(v25.0)` tag **not** independently confirmed — keep, flag. |

### 1.2 Per-type field coverage

Each row = one `CloudAPIRequest` variant. Media `{id|link}` semantics
(exactly one) are 🔬 verified on the message-api schema (`MediaObject`).

| Type                      | Interface                                         | Key fields                                                                              | Status | Notes                                                                                                            |
| ------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------- |
| `text`                    | `CloudAPISendTextMessageRequest`                  | `text.{body, preview_url?}`                                                             | ✅ 🔬  | `body` ≤4096.                                                                                                    |
| `image`                   | `CloudAPISendImageMessageRequest`                 | `image.{id, caption?}`                                                                  | 🟡 🔬  | Code requires `id` (no `link`). Docs allow `id`\|`link`. Narrowing is pre-existing; see §7.                      |
| `audio`                   | `CloudAPISendAudioMessageRequest`                 | `audio.{id?, link?}`                                                                    | ✅ 🔬  | One of id/link.                                                                                                  |
| `video`                   | `CloudAPISendVideoMessageRequest`                 | `video.{id?, link?, caption?}`                                                          | ✅ 🔬  |                                                                                                                  |
| `document`                | `CloudAPISendDocumentMessageRequest`              | `document.{id?, link?, caption?, filename?}`                                            | ✅ 🔬  |                                                                                                                  |
| `sticker`                 | `CloudAPISendStickerMessageRequest`               | `sticker.{id?, link?}`                                                                  | ✅ 🔬  | WebP only (see §5).                                                                                              |
| `location`                | `CloudAPISendLocationMessageRequest`              | `location.{latitude, longitude, name?, address?}`                                       | ✅ 🔬  |                                                                                                                  |
| `contacts`                | `CloudAPISendContactsMessageRequest`              | `contacts: CloudAPIContact[]`                                                           | ✅ 🔬  | Rich `name/phones/emails/addresses/urls/org/birthday`. `name` required.                                          |
| `interactive` cta_url     | `CloudAPISendInteractiveCTAURLRequest`            | `interactive.type:'cta_url'`, `action.parameters.{display_text,url}`                    | ✅ 📄  | Header text/image.                                                                                               |
| `interactive` button      | `CloudAPISendInteractiveButtonsMessageRequest`    | `interactive.type:'button'`, `action.buttons[]`                                         | ✅ 📄  | Header text/image/video/gif/document; 1–3 buttons.                                                               |
| `interactive` list        | `CloudAPISendInteractiveListMessageRequest`       | `interactive.type:'list'`, `action.{button,sections[]}`                                 | ✅ 📄  | ≤10 rows total.                                                                                                  |
| `interactive` flow        | `CloudAPISendFlowMessageRequest`                  | `interactive.type:'flow'`, `action.parameters.flow_*`                                   | 🟡 📄  | `flow_message_version:'3'`, `flow_id`\|`flow_name`, `mode`, `flow_action`. `(v25.0)` tags not re-rendered.       |
| `interactive` catalog     | `CloudAPISendCatalogMessageRequest`               | `interactive.type:'catalog_message'`, `action.parameters.thumbnail_product_retailer_id` | ✅ 🔬  | `catalog_message` confirmed in interactive type enum.                                                            |
| `interactive` call-perm   | `CloudAPISendCallPermissionRequestMessageRequest` | `interactive.type:'call_permission_request'`, `action.name`                             | ✅ 🔬  | `call_permission_request` confirmed in interactive type enum.                                                    |
| `interactive` contact-req | `CloudAPISendRequestContactInfoMessageRequest`    | `interactive.type:'contact_request'`, `action.name:'request_contact_info'`              | 🟡 📄  | Documented under business-scoped-user-ids, **not** in the message-api interactive enum. Usually BSUID-addressed. |
| `template`                | `CloudAPISendTemplateMessageRequest`              | `template.{name, language.code, components?}`                                           | 🟡 📄  | Auth-template OTP button fields tagged `(v25.0)` — not re-rendered.                                              |
| `reaction`                | `CloudAPISendReactionMessageRequest`              | `reaction.{message_id, emoji}`                                                          | ✅ 🔬  | Empty `emoji` removes the reaction. `reaction` confirmed in 200-response examples.                               |

**Mark-as-read** (`CloudAPIMarkMessageReadRequest`): `{messaging_product,
status:'read', message_id, typing_indicator?:{type:'text'}}` — ✅ 📄 (typing
indicators reference).

---

## 2. `/messages` emulator behaviours

What the emulator validates / logs today (`packages/emulator/src/routes/MessageRoutes.ts`).

| Behaviour                                      | Status | Notes                                                                                 |
| ---------------------------------------------- | ------ | ------------------------------------------------------------------------------------- |
| `version` must equal `SupportedVersion`        | ✅     | `validateVersion` middleware → 400 `UnsupportedVersionError`.                         |
| Require `to` (400 if missing)                  | 🟡     | Fires before type validation. Blocks BSUID-only `recipient` sends — see §7 / REQ-EMU. |
| Deep-validate `image` + interactive subtypes   | ✅     | cta_url, flow, button, list validated.                                                |
| text / image / reaction logged                 | ✅     |                                                                                       |
| interactive button / list / cta_url logged     | ✅     |                                                                                       |
| flow / catalog / call_permission / contact_req | 🟡     | Fall through to "logged as text".                                                     |
| audio/video/document/sticker/location/contacts | ❌     | Hit `unsupportedMessage` default. **REQ-EMU + send-helper tests need these logged.**  |
| Fire status webhook on accept                  | ✅     | `webhookService.sendMessageStatus(...)`.                                              |

---

## 3. Webhook objects

Webhook types (`packages/types/src/webhook/*.ts`) are rich and already carry
BSUID fields. 📄 documented from code against the webhooks/components &
business-scoped-user-ids references; not all field tables re-rendered this pass.

| Object                     | Interface(s)                                                                                                                  | Status | Notes                                                                                |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------ |
| Payload / Entry / Metadata | `WebhookPayload`, `WebhookEntry`, `WebhookMetadata`                                                                           | ✅ 📄  | `entry.time?` present.                                                               |
| Change union               | `WebhookChange` (`messages`, `user_id_update`, `business_username_update`, `user_preferences`)                                | ✅ 📄  | BSUID-era fields all present.                                                        |
| Value                      | `WebhookValue` (`contacts?`, `errors?`, `messages?`, `statuses?`)                                                             | ✅ 📄  |                                                                                      |
| Inbound message union      | `WebhookMessage` (text/audio/button/contacts/document/image/interactive/location/order/reaction/sticker/system/unknown/video) | ✅ 📄  | `WebhookMessageBase` has `from?/from_user_id?/from_parent_user_id?/group_id?`.       |
| Reaction inbound           | `WebhookReactionMessage`                                                                                                      | ✅ 📄  | `emoji?` omitted on removal (inbound convention differs from send's empty-string).   |
| Contacts inbound           | `WebhookMessageContact`                                                                                                       | ✅ 📄  | `origin:'contact_request'\|'other'`, `vcard?`.                                       |
| Status                     | `WebhookStatus`                                                                                                               | ✅ 📄  | `recipient_id?/recipient_user_id?/recipient_parent_user_id?`, conversation, pricing. |
| Contact                    | `WebhookContact`                                                                                                              | ✅ 📄  | `wa_id?/user_id?/parent_user_id?/identity_key_hash?`, `profile.{name,username?}`.    |
| Error                      | `WebhookError`                                                                                                                | ✅ 📄  | `code/title/message/error_data.details?/href?`.                                      |
| Referral                   | `WebhookReferral`                                                                                                             | ✅ 📄  | CTWA fields incl. `ctwa_clid?`, `welcome_message?`.                                  |

---

## 4. Media lifecycle 🔬 (fully re-rendered from the live Media reference)

Endpoints: `POST /{phone-number-id}/media` (upload), `GET /{media-id}`
(get-URL/metadata), `GET /{media-url}` (download), `DELETE /{media-id}` (delete).
Media IDs expire after **30 days** (API) / **7 days** (webhook); media **URLs
expire after 5 minutes**.

### 4.1 Upload — `POST /{phone-number-id}/media`

- Request (multipart): `messaging_product=whatsapp`, `file=@…;type=<mime>`, `type`.
- **Response: `{ "id": "<MEDIA_ID>" }` only.** 🔬

| Type / field                                                                         | Status | Notes                                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------------------ | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CloudAPIMediaUploadResponse.id`                                                     | ✅ 🔬  | The only field the upload endpoint returns.                                                                                                                                                                                                          |
| `CloudAPIMediaUploadResponse.file_size?` / `.mime_type?` / `.sha256?` (tagged v25.0) | ⚠ 🔬   | **These do NOT come back from upload.** They belong to the **GET media-URL/metadata** response (§4.2). Optional, so non-breaking, but misplaced. Keep on upload type (additive), and add the proper metadata response type in Phase 2 (REQ-MEDIA-4). |

### 4.2 Get media URL / metadata — `GET /{media-id}` ❌ (type missing)

Optional query: `phone_number_id` (processed only if it matches the upload PNID).
Response body (🔬 verified):

```
{ "messaging_product": "whatsapp", "url", "mime_type", "sha256", "file_size", "id" }
```

| Field               | Status | Notes                                                                         |
| ------------------- | ------ | ----------------------------------------------------------------------------- |
| `messaging_product` | ❌ 🔬  | `'whatsapp'`.                                                                 |
| `url`               | ❌ 🔬  | Short-lived (5 min).                                                          |
| `mime_type`         | ❌ 🔬  |                                                                               |
| `sha256`            | ❌ 🔬  |                                                                               |
| `file_size`         | ❌ 🔬  | Number (syntax block renders all placeholders as strings; treat as `number`). |
| `id`                | ❌ 🔬  |                                                                               |

→ **Phase 2 (02_01) must add this response type.** This is the canonical home of
`mime_type/sha256/file_size`.

### 4.3 Download — `GET /{media-url}`

- Binary body; `Content-Type` header indicates MIME. **Access token required.**
- Failure → `404 Not Found` (re-fetch the URL via §4.2). 🔬
- Not a JSON response → the client downloader fetches the URL directly.

### 4.4 Delete — `DELETE /{media-id}` ❌ (type missing)

- Optional query `phone_number_id`. Response: **`{ "success": true }`**. 🔬
- → **Phase 2 (02_01) must add a media-delete response type** (`{success: boolean}`;
  shape matches existing `CloudAPIMarkReadResponse` but a distinct named type).

### 4.5 Supported media types (per-category MIME + size) 🔬

Source for the per-package media table (client + emulator constants, Phase 3/4).

| Category     | MIME types                                                                                                                                                                                                                                                                                                                                      | Max size                        |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| **image**    | `image/jpeg`, `image/png`                                                                                                                                                                                                                                                                                                                       | 5 MB (8-bit RGB/RGBA)           |
| **audio**    | `audio/aac`, `audio/amr`, `audio/mpeg`, `audio/mp4`, `audio/ogg` (OPUS only, mono)                                                                                                                                                                                                                                                              | 16 MB                           |
| **video**    | `video/3gpp`, `video/mp4` (H.264 + AAC)                                                                                                                                                                                                                                                                                                         | 16 MB                           |
| **document** | `text/plain`, `application/pdf`, `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `application/vnd.ms-powerpoint`, `application/vnd.openxmlformats-officedocument.presentationml.presentation` | 100 MB                          |
| **sticker**  | `image/webp`                                                                                                                                                                                                                                                                                                                                    | 100 KB static / 500 KB animated |

- Inbound media-message download cap: **100 MB** (error `131052`).
- Mismatched MIME error: `131053`.
- **Code today:** client `uploadMedia` + emulator `MediaRoutes` accept only
  `image/jpeg`/`image/png` ≤5 MB. → widen to the full table (Phase 3/4),
  **never narrowing** the existing image entry (REQ-LEGACY-1).

---

## 5. Block API — `/{phone-number-id}/block_users` 🔬 (fully re-rendered)

Synchronous; per-number errors. Limits: block only users who messaged in the
last 24 h; cannot block another WABA; ≤1,000 users/request; blocklist cap 64,000.
**No code anywhere today** → entire surface is ❌ (types in Phase 2, client in
Phase 3, emulator in Phase 4).

### 5.1 Block — `POST .../block_users`

- Request: `{ "messaging_product": "whatsapp", "block_users": [ { "user": "<phone>" } ] }`
- Success response:
  ```
  { "messaging_product":"whatsapp",
    "block_users": { "added_users": [ { "input", "wa_id" } ] } }
  ```
- Partial-failure response adds `failed_users[]` and a top-level `error`:
  ```
  "block_users": {
    "added_users": [ { "input", "wa_id" } ],
    "failed_users": [ { "input", "wa_id", "errors": [ { "message", "code", "error_data": { "details" } } ] } ]
  },
  "error": { "message", "type", "code":139100, "error_data": { "details" }, "fbtrace_id" }
  ```

### 5.2 Unblock — `DELETE .../block_users`

- Request: identical to block.
- Response: same shape but **`removed_users`** replaces `added_users`
  (+ optional `failed_users` + top-level `error`).

### 5.3 List blocked — `GET .../block_users`

- Query: `limit?`, `after?`, `before?` (cursor pagination).
- Response:
  ```
  { "data": [ { "messaging_product":"whatsapp", "wa_id":"<id>" } ],
    "paging": { "cursors": { "after", "before" } } }
  ```

### 5.4 Field reference 🔬

| Field                                        | Type    | Where               | Notes                                                                                                                    |
| -------------------------------------------- | ------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| request `block_users[].user`                 | string  | POST/DELETE body    | WhatsApp user phone number (the `input` echoed back).                                                                    |
| `added_users[].input`                        | string  | POST success        | Echo of `user`.                                                                                                          |
| `added_users[].wa_id`                        | string  | POST success        | May differ from phone number.                                                                                            |
| `removed_users[]`                            | object  | DELETE success      | Same `{input, wa_id}`.                                                                                                   |
| `failed_users[].input`/`.wa_id`              | string  | POST/DELETE partial | `wa_id` may be absent for invalid numbers.                                                                               |
| `failed_users[].errors[].message`            | string  | POST/DELETE partial | e.g. "Re-engagement required".                                                                                           |
| `failed_users[].errors[].code`               | integer | POST/DELETE partial | e.g. `131047`. **Number**, not string (syntax block shows `"<CODE>"`, example shows `131047`, param table says Integer). |
| `failed_users[].errors[].error_data.details` | string  | partial             | e.g. "User has not messaged in the last 24 hours".                                                                       |
| list `data[].messaging_product`              | string  | GET                 | `'whatsapp'`.                                                                                                            |
| list `data[].wa_id`                          | string  | GET                 |                                                                                                                          |
| list `paging.cursors.{after,before}`         | string  | GET                 | Opaque cursors.                                                                                                          |

### 5.5 Block API error codes 🔬

`139100` Failed to block/unblock some users · `139101` Blocklist limit (64k) ·
`139102` Blocklist concurrent update (`version_id` mismatch) · `139103` Internal
error · `130429` Rate limit hit.

---

## 6. Business-scoped user IDs (BSUID) 📄

- Addressing: send via `recipient` (BSUID) when `to` (phone) is unknown; `to`
  takes precedence if both set.
- `CloudAPIResponse.contacts[]` carries `input`, `wa_id?`, `user_id?`.
- Webhook BSUID fields present across `WebhookContact`, `WebhookMessageBase`,
  `WebhookStatus`, and the `user_id_update` / `business_username_update` /
  `user_preferences` changes (see §3). ✅ 📄

---

## 7. Deltas the later phases depend on

**Concrete additions (Phase 2 — types):**

1. **Media URL/metadata response** (§4.2): `{messaging_product:'whatsapp', url,
mime_type, sha256, file_size:number, id}`.
2. **Media delete response** (§4.4): `{success: boolean}` (distinct named type).
3. **`cloudapi/block.ts`** (§5): request `{messaging_product, block_users:[{user}]}`;
   block/unblock responses with `added_users`/`removed_users` + `failed_users`
   (+ optional top-level `error`); list response `{data:[{messaging_product,
wa_id}], paging:{cursors:{after?,before?}}}`. `errors[].code` is a **number**.

**Per-category media table (Phase 3 client + Phase 4 emulator)** — §4.5. Widen
the image-only constants to `category → {mimeTypes[], maxBytes}` **without
narrowing** the existing image entry.

**Client helpers (Phase 3):** 10 send helpers (audio, video, document, sticker,
location, contacts, reaction, catalog, call_permission_request,
request_contact_info) + media lifecycle (`getMediaUrl`, `downloadMedia`,
`deleteMedia`) + Block API (`blockUsers`, `unblockUsers`, `listBlockedUsers`).

**Emulator (Phase 4):** retain media bytes for all categories; add GET
metadata / GET download / DELETE media routes; add `block_users` routes;
validate + log `contacts` and `contact_request` (today they fall through).

### Fields flagged ⚠ Wrong (may force a single `feat!:` only if shape changed)

| Item                                                       | Finding                                                            | Resolution                                                                                                                               |
| ---------------------------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `CloudAPIMediaUploadResponse.{file_size,mime_type,sha256}` | These are returned by **GET media-URL** (§4.2), **not** by upload. | They are `optional` → **non-breaking**. Keep them (additive) and add the proper metadata response type in Phase 2. No `feat!:` required. |

No existing tagged field requires a breaking shape change. The image-send
(`image.id` required, no `link`) and emulator require-`to` items are **pre-existing
narrowings**, not v25 regressions; the plan keeps them as-is (additive only).

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

</content>
</invoke>
