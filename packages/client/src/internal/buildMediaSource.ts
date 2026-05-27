import { CloudAPIMediaSource } from '@whatsapp-cloudapi/types/cloudapi'

/**
 * Builds a media source, enforcing that exactly one of `mediaId` (uploaded
 * media) or `link` (public URL) is provided. Throws if neither or both are
 * given.
 *
 * @param mediaId - Media ID returned by the media upload endpoint
 * @param link - Public URL of the media
 * @returns The `{ id }` or `{ link }` fragment to use as the media object
 */
export const buildMediaSource = (
  mediaId: string | undefined,
  link: string | undefined,
): CloudAPIMediaSource => {
  if (mediaId && link) {
    throw new Error('Provide only one of "mediaId" / "link"')
  }

  if (mediaId) {
    return { id: mediaId }
  }

  if (link) {
    return { link }
  }

  throw new Error('Either "mediaId" or "link" is required')
}
