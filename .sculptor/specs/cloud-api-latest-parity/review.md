# Cloud API Latest-Version Parity — Review

## Summary

- **The implementation meets the spec.** Every `REQ-*` is covered: the audit
  doc, corrected/added types, all 10 missing send helpers, the full media
  lifecycle (client + emulator), the Block API (types + client + emulator), and
  proper `contacts`/`contact_request` handling. `yarn smoke` (build + lint +
  test) is green — **214 tests across 30 files pass**, with 20 new co-located
  test files.
- **One clear pre-merge cleanup:** the checked-in audit deliverable
  `docs/cloud-api-v25-coverage.md` ended with stray tool-call artifact tags
  `</content>` / `</invoke>` (lines 329–330). Low effort, but it's a published
  deliverable. _(Resolved — Finding #1, `11684e0`.)_
- **One acknowledged limitation, now closed:** the emulator previously
  rejected any `/messages` send missing `to` (`MessageRoutes.ts:210`), so the
  BSUID `recipient`-only addressing that the new client helpers and the
  `contact_request` type explicitly support could not be exercised against the
  emulator. Per the user's decision this was relaxed to accept `to` **or**
  `recipient`, with a BSUID `contact_request` test added. _(Resolved — Finding
  #2, `11b3513`.)_
- **Nothing blocks merge.** The breaking change (response `wa_id`
  required→optional, `CloudAPIVersion` v24→v25) is correctly shipped as a
  `feat!:` commit (`e391ffd`), satisfying REQ-LEGACY-1.

## Requirements Coverage

| Requirement  | Status             | Evidence                                                                                                                                                               |
| ------------ | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-AUDIT-1  | Covered            | `docs/cloud-api-v25-coverage.md` — surface-by-surface Covered/Partial/Missing/Wrong with Meta refs                                                                     |
| REQ-AUDIT-2  | Covered            | Field-by-field tables (§1.1, §1.2, §3, §4, §5.4)                                                                                                                       |
| REQ-AUDIT-3  | Covered            | "How to re-run when Meta ships a new version" + legend; structured as a living checklist                                                                               |
| REQ-AUDIT-4  | Covered            | Legend distinguishes 🔬 Verified vs 📄 Code-only; tagged items re-checked; §7 "Fields flagged ⚠ Wrong"                                                                 |
| REQ-TYPES-1  | Covered            | `cloudapi/response.ts` (media URL/metadata + delete types), `cloudapi/block.ts`, `request.ts`                                                                          |
| REQ-TYPES-2  | Covered            | `CloudAPIRequest` union adds `CloudAPISendRequestContactInfoMessageRequest` (`request.ts:1522`); webhook unions extended                                               |
| REQ-TYPES-3  | Covered            | New types carry doc comments + Meta refs (e.g. `block.ts:1`, `response.ts` media types)                                                                                |
| REQ-SEND-1   | Covered            | All 10 helpers present and exported (`client/src/index.ts`)                                                                                                            |
| REQ-SEND-2   | Covered            | Each `send<Type>Message.ts` mirrors conventions; co-located `*.test.ts` for each                                                                                       |
| REQ-SEND-3   | Covered            | Helpers accept `to`/`recipient` (+ `context`/`bizOpaqueCallbackData` where applicable) — e.g. `sendReactionMessage.ts:54-69`, `sendRequestContactInfoMessage.ts:53-76` |
| REQ-HOOK-1   | Covered (see note) | Large additions in `webhook/{message,payload,status,contact,error}.ts`; audit §3 marks present. Verified by presence + audit, not exhaustively re-rendered             |
| REQ-HOOK-2   | Covered            | `WebhookChange` union carries `messages` + BSUID change fields (audit §3)                                                                                              |
| REQ-MEDIA-1  | Covered            | `getMediaUrl.ts`, `downloadMedia.ts`, `deleteMedia.ts`, widened `uploadMedia.ts`                                                                                       |
| REQ-MEDIA-2  | Covered            | `MediaSpecByCategory` (client `constants.ts`; emulator `constants.ts`) matches audit §4.5                                                                              |
| REQ-MEDIA-3  | Covered            | `MediaRoutes` retains `data`/`sha256` (`MediaRoutes.ts:255-270`), GET metadata/download, DELETE                                                                        |
| REQ-MEDIA-4  | Covered            | `CloudAPIMediaURLResponse` + `CloudAPIMediaDeleteResponse` (`response.ts`)                                                                                             |
| REQ-BLOCK-1  | Covered            | `blockUsers.ts`, `unblockUsers.ts`, `listBlockedUsers.ts`                                                                                                              |
| REQ-BLOCK-2  | Covered            | `cloudapi/block.ts` — request/added/removed/failed entries + list `data`/`paging`                                                                                      |
| REQ-BLOCK-3  | Covered            | Co-located tests with mocked network layer (`blockUsers.test.ts`, etc.)                                                                                                |
| REQ-BLOCK-4  | Covered (see note) | `routes/BlockRoutes.ts` POST/DELETE/GET, wired in `WhatsAppEmulator.ts:406-426`                                                                                        |
| REQ-EMU-1    | Covered            | `MessageRoutes.ts` — `isContactsMessage`/`isContactRequestMessage` guards + validation branches                                                                        |
| REQ-EMU-2    | Covered            | Accepted contacts/contact_request fall through to the existing success + status-webhook path                                                                           |
| REQ-EMU-3    | Covered            | Other 8 types left as-is (still 200 / logged)                                                                                                                          |
| REQ-EMU-4    | Covered            | No changes under `packages/cli`; smoke build passes                                                                                                                    |
| REQ-LEGACY-1 | Covered            | Sole break (`wa_id` required→optional, `CloudAPIVersion` v24→v25) shipped as `feat!:` `e391ffd`                                                                        |
| REQ-TEST-1   | Covered            | 20 new co-located `*.test.ts`; 214 tests pass                                                                                                                          |

## User Scenarios

- **A — Read the audit:** Delivered. `docs/cloud-api-v25-coverage.md` is a
  thorough, per-surface, field-by-field checklist with Meta-doc references and a
  re-run procedure. _Caveat:_ it ends with two stray artifact tags (see
  Findings #1).
- **B — Send any message type:** Delivered. All 17 `/messages` variants now have
  a typed helper; the 10 new ones are exported and unit-tested with no `any`.
- **C — Narrow a webhook:** Delivered. The webhook unions/objects carry the
  documented v25.0 fields (audit §3). Type-level only; correctness was verified
  against the audit (📄 code-only) rather than re-rendered docs this pass.
- **D — Manage media:** Delivered and exercised end-to-end. The emulator media
  tests assert the upload→getUrl→download byte/sha256 round-trip and DELETE
  (`MediaRoutes.test.ts`).
- **E — Block users:** Delivered. Client + emulator block/unblock/list with
  state-transition tests (`BlockRoutes.test.ts`, `blockUsers.test.ts`, …).
- **F — Emulator handles contacts/contact_request:** Delivered for both
  `to`-addressed and BSUID `recipient`-only sends; validation + logging + status
  webhook all run. The require-`to` check was relaxed to accept `to` **or**
  `recipient` and the BSUID `contact_request` path is now tested (Findings #2,
  resolved in `11b3513`).
- **G — Existing integrations keep working:** Delivered. Full suite green; the
  single intentional break is `feat!:`-tagged.

## Test Coverage

- **Tests added (20 new files):** client — `sendAudioMessage`, `sendVideoMessage`,
  `sendDocumentMessage`, `sendStickerMessage`, `sendLocationMessage`,
  `sendContactsMessage`, `sendReactionMessage`, `sendCatalogMessage`,
  `sendCallPermissionRequestMessage`, `sendRequestContactInfoMessage`,
  `getMediaUrl`, `deleteMedia`, `uploadMedia`, `internal/apiRequest`,
  `blockUsers`, `unblockUsers`, `listBlockedUsers`; emulator —
  `MediaRoutes.test.ts`, `BlockRoutes.test.ts`, `MessageRoutes.test.ts`
  (supertest harness). (`downloadMedia` is covered via the emulator round-trip
  test rather than a dedicated client test.)
- **Test suite status:** PASS — `yarn smoke` (build + lint + `vitest run`) exits
  0; **214 tests / 30 files passed**.
- **Integration tests run:** Emulator route tests via supertest (media, block,
  message routes) — all green. No browser/e2e tests exist for this repo by
  design (`.sculptor/testing.md`).
- **Skipped / `xfail` / pending:** None found (`.skip`/`.only`/`.todo`/`xfail`
  grep clean).

## Code Review Findings

No code-review skill is configured in `.sculptor/docs.md` (the _Code Review_
`Skill:` field is empty), so the dedicated code-review pass was skipped.
Consider authoring a repo review skill and configuring it. The review observations
below come from this skill's own diff walk:

### 1. [Low] Stray tool-call artifact in the audit deliverable

`docs/cloud-api-v25-coverage.md:329-330` ends with literal `</content>` and
`</invoke>` tags — leftover from the agent that authored it. Harmless to
tooling but it's a checked-in, human-facing deliverable. **Fix:** delete the
two trailing lines.

**Resolved** in `11684e0` — deleted the two trailing artifact lines; the file
now ends cleanly after the References table.

### 2. [Medium] Emulator rejects BSUID `recipient`-only sends

`MessageRoutes.handleSendMessage` returns 400 ("Recipient phone number is
required") whenever `to` is absent (`MessageRoutes.ts:210`), _before_ any
type-specific handling. The new client helpers (REQ-SEND-3) and the
`contact_request` type both document `recipient` (BSUID) as a valid — and for
`contact_request`, the _typical_ — addressing mode. Net effect: a developer can
build a `recipient`-only message with the client but the emulator will reject
it, and the `contact_request` emulator tests only ever use `to`
(`MessageRoutes.test.ts:108-171`). This is **explicitly acknowledged** in the
audit (§2, §7) and the spec frames the require-`to` as a pre-existing narrowing
kept additive, so it is _not_ a spec violation — but it's a real client/emulator
asymmetry and leaves User Scenario F's BSUID path unexercised. Worth a
deliberate decision: accept as documented limitation, or relax the emulator to
accept `to` **or** `recipient`.

**Resolved** in `11b3513` — per user decision, relaxed the check to require at
least one of `to`/`recipient` (`to` takes precedence when both are present, per
the request-type docs) and threaded the resolved recipient through logging, the
response contacts, and the status webhook. Added emulator tests for a BSUID
`recipient`-only `contact_request` and for a send missing both fields, closing
the asymmetry and exercising User Scenario F's BSUID path.

### 3. [Low] Emulator media-upload response over-reports vs. the real API

`MediaRoutes.handleMediaUpload` returns `file_size`/`mime_type`/`sha256` in the
upload response (`MediaRoutes.ts:279-284`). The audit (§4.1) verified the real
upload endpoint returns **`{ id }` only** — those fields belong to the GET
media-URL/metadata response (§4.2). The type makes them optional so this is
non-breaking, but it slightly reduces emulator fidelity (the whole point being
parity). Optional: return `{ id }` only on upload.

**Resolved** in `68b66f4` — upload now returns `{ id }` only. The upload test
asserts the metadata fields are absent, and the round-trip test derives the
expected `sha256` from the uploaded bytes (the GET metadata response still
returns `file_size`/`mime_type`/`sha256`).

### 4. [Low] Block API logging reuses `mediaOperation`

`BlockRoutes` logs block/unblock through `this.logger.mediaOperation('block' |
'unblock', …)` (`BlockRoutes.ts:61,88`), a semantically media-scoped logger.
Functionally fine; consider a dedicated logger method for clarity.

**Resolved** in `18d6d44` — added a `'block'` log category and a
`blockOperation` method on `Logger`, and routed both handlers through it.

### 5. [Low] Emulator Block API never returns the partial-failure shape

`failed_users` and the top-level `error` object (typed in `block.ts`, audit
§5.1/5.2) are never produced — the emulator always returns full success. Fine
for a dev convenience, but the partial-failure branch of the response types is
unexercised by any test.

**Won't fix** — acceptable for a dev emulator (the review itself notes it is
"Fine for a dev convenience"). The emulator has no notion of which users would
actually fail to block, so synthesizing a partial-failure response would be
arbitrary. The partial-failure shape remains available in the types for real
API consumers.

## Overall Assessment

**Ready to merge.** The change set is large but disciplined: audit-driven,
additive, well-tested, and faithful to the spec's depth ordering
(types → client → emulator). The full verification suite passes and the one
intentional breaking change is correctly `feat!:`-tagged.

Recommended before merge: delete the two stray artifact lines from the audit doc
(Finding #1) — it's the only finding touching a published deliverable. The
biggest _product_ risk is the client/emulator BSUID asymmetry (Finding #2):
it's documented and out of scope per the spec, but if BSUID-addressed
`contact_request` is a real use case, the emulator can't help developers test
it today. Findings #3–#5 are polish.
