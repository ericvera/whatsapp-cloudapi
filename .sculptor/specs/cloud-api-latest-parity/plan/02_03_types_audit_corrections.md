# Task 2.3: Apply audit-driven corrections to request/response/webhook types

## Goal

Reconcile the existing `types` against the audit (`docs/cloud-api-v25-coverage.md`):
fix anything marked **Wrong** or **Partial**, add anything marked **Missing**,
and re-verify every `(v25.0)`-tagged field. The repo's types are already
largely complete, so this task may be small — but it is where REQ-AUDIT-4
("don't trust the tags") turns into concrete corrections.

## Requirements addressed

REQ-TYPES-1, REQ-TYPES-2, REQ-TYPES-3, REQ-HOOK-1, REQ-HOOK-2, REQ-AUDIT-4

## Background

`@whatsapp-cloudapi/types` is the pure-types source of truth (no runtime deps).
The relevant files:

- `packages/types/src/cloudapi/request.ts` — the 17-variant `CloudAPIRequest`
  union and all send-request interfaces. `CloudAPIMessageRequestBase` carries
  `to?`, `recipient?` (BSUID), `biz_opaque_callback_data?`,
  `message_activity_sharing?`; `CloudAPIMessageRequestWithContext` adds
  `context?`.
- `packages/types/src/cloudapi/response.ts` — `CloudAPIResponse`,
  `CloudAPIErrorResponse`, `CloudAPIMediaUploadResponse`, etc. (media URL +
  delete responses were added in Task 2.1).
- `packages/types/src/webhook/` — `payload.ts` (`WebhookChange` union: `messages`,
  `user_id_update`, `business_username_update`, `user_preferences`),
  `message.ts` (`WebhookMessage` union of 13 inbound types), `status.ts`,
  `contact.ts`, `error.ts`.

These files are extensively tagged with `(v25.0)` doc comments that the audit
(Task 1.1) re-verified. This task applies whatever the audit flagged.

Prior tasks in this phase: Task 2.1 added media URL/delete response types to
`response.ts`; Task 2.2 added `cloudapi/block.ts`. Do not duplicate those.

## Files to modify/create

- `packages/types/src/cloudapi/request.ts` — only if the audit flagged a send
  request field as Wrong/Partial/Missing.
- `packages/types/src/cloudapi/response.ts` — only for audit-flagged response
  fields (beyond the media types already added in 2.1).
- `packages/types/src/webhook/*.ts` — only for audit-flagged webhook
  payload/message/status/contact/error fields (REQ-HOOK-1, REQ-HOOK-2),
  including the webhook `field` union in `payload.ts` if the audit found a
  missing messaging-related field.

## Implementation details

1. Open `docs/cloud-api-v25-coverage.md` and collect every row marked **Wrong**,
   **Partial**, or **Missing** for the send-request, response, and webhook
   surfaces.
2. For each, make the minimal additive correction in the corresponding type
   file:
   - **Missing field** → add it (optional unless the docs say required), with a
     doc comment + `Ref:`.
   - **Partial** → add the missing sub-fields.
   - **Wrong** → correct it. If the correction changes an existing field's shape
     in a backward-incompatible way, this is the one place a `feat!:` commit is
     justified (REQ-LEGACY-1) — call it out clearly in the commit message and
     keep the breaking change as narrow as possible.
3. Re-verify the `(v25.0)`-tagged items (REQ-AUDIT-4): if a tag is accurate,
   leave it; if the audit found it inaccurate, fix the field and the comment.
4. Keep all changes type-only.
5. **If the audit flagged nothing** (the existing types fully match v25.0), make
   no changes — this task is then a no-op (see Commit policy).

## Testing suggestions

- Pure type changes need no runtime Vitest test.
- Run `yarn build` (tsc --build) to type-check the monorepo after corrections.
- If a correction touches a shape used by existing client/emulator code, run the
  existing test suite (`yarn test`) to confirm nothing regressed
  (REQ-LEGACY-1).

## Gotchas

- Prefer **additive** changes; only break a shape if the audit proves the
  current one is genuinely Wrong, and isolate that into a clearly-labeled
  `feat!:` change.
- Webhook `field` union lives in `packages/types/src/webhook/payload.ts`
  (`WebhookChange`); only add messaging-related fields the audit found missing —
  non-messaging webhook fields are a Non-Goal.
- Don't re-add media URL/delete responses or `block.ts` — those landed in
  Tasks 2.1/2.2.

## Commit policy

If the audit flagged nothing and you change no files, **do not make an empty
commit** — report that the existing types already match v25.0 and move on.

## Verification checklist

- [ ] Every Wrong/Partial/Missing row in the audit for request/response/webhook
      surfaces has a corresponding type change (or a noted reason it was already
      correct).
- [ ] Any backward-incompatible correction is isolated and flagged for a
      `feat!:` commit.
- [ ] `(v25.0)` tags reflect verified reality.
- [ ] `yarn build` type-checks; `yarn test` stays green (no regressions).
