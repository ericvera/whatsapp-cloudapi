# Task 4.3: Emulator media — GET metadata, GET download, DELETE routes

## Goal

Add the emulator's media lifecycle endpoints to complete REQ-MEDIA: **GET
metadata** at the Graph-style path `GET /:version/:mediaId`, a **GET download**
sub-route that streams the retained bytes, and **DELETE** `/:version/:mediaId`.
Wire them in `WhatsAppEmulator.setupRoutes()` with correct route ordering.

## Requirements addressed

REQ-MEDIA-1, REQ-MEDIA-3, REQ-MEDIA-4, REQ-TEST-1

## Background

After Task 4.2, the emulator's `MediaRoutes`
(`packages/emulator/src/routes/MediaRoutes.ts`) stores uploaded bytes in memory:
`MockMediaEntry` (`packages/emulator/src/types/media.ts`) now has
`data?: Buffer` and `sha256?: string`, and uploads populate them. Imported
entries (from a manifest) have **no** `data`.

`MediaRoutes` already has `mediaStorage: Map<string, MockMediaEntry>`,
`isMediaValid(id)`, and `generateMediaId()`. It does **not** yet have
metadata/download/delete handlers.

Routes are registered in `WhatsAppEmulator.setupRoutes()`
(`packages/emulator/src/emulator/WhatsAppEmulator.ts`). Existing registrations,
**in order**:

- `POST /:version/:phoneNumberId/messages` (validateVersion, validatePhoneNumberId)
- `POST /:version/:phoneNumberId/media` (validateVersion, validatePhoneNumberId)
- `GET /debug/media/list`
- `POST /debug/media/expire/all`, `POST /debug/media/expire/:id`
- `GET /debug/health` ← **2-segment GET**
- `POST /debug/messages/send-text`, `POST /debug/messages/send-interactive`
- `GET /webhook`

`validateVersion` middleware checks `req.params['version'] === 'v25.0'` and 400s
otherwise. `validatePhoneNumberId` is **not** applicable to media GET/DELETE
(those paths have no phone-number-id segment) — use only `validateVersion`.

The response types were added in Task 2.1
(`packages/types/src/cloudapi/response.ts`): the media URL/metadata response
(`url`, `mime_type`, `sha256`, `file_size`, `id`, `messaging_product`) and the
delete response (`{ success }`). Import them by their Task 2.1 names.

Use the supertest harness pattern from Task 4.1.

## Files to modify/create

- `packages/emulator/src/routes/MediaRoutes.ts` — add three handlers:
  `getMediaMetadata`, `downloadMedia`, `deleteMedia`.
- `packages/emulator/src/emulator/WhatsAppEmulator.ts` — register the three
  routes in `setupRoutes()`, **after** all `/debug` + `/webhook` routes.
- `packages/emulator/src/routes/MediaRoutes.test.ts` — extend with
  metadata/download/delete + the upload→getUrl→download round-trip.

## Implementation details

1. **getMediaMetadata(req, res):** look up `req.params['mediaId']` in
   `mediaStorage` (use `isMediaValid` / direct get; 404 if missing/expired).
   Build the response typed as the media URL/metadata type:
   - `messaging_product: 'whatsapp'`, `id`, `mime_type: entry.mimeType`,
     `sha256: entry.sha256 ?? ''`, `file_size: entry.size`, and
   - `url` pointing back at the emulator's own download sub-route, built from the
     request, e.g.
     `` `${req.protocol}://${req.get('host')}/${req.params['version']}/${mediaId}/download` ``.
2. **downloadMedia(req, res):** look up the entry; if missing/expired → 404; if
   the entry has **no `data`** (e.g. imported from a manifest) → 404 (or 410
   Gone) with a clear message. Otherwise set `Content-Type` to `entry.mimeType`
   and send the `Buffer` (`res.status(200).send(entry.data)`).
