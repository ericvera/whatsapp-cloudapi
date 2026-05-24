# Task 3.5: Client media lifecycle — getMediaUrl, downloadMedia, deleteMedia

## Goal

Add the three client helpers that complete the media lifecycle beyond upload:
**retrieve media URL/metadata** (GET `/{media-id}`), **download the binary**, and
**delete** (DELETE `/{media-id}`). Export them from the client barrel. With
`uploadMedia` (Task 3.4) this gives developers the full media lifecycle
(REQ-MEDIA-1).

## Requirements addressed

REQ-MEDIA-1, REQ-MEDIA-4, REQ-TEST-1

## Background

`@whatsapp-cloudapi/client` helpers call the Cloud API. Plumbing available:

- `packages/client/src/internal/apiRequest.ts` (added in Task 3.1) — a shared
  JSON `GET`/`POST`/`DELETE` helper that prepends
  `{baseUrl}/v25.0/{path}`, sets the `Authorization: Bearer <token>` header, and
  throws `"WhatsApp API Error: …"` on non-ok. Use it for **getMediaUrl** and
  **deleteMedia** (JSON responses).
- `downloadMedia` fetches a **binary** URL directly (non-JSON), so it uses its
  own `fetch` with the auth header (mirror `uploadMedia.ts`'s direct-fetch
  style), returning a `Blob`/`ArrayBuffer`.
- `packages/client/src/constants.ts` — `WhatsAppCloudAPIBaseUrl`,
  `WhatsAppCloudAPIVersion`.

**Types** (added in Task 2.1) live in `packages/types/src/cloudapi/response.ts`:
the media URL/metadata response (`url`, `mime_type`, `sha256`, `file_size`,
`id`, `messaging_product`) and the media delete response (`{ success }`). Import
those (names per Task 2.1, e.g. `CloudAPIMediaURLResponse`,
`CloudAPIMediaDeleteResponse`).

**Real-API shape (confirm via the audit `docs/cloud-api-v25-coverage.md`):**

- GET `/{media-id}` → metadata incl. a short-lived authenticated `url`.
- Download = GET that `url` **with the Bearer token** → binary.
- DELETE `/{media-id}` → `{ success: true }`.

`mockReset: true` is set, so each test reconfigures its mocks.

## Files to modify/create

- `packages/client/src/getMediaUrl.ts` (+ `.test.ts`)
- `packages/client/src/downloadMedia.ts` (+ `.test.ts`)
- `packages/client/src/deleteMedia.ts` (+ `.test.ts`)
- `packages/client/src/index.ts` — export the three (keep alphabetized).

## Implementation details

1. **getMediaUrl.ts** — params `{ accessToken, mediaId, baseUrl? }`. Call
   `apiRequest({ accessToken, method: 'GET', path: mediaId, baseUrl })` and
   return it typed as the media URL/metadata response. (Note: the real Graph
   path is `/{media-id}` with no phone-number-id segment — pass just the id as
   `path`.)
2. **deleteMedia.ts** — params `{ accessToken, mediaId, baseUrl? }`. Call
   `apiRequest({ accessToken, method: 'DELETE', path: mediaId, baseUrl })` and
   return the delete response (`{ success }`).
3. **downloadMedia.ts** — params `{ accessToken, url, baseUrl? }` OR
   `{ accessToken, mediaId, baseUrl? }`. Preferred: accept a `url` (from
   `getMediaUrl`) and `fetch(url, { headers: { Authorization: 'Bearer <token>'
}})`, returning the binary (`Blob` via `response.blob()`, or `ArrayBuffer` —
   pick one and type it). Throw `"WhatsApp Media Download Error: …"` on non-ok
   (mirror `uploadMedia.ts`'s error style). Optionally also support a
   convenience overload that takes `mediaId` and internally calls `getMediaUrl`
   then downloads — only if it stays simple; otherwise keep it `url`-based and
   document that callers chain `getMediaUrl` → `downloadMedia`.
4. Add the three exports to `index.ts`.

## Testing suggestions

- **getMediaUrl.test.ts** — mock `./internal/apiRequest.js`
  (`vi.mock(... () => ({ apiRequest: vi.fn() }))`), assert it's called with
  `method:'GET'`, `path:<mediaId>`, and returns the metadata object. (Mirror the
  `sendTextMessage.test.ts` mock-the-internal style.)
- **deleteMedia.test.ts** — same approach, asserts `method:'DELETE'`,
  `path:<mediaId>`, returns `{ success: true }`.
- **downloadMedia.test.ts** — stub global `fetch` (like `uploadMedia.test.ts`):
  ok response whose `blob()` returns a small fixture; assert the request URL +
  `Authorization` header and that the returned bytes match; non-ok throws.

## Gotchas

- `getMediaUrl`/`deleteMedia` use `apiRequest` (JSON); `downloadMedia` uses a
  direct `fetch` (binary) — don't route binary downloads through the JSON helper
  (it calls `response.json()`).
- The metadata `url` from the real API is host-different (lookaside CDN) and
  requires the Bearer token to download — always send the auth header on
  download.
- `apiRequest` prepends `{baseUrl}/v25.0/` and takes `path` without a leading
  slash — pass `mediaId`, not `/mediaId`.
- `mockReset: true` → set up mocks per test.
- ESM `.js` import extensions; import response types from
  `@whatsapp-cloudapi/types/cloudapi`.
- Keep `uploadMedia.ts` unchanged here (it was handled in Task 3.4).

## Verification checklist

- [ ] `getMediaUrl.ts` returns the media metadata (typed) via `apiRequest` GET.
- [ ] `deleteMedia.ts` returns `{ success }` via `apiRequest` DELETE.
- [ ] `downloadMedia.ts` fetches the binary with the Bearer header and returns
      the bytes; throws on non-ok.
- [ ] All three exported from `packages/client/src/index.ts`.
- [ ] `yarn build` type-checks (response types from Task 2.1 import cleanly).
- [ ] End-to-end tests: `getMediaUrl.test.ts`, `downloadMedia.test.ts`,
      `deleteMedia.test.ts` pass via
      `yarn vitest run packages/client/src/getMediaUrl.test.ts packages/client/src/downloadMedia.test.ts packages/client/src/deleteMedia.test.ts`.
