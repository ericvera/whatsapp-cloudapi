# Task 4.2: Emulator media — retain bytes + accept all categories on upload

## Goal

Make the emulator's media upload (1) accept **all v25.0 media categories**
(image, audio, video, document, sticker) instead of image-only, and (2)
**retain the uploaded bytes in memory** plus compute a `sha256`, returning the
documented upload-response fields. This is the foundation for the
download/metadata routes in Task 4.3.

## Requirements addressed

REQ-MEDIA-2, REQ-MEDIA-3, REQ-LEGACY-1, REQ-TEST-1

## Background

`@whatsapp-cloudapi/emulator` handles media in
`packages/emulator/src/routes/MediaRoutes.ts`:

- `mediaStorage: Map<string, MockMediaEntry>`.
- multer `memoryStorage`, `limits.fileSize = 5 * 1024 * 1024`, and a `fileFilter`
  hardcoded to `['image/jpeg', 'image/png']`.
- `handleMediaUpload` validates `messaging_product === 'whatsapp'`, generates
  `media_<nanoid(6)>`, stores a `MockMediaEntry` (metadata only — **bytes are
  discarded**, comment "File is now discarded"), and responds `{ id }`.
- `isMediaValid(id)` is used by `MessageRoutes` for media-id validation.
- `listMedia`, `expireMedia`, `expireAllMedia`, `getMediaStorage` exist.

`MockMediaEntry` (`packages/emulator/src/types/media.ts`) is currently
`{ id, filename, mimeType, size, uploadedAt, expiresAt }` — **no `data`/`sha256`**.

`MediaPersistenceService` (`packages/emulator/src/services/MediaPersistenceService.ts`)
serializes `MockMediaEntry[]` to `media-manifest.json` (`exportMedia`) and reads
it back (`importMedia`).

Emulator constants (`packages/emulator/src/constants.ts`) hold
`SupportedVersion`, `WhatsAppFlowMessageVersion`, `UnsupportedVersionError` —
**no media table yet**.

Architecture decisions for this task:

- **Q2 (media table):** duplicated per-package. Define the
  `category → { mimeTypes[], maxBytes }` table in the **emulator's**
  `constants.ts` (the client copy was Task 3.4). Use the audit's MIME/size
  matrix (`docs/cloud-api-v25-coverage.md`).
- **Q3 (bytes):** retain bytes **in memory only**; the manifest stays
  **metadata-only** — `exportMedia` (and `listMedia`) must strip `data`.

`CloudAPIMediaUploadResponse` (`packages/types/src/cloudapi/response.ts`)
already supports `{ id, file_size?, mime_type?, sha256? }`.

Task 4.1 added the supertest harness pattern and `getServer()`.

## Files to modify/create

- `packages/emulator/src/types/media.ts` — add `data?: Buffer` and
  `sha256?: string` to `MockMediaEntry` (optional → imported entries with no
  bytes stay valid, and the type stays additive).
- `packages/emulator/src/constants.ts` — add the per-category media table
  (MIME types + size limits), mirroring the client table values from Task 3.4.
- `packages/emulator/src/routes/MediaRoutes.ts` — widen multer `fileFilter` +
  size limit to the table; stop discarding bytes (store `req.file.buffer` as
  `data`); compute `sha256` (Node `crypto.createHash('sha256')`); include
  `file_size`/`mime_type`/`sha256` in the upload response.
- `packages/emulator/src/services/MediaPersistenceService.ts` — strip `data`
  from each entry in `exportMedia` (retain `sha256`), so the manifest stays
  metadata-only.
- `packages/emulator/src/routes/MediaRoutes.test.ts` — new test file.

## Implementation details

1. **types/media.ts:** add `data?: Buffer` and `sha256?: string` to
   `MockMediaEntry`. Keep them optional.
2. **constants.ts (emulator):** add a `MediaCategory` union + a
   `MediaSpecByCategory: Record<MediaCategory, { mimeTypes: readonly string[];
maxBytes: number }>` populated from the audit (same values as the client
   table in Task 3.4). Also export a flattened `SupportedMediaMimeTypes` for the
   multer filter.
