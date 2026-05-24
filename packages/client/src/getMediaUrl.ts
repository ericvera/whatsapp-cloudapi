import { CloudAPIMediaURLResponse } from '@whatsapp-cloudapi/types/cloudapi'
import { apiRequest } from './internal/apiRequest.js'

interface GetMediaUrlParams {
  /** The access token for the WhatsApp Cloud API */
  accessToken: string
  /** The media ID to resolve to a download URL + metadata */
  mediaId: string
  /**
   * Optional base URL for the API (defaults to Facebook Graph API, use
   * http://localhost:4004 for emulator)
   */
  baseUrl?: string
}

/**
 * Retrieves the short-lived download URL and metadata for a media ID
 * The returned `url` expires after 5 minutes and requires the access token to
 * download (see downloadMedia).
 * @param params - Get media URL parameters
 * @returns Promise with the media URL/metadata response
 */
export const getMediaUrl = async (
  params: GetMediaUrlParams,
): Promise<CloudAPIMediaURLResponse> => {
  const { accessToken, mediaId, baseUrl } = params

  return apiRequest<CloudAPIMediaURLResponse>({
    accessToken,
    method: 'GET',
    path: mediaId,
    ...(baseUrl !== undefined && { baseUrl }),
  })
}