3. **deleteMedia(req, res):** delete the entry from `mediaStorage` (404 if it
   wasn't there, or return `{ success: true }` idempotently — match the audit's
   documented behavior; default to `{ success: true }` when present). Respond
   with the typed delete response.
4. **Wiring in `setupRoutes()`** — register **after** `GET /webhook` so the
   2-segment `GET /:version/:mediaId` does not shadow `GET /debug/health`:
   - `GET /:version/:mediaId/download` (validateVersion) — register the
     3-segment download route **before** the 2-segment metadata route.
   - `GET /:version/:mediaId` (validateVersion) — metadata.
   - `DELETE /:version/:mediaId` (validateVersion) — delete.
     Bind handlers like the existing media routes
     (`this.mediaRoutes.getMediaMetadata.bind(this.mediaRoutes)`), guarded by the
     same null-check block at the top of `setupRoutes`.
5. The download `url` returned by metadata must be fetchable by the **client**
   `downloadMedia` helper (Task 3.5), which sends the Bearer header — the
   emulator does not need to strictly validate the token, but should accept the
   request regardless of header.

## Testing suggestions

Extend `packages/emulator/src/routes/MediaRoutes.test.ts`:

- **Round-trip:** upload bytes (multipart) → `GET /:version/:mediaId` returns
  metadata whose `sha256`/`file_size`/`mime_type` match the upload → `GET` the
  metadata `url` (the `/download` sub-route) returns the **exact bytes**
  (assert the body equals the uploaded buffer and its sha256 matches).
- `GET /:version/:mediaId` for an unknown id → `404`.
- `GET .../download` for an entry imported without bytes → `404`/`410`. (Simulate
  by inserting a metadata-only entry, or by documenting this case if hard to set
  up via the public API.)
- `DELETE /:version/:mediaId` → `{ success: true }`, and a subsequent
  `GET`/download for that id → `404`.
- **Route disambiguation:** `GET /debug/health` still returns `200`
  `{ status:'ok' }` (proves the 2-segment media route didn't shadow it), and
  `GET /debug/media/list` still works.
- Bad version segment on a media GET (e.g. `/v1.0/<id>`) → `400`.

## Gotchas

- **Route order is load-bearing:** register the media GET/DELETE routes AFTER
  the `/debug/*` and `/webhook` routes, and register the 3-segment `/download`
  route before the 2-segment metadata route. Getting this wrong shadows
  `/debug/health` (caught by `GET /:version/:mediaId` with `version='debug'` → 400) — the route-disambiguation test guards this.
- Media GET/DELETE use **only** `validateVersion` (no `validatePhoneNumberId` —
  those paths have no phone-number-id).
- Build the absolute download `url` from the request (`req.protocol` +
  `req.get('host')`), not a hardcoded host, so it works on any port.
- Sending a `Buffer` with `res.send(buffer)` sets the body correctly; set
  `Content-Type` explicitly to the stored `mimeType` first.
- Imported-but-byteless entries are an expected state (Q3) — return 404/410, not
  a 500.
- `mockReset: true` → per-test mock setup.

## Verification checklist

- [ ] `MediaRoutes` has `getMediaMetadata`, `downloadMedia`, `deleteMedia`.
- [ ] `setupRoutes()` registers `GET /:version/:mediaId/download`,
      `GET /:version/:mediaId`, `DELETE /:version/:mediaId` (validateVersion
      only), after `/debug` + `/webhook`, download before metadata.
- [ ] Metadata returns `{ url, mime_type, sha256, file_size, id,
    messaging_product }` with `url` pointing at the emulator's download route.
- [ ] Upload→getMetadata→download returns the exact bytes (sha256 round-trips).
- [ ] DELETE removes the entry; byteless entries download as 404/410.
- [ ] `GET /debug/health` and `GET /debug/media/list` still work
      (no route shadowing).
- [ ] `yarn build` + `yarn lint` pass.
- [ ] End-to-end tests:
      `yarn vitest run packages/emulator/src/routes/MediaRoutes.test.ts`
      passes (round-trip, delete, byteless 404, route disambiguation).
