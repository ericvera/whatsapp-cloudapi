import { CloudAPIMediaDeleteResponse } from '@whatsapp-cloudapi/types/cloudapi'
import { apiRequest } from './internal/apiRequest.js'

interface DeleteMediaParams {
  /** The access token for the WhatsApp Cloud API */
  accessToken: string
  /** The media ID to delete */
  mediaId: string
  /**
   * Optional base URL for the API (defaults to Facebook Graph API, use
   * http://localhost:4004 for emulator)
   */
  baseUrl?: string
}

/**
 * Deletes a media asset by its media ID
 * @param params - Delete media parameters
 * @returns Promise with the delete response ({ success })
 */
export const deleteMedia = async (
  params: DeleteMediaParams,
): Promise<CloudAPIMediaDeleteResponse> => {
  const { accessToken, mediaId, baseUrl } = params

  return apiRequest<CloudAPIMediaDeleteResponse>({
    accessToken,
    method: 'DELETE',
    path: mediaId,
    ...(baseUrl !== undefined && { baseUrl }),
  })
}
