# Task 3.3: Send helpers — reaction, catalog, call_permission_request, request_contact_info

## Goal

Add the remaining four typed client send helpers (with co-located tests):
`reaction`, `catalog_message`, `call_permission_request`, and
`request_contact_info`. Export them from the client barrel. These complete
REQ-SEND-1 (a helper for every v25.0 `/messages` type).

## Requirements addressed

REQ-SEND-1, REQ-SEND-2, REQ-SEND-3, REQ-TEST-1

## Background

`@whatsapp-cloudapi/client` exposes one `send<Type>Message.ts` per message type,
each building a typed request and calling
`sendRequest(accessToken, from, message, baseUrl)`
(`packages/client/src/internal/sendRequest.ts`); the barrel
`packages/client/src/index.ts` re-exports each. Task 3.2 added six helpers
(audio/video/document/sticker/location/contacts); this task adds the final four.

**The types already exist** in `packages/types/src/cloudapi/request.ts`:

- `CloudAPISendReactionMessageRequest` — `type:'reaction'`,
  `reaction:{ message_id: string; emoji: string }` (empty `emoji` removes the
  reaction). Extends `CloudAPIMessageRequestBase` (no `context`).
- `CloudAPISendCatalogMessageRequest` — `type:'interactive'`,
  `interactive:{ type:'catalog_message', body:{text}, footer?:{text},
action:{ name:'catalog_message', parameters:{ thumbnail_product_retailer_id }}}`.
  Extends `…WithContext`.
- `CloudAPISendCallPermissionRequestMessageRequest` — `type:'interactive'`,
  `interactive:{ type:'call_permission_request', body:{text},
action:{ name:'call_permission_request' }}`. Extends `…WithContext`.
- `CloudAPISendRequestContactInfoMessageRequest` — `type:'interactive'`,
  `interactive:{ type:'contact_request', body:{text},
action:{ name:'request_contact_info' }}`. Extends `CloudAPIMessageRequestBase`.

**Addressing (REQ-SEND-3, architecture decision Q4):** every NEW helper accepts
**optional `to` and/or optional `recipient`** (≥1 required). This matters most
here: `reaction` and `request_contact_info` are commonly addressed to a
business-scoped user ID (`recipient`). `CloudAPIMessageRequestBase` already has
both `to?` and `recipient?`. catalog + call_permission_request additionally
support `context` (they extend `…WithContext`).

**Reference pattern:** `packages/client/src/sendCTAURLMessage.ts` (builds an
`interactive` body with `body`/`footer`/`action`, validates text lengths against
`InteractiveBodyMaxLength` / `InteractiveFooterMaxLength` from
`packages/client/src/constants.ts`). **Reference test:**
`packages/client/src/sendTextMessage.test.ts` (mocks `./internal/sendRequest.js`,
asserts the exact 4-arg call; `mockReset: true` so configure per-test).

## Files to modify/create

- `packages/client/src/sendReactionMessage.ts` (+ `.test.ts`)
- `packages/client/src/sendCatalogMessage.ts` (+ `.test.ts`)
- `packages/client/src/sendCallPermissionRequestMessage.ts` (+ `.test.ts`)
- `packages/client/src/sendRequestContactInfoMessage.ts` (+ `.test.ts`)
- `packages/client/src/index.ts` — add an `export *` line for each (keep
  alphabetized).

## Implementation details

For each helper, follow `sendCTAURLMessage.ts` / `sendImageMessage.ts`:

1. **sendReactionMessage** — params `{ accessToken, from, to?, recipient?,
messageId, emoji, bizOpaqueCallbackData?, baseUrl? }`. Require ≥1 of
   `to`/`recipient`. Build `CloudAPISendReactionMessageRequest` with
   `type:'reaction'`, `reaction:{ message_id: messageId, emoji }`. Allow an
   empty-string `emoji` (it means "remove reaction" — do not reject it).
