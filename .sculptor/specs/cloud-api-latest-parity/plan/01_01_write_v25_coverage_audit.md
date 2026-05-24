# Task 1.1: Write the v25.0 coverage audit (`docs/cloud-api-v25-coverage.md`)

## Goal

Produce a checked-in, field-by-field gap-analysis document that enumerates the
WhatsApp Cloud API **v25.0** messaging surface and marks each item
**Covered / Partial / Missing / Wrong** against this repo's current code, with a
Meta-docs reference per row. This document is the **source of truth** for every
type and behavior change in the rest of the plan.

## Requirements addressed

REQ-AUDIT-1, REQ-AUDIT-2, REQ-AUDIT-3, REQ-AUDIT-4

## Background

This project is a 4-package Yarn 4 monorepo (`@whatsapp-cloudapi/types`,
`/client`, `/emulator`, `/cli`) that mirrors the WhatsApp Cloud API for
developers and ships a local Express emulator. The repo's version constants
already read `v25.0` (`WhatsAppCloudAPIVersion` in
`packages/client/src/constants.ts`, `SupportedVersion` in
`packages/emulator/src/constants.ts`, `CloudAPIVersion` in
`packages/types/src/cloudapi/response.ts`), but coverage is really ~v24 with a
**partial, unverified** v25 attempt. Many fields carry `(v25.0)` doc-comment
tags that **must not be trusted** (REQ-AUDIT-4) — re-verify each against the
live docs.

There is no `docs/` directory yet; you are creating it.

**What the code currently contains** (so the audit can compare code ↔ docs):

- Send requests: `packages/types/src/cloudapi/request.ts` defines a 17-variant
  `CloudAPIRequest` union (text, template, image, audio, video, document,
  sticker, location, contacts, interactive cta_url/buttons/list/flow, reaction,
  call_permission_request, catalog_message, request_contact_info).
- Responses: `packages/types/src/cloudapi/response.ts`
  (`CloudAPIMediaUploadResponse`, `CloudAPIResponse`, `CloudAPIErrorResponse`,
  `CloudAPIMarkReadResponse`). **No media URL/metadata or media delete response
  types yet.**
- Webhooks: `packages/types/src/webhook/*.ts` (`payload.ts`, `message.ts`,
  `status.ts`, `contact.ts`, `error.ts`) — rich, with BSUID fields.
- Client send helpers (`packages/client/src/`): only text, image, buttons,
  cta_url, flow, list, template, markMessageRead, uploadMedia exist.
- Emulator (`packages/emulator/src/routes/`): `MessageRoutes` fully handles
  text/image/reaction/interactive(buttons,list,cta_url)/template/mark-read;
  other types fall through. `MediaRoutes` upload accepts only
  `image/jpeg`/`image/png` ≤5 MB and discards bytes; no download/delete.
- **No Block API anywhere.**

## Files to modify/create

- `docs/cloud-api-v25-coverage.md` — new; the audit (new `docs/` dir at repo
  root).

## Implementation details

1. **Gather the live docs.** For each Meta documentation URL below, prefer
   the **Playwright MCP** tools — these pages are JS-rendered and WebFetch often
   returns an empty shell:
   - `mcp__playwright__browser_navigate` to the URL, then
     `mcp__playwright__browser_snapshot` to read the rendered field tables.
   - If Playwright MCP is unavailable or a page renders fine without JS, fall
     back to `WebFetch`.
   - If neither retrieves a page, document that row from the existing
     types/code and flag it (e.g. append `⚠ unverified-from-docs`).

   URLs already cited in the code comments (start here):
   - Messages reference:
     `https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages`
   - Send templates guide:
     `https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-message-templates`
   - Media reference:
     `https://developers.facebook.com/docs/whatsapp/cloud-api/reference/media`
   - Text messages:
     `https://developers.facebook.com/docs/whatsapp/cloud-api/messages/text-messages`
   - Error codes:
     `https://developers.facebook.com/docs/whatsapp/cloud-api/support/error-codes`
   - Webhooks components:
     `https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/components`
   - Business-scoped user IDs:
     `https://developers.facebook.com/docs/whatsapp/business-scoped-user-ids`
   - Set up webhooks:
     `https://developers.facebook.com/docs/whatsapp/cloud-api/guides/set-up-webhooks`
   - Typing indicators:
     `https://developers.facebook.com/docs/whatsapp/cloud-api/typing-indicators`
   - Block users (search the reference for the `block_users` edge if the direct
     URL 404s):
     `https://developers.facebook.com/docs/whatsapp/cloud-api/reference/block-users`

