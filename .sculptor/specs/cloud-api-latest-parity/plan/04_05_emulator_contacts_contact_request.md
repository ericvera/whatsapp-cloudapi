# Task 4.5: Emulator `/messages` — validate + log contacts & contact_request

## Goal

Make the emulator's `/messages` handler properly **validate and log** the
`contacts` message type and the interactive **`contact_request`**
(request_contact_info) type — instead of dropping `contacts` to "unsupported"
and logging `contact_request` as plain text. Accepted messages flow through the
existing success-response + status-webhook path. All other currently-unhandled
types stay exactly as-is.

## Requirements addressed

REQ-EMU-1, REQ-EMU-2, REQ-EMU-3, REQ-EMU-4, REQ-TEST-1

## Background

`@whatsapp-cloudapi/emulator`'s `packages/emulator/src/routes/MessageRoutes.ts`
handles `POST /:version/:phoneNumberId/messages` in `handleSendMessage`:

1. mark-as-read short-circuit;
2. **requires `to`** (400 if missing) — this is a shared check before
   type-specific validation;
3. deep validation for `image` and the four interactive subtypes (cta_url,
   flow, button, list) via the type guards `isCTAURLMessage`, `isFlowMessage`,
   `isButtonsMessage`, `isListMessage`;
4. `logOutgoingMessage(body, normalizedTo, messageId)` switches on `type`:
   - `text`/`image`/`reaction` handled; `interactive` → buttons/list/cta_url
     handled, **else (flow/catalog/call_permission/contact_request) → logged as
     text** (`this.logger.textMessage(body.interactive.body.text, context)`);
   - `template` → logged as text; **`default` → `unsupportedMessage`** (audio,
     video, document, sticker, location, **contacts**);
5. returns `200` `CloudAPIResponse` and fires
   `webhookService.sendMessageStatus(...)` if a webhook is configured (this is
   the shared "accepted" path — REQ-EMU-2 needs nothing new here).

Types (already in `packages/types/src/cloudapi/request.ts`):

- `CloudAPISendContactsMessageRequest` — `type:'contacts'`,
  `contacts: CloudAPIContact[]`; each `CloudAPIContact` requires
  `name: CloudAPIContactName` whose `formatted_name` is required.
- `CloudAPISendRequestContactInfoMessageRequest` — `type:'interactive'`,
  `interactive:{ type:'contact_request', body:{ text },
action:{ name:'request_contact_info' }}`.

Logger (`packages/emulator/src/services/Logger.ts`, `EmulatorLogger`) has
methods like `textMessage`, `imageMessage`, `reactionMessage`,
`interactiveButtonMessage`, `unsupportedMessage`, all following the same shape:
`if (!this.shouldLog('message')) return; this.incrementMessageStats(context);
build lines; this.renderMessage(lines, context)`. **Add two new methods**
(`contactsMessage`, `contactRequestMessage`).

Use the supertest harness pattern from Task 4.1. The status webhook fires
asynchronously, so webhook assertions need `vi.waitFor`.

## Files to modify/create

- `packages/emulator/src/routes/MessageRoutes.ts` — add type guards
  `isContactsMessage` + `isContactRequestMessage`; add a `contacts` validation
  branch and a `contact_request` validation branch; add `logOutgoingMessage`
  cases that call the two new Logger methods.
- `packages/emulator/src/services/Logger.ts` — add `contactsMessage(...)` and
  `contactRequestMessage(...)` methods.
- `packages/emulator/src/routes/MessageRoutes.test.ts` — extend with
  contacts + contact_request tests (this file was created in Task 4.1).

## Implementation details

1. **Type guards** in `MessageRoutes`:
   - `isContactsMessage(body): body is CloudAPISendContactsMessageRequest` →
     `body.type === 'contacts'`.
   - `isContactRequestMessage(body): body is
CloudAPISendRequestContactInfoMessageRequest` →
     `body.type === 'interactive' && 'interactive' in body &&
body.interactive.type === 'contact_request'` (mirror the existing
     `isFlowMessage` guard).
