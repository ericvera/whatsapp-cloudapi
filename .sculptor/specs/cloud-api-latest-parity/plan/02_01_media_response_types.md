# Task 2.1: Add media URL/metadata + delete response types

## Goal

Add the two media response types that v25.0 defines but the repo is missing: the
**retrieve-media-URL / metadata** response (returned by GET `/{media-id}`) and
the **delete-media** response (returned by DELETE `/{media-id}`). These are
consumed by the client media-lifecycle helpers (Phase 3) and the emulator media
routes (Phase 4).

## Requirements addressed

REQ-MEDIA-4, REQ-TYPES-1, REQ-TYPES-3

## Background

This project's `@whatsapp-cloudapi/types` package is the source of truth for the
WhatsApp Cloud API shapes; the client and emulator both depend on it via
`workspace:*`. It is pure types — **no runtime code, no runtime deps**.

Media response types live in `packages/types/src/cloudapi/response.ts`. Today it
defines:

- `CloudAPIMediaUploadResponse` — `{ id: string; file_size?: number;
mime_type?: string; sha256?: string }` (the upload response).
- `CloudAPIResponse`, `CloudAPIErrorResponse`, `CloudAPIMarkReadResponse`,
  and `export type CloudAPIVersion = 'v25.0'`.

It exports everything via `packages/types/src/cloudapi/index.ts`
(`export * from './response.js'`), which is re-exported from
`packages/types/src/index.ts`. **No barrel edit is needed** for new types added
to `response.ts` — they flow through the existing `export *`.

The audit (`docs/cloud-api-v25-coverage.md`, Task 1.1) records the exact field
names for these responses. The expected shapes (confirm against the audit):

- **Retrieve-URL / metadata response** (GET `/{media-id}`):
  `url`, `mime_type`, `sha256`, `file_size`, `id`, `messaging_product`.
  Per Meta, `url` is a short-lived authenticated download URL.
- **Delete response** (DELETE `/{media-id}`): `{ success: boolean }`.

## Files to modify/create

- `packages/types/src/cloudapi/response.ts` — add the two interfaces, matching
  the audit-confirmed field names. Follow the existing doc-comment style (a
  `Ref:` line + per-field comments, exactly like `CloudAPIMediaUploadResponse`).

## Implementation details

1. Read `docs/cloud-api-v25-coverage.md` (from Task 1.1) for the confirmed
   field names/optionality of the media metadata + delete responses. If a field
   is marked uncertain there, prefer the names listed in Background.
2. In `packages/types/src/cloudapi/response.ts`, add a media metadata/URL
   response interface (suggested name `CloudAPIMediaURLResponse` — pick a name
   consistent with `CloudAPIMediaUploadResponse`). Fields per the audit:
   `messaging_product: 'whatsapp'`, `url: string`, `mime_type: string`,
   `sha256: string`, `file_size: number`, `id: string`. Mark a field optional
   only if the audit says Meta omits it.
3. Add a delete response interface (suggested name
   `CloudAPIMediaDeleteResponse`) — `{ success: boolean }`.
4. Add doc comments in the same style as the surrounding interfaces, including a
   `Ref:` to the Meta media reference URL.
5. Do **not** change `CloudAPIMediaUploadResponse` shape (REQ-LEGACY-1) — only
   add new interfaces.

## Testing suggestions

- Pure type additions need no runtime Vitest test (per `.sculptor/testing.md`:
  "pure type changes may not need a runtime test").
- Verification is the type-check: `yarn build` (tsc --build) must pass with the
  new exports.
- Downstream tasks (3.5 client media lifecycle, 4.3 emulator media routes) will
  exercise these types at runtime.

## Gotchas

- Keep `types` runtime-free — add interfaces only, no constants or functions.
- Don't edit `cloudapi/index.ts`; `export * from './response.js'` already
  re-exports anything new in `response.ts`.
- Name the new types consistently with the existing `CloudAPIMedia*` prefix so
  the client/emulator can import them predictably.

## Verification checklist

- [ ] `response.ts` defines a media URL/metadata response interface with
      `url`, `mime_type`, `sha256`, `file_size`, `id`, `messaging_product`
      (optionality per the audit).
- [ ] `response.ts` defines a media delete response interface (`{ success }`).
- [ ] Both carry doc comments + a `Ref:` line matching the file's style.
- [ ] `CloudAPIMediaUploadResponse` is unchanged.
- [ ] `yarn build` type-checks the whole monorepo with the new exports
      importable from `@whatsapp-cloudapi/types/cloudapi`.