2. **sendCatalogMessage** — params `{ accessToken, from, to?, recipient?,
bodyText, thumbnailProductRetailerId, footerText?, context?, 
bizOpaqueCallbackData?, baseUrl? }`. Validate `bodyText` ≤
   `InteractiveBodyMaxLength`, `footerText` ≤ `InteractiveFooterMaxLength`.
   Build the `interactive` object with
   `action.parameters.thumbnail_product_retailer_id`.
3. **sendCallPermissionRequestMessage** — params `{ accessToken, from, to?,
recipient?, bodyText, context?, bizOpaqueCallbackData?, baseUrl? }`.
   Validate `bodyText` length. Build `interactive:{ type:
'call_permission_request', body:{text}, action:{ name:
'call_permission_request' }}`.
4. **sendRequestContactInfoMessage** — params `{ accessToken, from, to?,
recipient?, bodyText, bizOpaqueCallbackData?, baseUrl? }`. Validate
   `bodyText` length. Build `interactive:{ type:'contact_request', body:{text},
action:{ name:'request_contact_info' }}`.
5. Common request assembly (mirror Task 3.2 / existing helpers): set
   `messaging_product:'whatsapp'`; include `recipient_type:'individual'` when
   `to` is used; conditionally add `to`, `recipient`, `context` (→
   `{ message_id }`, only for catalog + call_permission_request),
   `biz_opaque_callback_data`. `return sendRequest(accessToken, from, message,
baseUrl)`.
6. Add the four `export *` lines to `index.ts`.

## Testing suggestions

Model each `*.test.ts` on `sendTextMessage.test.ts`:

- **reaction:** `to` path asserts `reaction:{message_id,emoji}`; `recipient`-only
  path; empty-`emoji` removal path (must NOT throw); custom baseUrl.
- **catalog:** asserts `interactive.action.parameters.thumbnail_product_retailer_id`,
  footer handling, body-length validation throws, `recipient` path, `context`
  maps to `context.message_id`.
- **call_permission_request:** asserts the interactive `type`/`action.name`,
  body-length validation, `recipient` path, `context` mapping.
- **request_contact_info:** asserts the interactive `type:'contact_request'` +
  `action.name:'request_contact_info'`, `recipient` path (the common case), body
  validation.
- each: missing both `to` and `recipient` throws.

## Gotchas

- `mockReset: true` → configure `mockSendRequest.mockResolvedValueOnce(...)` in
  each test.
- ESM `.js` import extensions everywhere.
- **Reaction removal:** `emoji: ''` is valid (removes the reaction). Do not add a
  "non-empty emoji" validation.
- `request_contact_info` and `reaction` extend `CloudAPIMessageRequestBase`
  (no `context`) — do NOT add a `context` param to those two; catalog +
  call_permission_request extend `…WithContext` and DO support `context`.
- The interactive `action.name` strings must match the type exactly
  (`'catalog_message'`, `'call_permission_request'`, `'request_contact_info'`).
- Keep existing helpers untouched (REQ-LEGACY-1).

## Verification checklist

- [ ] `sendReactionMessage`, `sendCatalogMessage`,
      `sendCallPermissionRequestMessage`, `sendRequestContactInfoMessage` exist,
      each calling `sendRequest`.
- [ ] Each accepts `to` and/or `recipient` (≥1 required); catalog +
      call_permission_request also accept `context`.
- [ ] Reaction allows empty-string emoji (removal).
- [ ] All four exported from `packages/client/src/index.ts`.
- [ ] `yarn build` type-checks (types from `@whatsapp-cloudapi/types/cloudapi`,
      no `any`).
- [ ] End-to-end tests: `sendReactionMessage.test.ts`,
      `sendCatalogMessage.test.ts`,
      `sendCallPermissionRequestMessage.test.ts`,
      `sendRequestContactInfoMessage.test.ts` cover the `to` + `recipient`
      paths, optional fields, and validation; all pass via
      `yarn vitest run packages/client/src/send*Message.test.ts`.