3. **MediaRoutes.ts:**
   - Replace the hardcoded `['image/jpeg','image/png']` in `fileFilter` with a
     membership check against the table's MIME types.
   - The multer `limits.fileSize` is a single number; set it to the **maximum**
     `maxBytes` across categories so multer doesn't reject large-but-valid
     files, then enforce the **per-category** `maxBytes` in the handler after the
     file is parsed (look up the category by `req.file.mimetype`, compare
     `req.file.size`). Return the existing-style 400 on per-category overflow.
   - In `handleMediaUpload`, after validation: compute
     `sha256 = createHash('sha256').update(req.file.buffer).digest('hex')`,
     and store `data: req.file.buffer` + `sha256` on the `MockMediaEntry`
     (remove the "File is now discarded" behavior/comment).
   - Build the response as `{ id, file_size: req.file.size, mime_type:
req.file.mimetype, sha256 }` (typed `CloudAPIMediaUploadResponse`).
   - Keep `isMediaValid`, expire endpoints, etc. unchanged.
4. **listMedia / getMediaStorage:** `listMedia` returns entries directly; ensure
   it does **not** serialize `data` (a `Buffer` would bloat/garble the JSON).
   Map entries to omit `data` before responding. (`getMediaStorage` is used by
   `exportMedia`; the stripping happens there — see next.)
5. **MediaPersistenceService.exportMedia:** when building `validEntries`, strip
   `data` from each entry (e.g. `const { data: _omit, ...rest } = entry`) so the
   manifest holds metadata only (retain `sha256`). `importMedia` then yields
   entries without `data` — that's expected (download returns 404/410 for them,
   handled in Task 4.3).
6. Use the supertest harness pattern from Task 4.1 for the test.

## Testing suggestions

`packages/emulator/src/routes/MediaRoutes.test.ts` (start emulator on `port: 0`,
`supertest(emulator.getServer()!)`):

- Upload an `image/png` (regression: still accepted) → `200` + response has
  `id`, `file_size`, `mime_type`, `sha256`.
- Upload a representative audio, video, document, sticker MIME each → `200`.
  Use `.attach('file', Buffer.from(...), { filename, contentType })` and
  `.field('messaging_product', 'whatsapp')`.
- Upload an unsupported MIME (e.g. `application/x-foo`) → `400`.
- Upload a file exceeding a category's `maxBytes` → `400`.
- Missing `messaging_product` → `400` (existing behavior preserved).
- Assert `sha256` equals the expected hash of the uploaded bytes (compute with
  `createHash` in the test).

## Gotchas

- **`data` must never reach JSON:** strip it in both `listMedia` and
  `exportMedia`. A `Buffer` JSON-serializes to `{ type:'Buffer', data:[…] }`,
  which bloats the manifest and the debug list — exactly what Q3 forbids.
- multer's `limits.fileSize` is global; enforce per-category limits **after**
  parsing, not via multer alone, or a valid large video would be wrongly
  rejected.
- **Widen, never narrow** (REQ-LEGACY-1): image/jpeg + image/png must remain
  accepted at the same-or-larger limit; the existing upload behavior/tests must
  still pass.
- Use the audit's MIME/size values; keep them identical to the client table
  (Task 3.4) to avoid client/emulator drift.
- `crypto` is a Node builtin (already used in `WebhookService`) — no new
  dependency.
- `mockReset: true` → set up any mocks per test.

## Verification checklist

- [ ] `MockMediaEntry` has optional `data?: Buffer` + `sha256?: string`.
- [ ] Emulator `constants.ts` exports a per-category media table matching the
      client's (Task 3.4) values.
- [ ] Upload accepts image/audio/video/document/sticker; rejects unknown MIME
      and per-category oversize; image/jpeg + image/png still work.
- [ ] Upload retains bytes in memory, computes `sha256`, and returns
      `{ id, file_size, mime_type, sha256 }`.
- [ ] `listMedia` and `exportMedia` strip `data` (manifest/list stay
      metadata-only).
- [ ] `yarn build` + `yarn lint` pass.
- [ ] End-to-end tests:
      `yarn vitest run packages/emulator/src/routes/MediaRoutes.test.ts`
      passes (all categories, errors, sha256 assertion).