2. **Validation** in `handleSendMessage`:
   - **contacts:** after the existing `image` block (add a sibling
     `if (this.isContactsMessage(body))` or `if (body.type === 'contacts')`):
     reject (400, existing error style) if the `contacts` array is empty, or if
     any contact is missing `name.formatted_name`. Keep it focused on documented
     constraints; don't over-validate.
   - **contact_request:** inside the existing `if (body.type === 'interactive')`
     block, add an `else if (this.isContactRequestMessage(body))` branch:
     validate `interactive.body.text` is present and ≤ 1024 chars, and
     `interactive.action.name === 'request_contact_info'`. Reject with the
     existing 400 error style otherwise.
3. **Logging** in `logOutgoingMessage`:
   - Add `case 'contacts':` → call `this.logger.contactsMessage(body.contacts,
context)` (this removes `contacts` from the `default`/unsupported path).
   - In the `interactive` else-chain, add
     `else if (this.isContactRequestMessage(body)) {
this.logger.contactRequestMessage(body.interactive.body.text, context) }`
     **before** the final `else` (so contact_request no longer logs as text).
     Leave the final `else` (flow/catalog/call_permission) untouched.
4. **Logger methods** (mirror `reactionMessage` / `textMessage` structure):
   - `contactsMessage(contacts: CloudAPIContact[], context)` — render a brief
     summary (e.g. count + each contact's `name.formatted_name`).
   - `contactRequestMessage(bodyText: string, context)` — render the body text
     with a "contact info requested" affordance.
   - Both: early-return on `!this.shouldLog('message')`, call
     `incrementMessageStats(context)`, build `lines` via `addHeaderLine` +
     `wrapText`, end with `this.renderMessage(lines, context)`.
5. **Leave the other eight unhandled types as-is** (REQ-EMU-3): audio, video,
   document, sticker, location stay on the `default`/`unsupportedMessage` path;
   flow/catalog/call_permission stay on the interactive final-`else` text path.
   `cli` is untouched (REQ-EMU-4).

## Testing suggestions

Extend `packages/emulator/src/routes/MessageRoutes.test.ts`:

- **contacts accepted:** POST a valid `contacts` message (with `to` set) → `200`
  - standard response shape. With a webhook configured + global `fetch` stubbed,
    `vi.waitFor` that the status webhook fired (REQ-EMU-2).
- **contacts rejected:** empty `contacts` array → `400`; a contact missing
  `name.formatted_name` → `400`.
- **contact_request accepted:** POST a valid `contact_request` interactive
  message (with `to` set) → `200` + status webhook fired.
- **contact_request rejected:** missing `body.text` or wrong `action.name`
  → `400`; body text > 1024 chars → `400`.
- **regression:** an `audio` (or other still-unsupported) type still returns
  `200` (unchanged behavior — REQ-EMU-3); a `text` message still works.

## Gotchas

- The shared **`to` is required** check runs before type validation. Send
  `contacts`/`contact_request` test payloads **with `to` set**. Recipient-only
  (BSUID) addressing in the emulator is **out of scope** for this spec — do not
  relax the global `to` check (that would change acceptance for every type).
  Note this as a documented emulator limitation.
- Adding `case 'contacts'` to `logOutgoingMessage` removes it from the
  `default` (unsupported) path — that's the intended behavior change. The other
  default-path types must remain untouched.
- Put the `contact_request` branch **before** the final `else` in the
  interactive logging chain, or it will still log as text.
- Webhook delivery is asynchronous (`void this.webhookService...`) — assert with
  `vi.waitFor`, and stub global `fetch` (supertest doesn't use `fetch`).
- `mockReset: true` → per-test mock setup.
- Keep all changes additive (REQ-LEGACY-1); existing handled types unchanged.

## Verification checklist

- [ ] `MessageRoutes` has `isContactsMessage` + `isContactRequestMessage` guards.
- [ ] `contacts` and `contact_request` have validation branches (reject bad
      payloads with 400) and are logged via the two new Logger methods.
- [ ] `Logger` has `contactsMessage` + `contactRequestMessage` following the
      existing message-rendering pattern.
- [ ] Accepted contacts/contact_request return `200` and fire the status webhook
      (REQ-EMU-2).
- [ ] Audio/video/document/sticker/location and flow/catalog/call_permission are
      unchanged (still return 200; REQ-EMU-3); `cli` untouched (REQ-EMU-4).
- [ ] `yarn build` + `yarn lint` pass.
- [ ] End-to-end tests:
      `yarn vitest run packages/emulator/src/routes/MessageRoutes.test.ts`
      passes (contacts + contact_request accept/reject, webhook fired,
      regression for still-unsupported types).
