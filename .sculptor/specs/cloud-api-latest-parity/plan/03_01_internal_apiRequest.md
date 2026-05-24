# Task 3.1: Shared `internal/apiRequest.ts` JSON helper (GET/POST/DELETE)

## Goal

Add a small shared client helper for JSON `GET` / `POST` / `DELETE` requests
against an arbitrary Graph-API path. The media metadata/delete helpers (Task
3.5) and the Block API helpers (Task 3.6) need GET/DELETE on non-`/messages`
paths, which the existing `sendRequest` (POST `/messages` only) cannot do. This
centralizes the `Authorization` header and the throw-on-`!ok` error convention.

## Requirements addressed

REQ-MEDIA-1, REQ-BLOCK-1, REQ-LEGACY-1

## Background

This project's `@whatsapp-cloudapi/client` exposes typed helpers that call the
WhatsApp Cloud API. Current HTTP plumbing:

- `packages/client/src/internal/sendRequest.ts` — hardwired to
  `POST {baseUrl|graph}/v25.0/{from}/messages`, maps request type → response
  type, and throws `Error("WhatsApp API Error: …")` on `!response.ok`. It also
  exports `createHeaders(accessToken)` →
  `{ Authorization: 'Bearer <token>', 'Content-Type': 'application/json' }`.
  It has a co-located test `internal/sendRequest.test.ts`.
- `packages/client/src/uploadMedia.ts` — bypasses `sendRequest`, does its own
  `fetch` to `/{from}/media` (multipart).
- `packages/client/src/constants.ts` — `WhatsAppCloudAPIBaseUrl =
'https://graph.facebook.com'`, `WhatsAppCloudAPIVersion = 'v25.0'`.

The architecture (decision Q1) chose a **new shared helper** rather than
generalizing `sendRequest` (which keeps its clean request-type→response-type
mapping) or duplicating `fetch` in ~6 new functions.

`mockReset: true` is set in the root + per-package `vitest.config.mjs`, so every
test must (re)configure its mocks.

## Files to modify/create

- `packages/client/src/internal/apiRequest.ts` — new shared helper.
- `packages/client/src/internal/apiRequest.test.ts` — new co-located test.

## Implementation details

1. Create `internal/apiRequest.ts` exporting an async function that performs a
   JSON request. Recommended signature (params object, matching the codebase's
   style):
   - `accessToken: string`
   - `method: 'GET' | 'POST' | 'DELETE'`
   - `path: string` — the path **after** the version, e.g. `"<media-id>"` or
     `"<phone-number-id>/block_users"` (the helper prepends
     `{baseUrl}/{WhatsAppCloudAPIVersion}/`).
   - `body?: unknown` — JSON-serialized for POST/DELETE when present.
   - `baseUrl?: string` — defaults to `WhatsAppCloudAPIBaseUrl`.
   - Generic return type `<T>` resolved from `response.json()`.
2. Build the URL as
   `` `${baseUrl ?? WhatsAppCloudAPIBaseUrl}/${WhatsAppCloudAPIVersion}/${path}` ``.
3. Reuse the header convention: `Authorization: 'Bearer <token>'`, and
   `'Content-Type': 'application/json'` when a body is sent. You may import
   `createHeaders` from `./sendRequest.js` or inline an equivalent — match the
   existing pattern.
4. On `!response.ok`, read `response.json()` and throw
   `Error(\`WhatsApp API Error: ${JSON.stringify(error)}\`)`— same convention
as`sendRequest`.
5. Return `response.json() as Promise<T>`.
6. Do **not** modify `sendRequest.ts` or `uploadMedia.ts` (REQ-LEGACY-1). This
   is purely additive.
7. This helper is internal — it does **not** need to be exported from
   `packages/client/src/index.ts` (mirror `sendRequest`, which is not exported
   there).

## Testing suggestions

- `internal/apiRequest.test.ts`, modeled on `uploadMedia.test.ts` (which stubs
  global `fetch` via `vi.stubGlobal('fetch', mockFetch)`):
  - GET builds the correct URL (`{base}/v25.0/{path}`) and Authorization header,
    returns parsed JSON.
  - POST sends the JSON body + `Content-Type: application/json`.
  - DELETE works with and without a body.
  - custom `baseUrl` is honored (e.g. `http://localhost:4004`).
  - `!ok` response throws `"WhatsApp API Error"`.

## Gotchas

- Because `mockReset: true`, set up the `fetch` mock inside each test (or a
  `beforeEach`) — a mock configured once at module load will be reset.
- `path` must not start with a leading slash if you template
  `.../${WhatsAppCloudAPIVersion}/${path}` — pass `"<id>"`, not `"/<id>"`.
  Document this in the function's doc comment.
- Keep error handling identical to `sendRequest` so callers see consistent
  error messages.

## Verification checklist

- [ ] `internal/apiRequest.ts` exports a typed GET/POST/DELETE JSON helper that
      prepends `{baseUrl}/v25.0/` and sets the Bearer auth header.
- [ ] Throws `"WhatsApp API Error: …"` on non-ok responses.
- [ ] `sendRequest.ts` and `uploadMedia.ts` are unchanged.
- [ ] End-to-end tests: `packages/client/src/internal/apiRequest.test.ts`
      covers GET/POST/DELETE, custom baseUrl, and the error path; passes via
      `yarn vitest run packages/client/src/internal/apiRequest.test.ts`.
