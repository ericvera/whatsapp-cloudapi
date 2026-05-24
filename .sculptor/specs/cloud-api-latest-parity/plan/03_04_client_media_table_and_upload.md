# Task 3.4: Per-category media table + widen `uploadMedia` to all categories

## Goal

Add a per-category media spec table (`category → { mimeTypes[], maxBytes }`) to
the client constants and widen `uploadMedia` from image-only to **all v25.0
media categories** (image, audio, video, document, sticker) — while staying
backward compatible (previously-accepted images still pass).

## Requirements addressed

REQ-MEDIA-2, REQ-LEGACY-1, REQ-TEST-1

## Background

`@whatsapp-cloudapi/client`'s `packages/client/src/uploadMedia.ts` uploads a
single `file: Blob` to `POST {base}/v25.0/{from}/media` (multipart FormData via
its own `fetch`, not `sendRequest`). Today it validates:

- size against `ImageMaxFileSize` (`5 * 1024 * 1024`), and
- MIME against `ImageSupportedMimeTypes` (`['image/jpeg', 'image/png']`),

both from `packages/client/src/constants.ts`. Its co-located test
`packages/client/src/uploadMedia.test.ts` stubs global `fetch`
(`vi.stubGlobal('fetch', mockFetch)`) and asserts the upload URL/headers/body,
PNG acceptance, oversize rejection, and unsupported-MIME rejection.

The architecture (decision Q2) chose a **per-package duplicated** media table
(client + emulator each define their own; the emulator's copy is Task 4.2). The
table must **widen, never narrow** the accepted set so existing
image-jpeg/image-png uploads keep working (REQ-LEGACY-1).

The audit (`docs/cloud-api-v25-coverage.md`, Task 1.1) records the v25.0
per-category MIME types and size limits — use those values.

## Files to modify/create

- `packages/client/src/constants.ts` — add the per-category media table; keep
  the existing `ImageMaxFileSize` / `ImageSupportedMimeTypes` constants in place
  (other code / tests may reference them).
- `packages/client/src/uploadMedia.ts` — validate against the full table.
- `packages/client/src/uploadMedia.test.ts` — extend with new categories.

## Implementation details

1. In `constants.ts`, add a media spec table keyed by category. Suggested shape:
   a `MediaCategory` union (`'image' | 'audio' | 'video' | 'document' |
'sticker'`) and a `MediaSpecByCategory: Record<MediaCategory, { mimeTypes:
readonly string[]; maxBytes: number }>` populated from the audit's MIME/size
   matrix. Also export a derived `AllSupportedMediaMimeTypes` (flattened list)
   for convenience. Keep `ImageMaxFileSize` and `ImageSupportedMimeTypes`
   exported (do not remove — REQ-LEGACY-1).
2. In `uploadMedia.ts`, replace the image-only checks with table-driven checks:
   - Determine the category from `file.type` (look up which category lists that
     MIME type). If the MIME isn't in any category, throw the existing-style
     `Error(\`Unsupported MIME type: ${file.type}. …\`)` listing all supported
     types.
   - Validate `file.size` against that category's `maxBytes` (not a single
     5 MB constant), throwing the existing-style "File size too large" error
     with the category's limit.
   - Keep the rest (FormData assembly, fetch call, error handling, return type
     `CloudAPIMediaUploadResponse`) unchanged.
   - **Do not change the function signature** — it still takes `{ accessToken,
from, file, baseUrl? }` (REQ-LEGACY-1).
3. Keep the upload going through the dedicated `fetch` (multipart) — it does
   **not** move onto `internal/apiRequest.ts` (that helper is JSON-only).

## Testing suggestions

Extend `uploadMedia.test.ts` (keep all existing tests passing):

- Existing jpeg + png acceptance still pass (regression guard).
- A representative audio, video, document, and sticker MIME type each upload
  successfully (mock `fetch` ok → `{ id }`).
- A MIME type in no category (e.g. `application/x-foo`) is rejected with
  "Unsupported MIME type".
- A file exceeding a category's `maxBytes` is rejected with "File size too
  large" (use a category whose limit differs from image's to prove the table is
  used).
- custom `baseUrl` still honored.

## Gotchas

- `mockReset: true` → re-stub `fetch` per test (the existing test already does
  this pattern).
- **Widen, never narrow:** image/jpeg + image/png must remain accepted at the
  same-or-larger size limit; otherwise an existing consumer breaks (REQ-LEGACY-1).
- The size limit is now **per category** — don't keep using a single
  `ImageMaxFileSize` for non-image categories.
- Use the audit's MIME/size values; if the audit marked a value uncertain,
  prefer the conservative documented limit and note it in a code comment.
- ESM `.js` import extensions.

## Verification checklist

- [ ] `constants.ts` exports a per-category media table (MIME types + size
      limits) and still exports `ImageMaxFileSize` + `ImageSupportedMimeTypes`.
- [ ] `uploadMedia.ts` accepts image, audio, video, document, sticker and
      validates size per category; signature unchanged.
- [ ] image/jpeg + image/png still upload (no regression).
- [ ] `yarn build` type-checks.
- [ ] End-to-end tests: `packages/client/src/uploadMedia.test.ts` covers all
      five categories, the unsupported-MIME and oversize errors, and the
      existing image cases; passes via
      `yarn vitest run packages/client/src/uploadMedia.test.ts`.