2. **Structure the document as a living checklist** (REQ-AUDIT-3) organized by
   surface area. Use Markdown tables. Suggested sections:
   - **Send message types** — one subsection per `/messages` `type`
     (text, image, audio, video, document, sticker, location, contacts,
     interactive cta_url/buttons/list/flow/catalog_message/
     call_permission_request/contact_request, template, reaction). For each,
     a field-by-field table (field | required? | code status | doc ref |
     Covered/Partial/Missing/Wrong | notes).
   - **`/messages` behaviors** — validation the emulator does / should do
     per type.
   - **Webhook objects** — payload, message (per inbound type), status,
     contact, error. Field-by-field.
   - **Media** — upload, retrieve-URL (GET `/{media-id}`), download, delete.
     Document the metadata response fields (`url`, `mime_type`, `sha256`,
     `file_size`, `id`, `messaging_product`), per-category MIME types and size
     limits, and the delete response (`{success}`).
   - **Block API** — block (POST), unblock (DELETE), list (GET)
     `/{phone-number-id}/block_users`: request body (user identifiers),
     success/failure entries, and list `data` + `paging` shapes.

3. **Field-by-field for the covered surface** (REQ-AUDIT-2): each row records
   the status and a doc reference. Cross-check every `(v25.0)`-tagged field in
   `request.ts` / `response.ts` / `webhook/*.ts` and mark it Covered / Partial /
   Wrong / Missing (REQ-AUDIT-4).

4. **Capture the deltas the later phases need.** Make sure the audit explicitly
   records (so Phase 2/3/4 tasks can rely on it):
   - the exact field names/shapes for the media URL/metadata + delete responses,
   - the per-category media MIME types + size limits (image, audio, video,
     document, sticker),
   - the `block_users` request/response field names (added/removed/failed
     entries; list `data` + `paging`),
   - any existing tagged field found **Wrong** that must change shape (flag it
     prominently; it may force a single `feat!:` commit later).

5. **Add a short header** to the doc: what version it covers (v25.0, released
   2026-02-18), how to re-run it when Meta publishes a new version, and a legend
   for the status markers.

## Testing suggestions

- This is a documentation-only task; no Vitest tests. Verify by re-reading the
  doc for completeness against the surface-area checklist above.
- Sanity-check that every message `type` in the `CloudAPIRequest` union
  (`packages/types/src/cloudapi/request.ts`) appears as a row/subsection.

## Gotchas

- **Do not trust `(v25.0)` tags in the code** — they are the very thing under
  audit (REQ-AUDIT-4). Verify against the rendered docs.
- Meta docs are heavily JS-rendered; `WebFetch` alone frequently returns a
  near-empty page. Use Playwright MCP (`browser_navigate` + `browser_snapshot`)
  as the primary path.
- Keep the doc **code-free** — it describes coverage; it does not contain
  implementation. It gates the code; it is not the code.
- This file lives at the repo root under `docs/`, not under `packages/*`.

## Verification checklist

- [ ] `docs/cloud-api-v25-coverage.md` exists and has sections for send types,
      `/messages` behaviors, webhook objects, media (upload/retrieve/download/
      delete), and the Block API.
- [ ] Every `CloudAPIRequest` message `type` has a field-by-field row/subsection
      with a Covered/Partial/Missing/Wrong marker and a doc reference.
- [ ] Every `(v25.0)`-tagged field in `request.ts` / `response.ts` /
      `webhook/*.ts` is re-verified and marked.
- [ ] The doc records the concrete deltas Phase 2/3/4 rely on: media
      URL/metadata + delete response shapes, per-category MIME/size table,
      `block_users` request/response shapes, and any _Wrong_ fields.
- [ ] The doc has a version header + legend and reads as a re-runnable
      checklist.
- [ ] No end-to-end/unit tests apply (documentation-only task).
