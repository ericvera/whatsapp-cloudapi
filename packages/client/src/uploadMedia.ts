import {
  CloudAPIMediaUploadResponse,
  ImageMediaConstraints,
} from '@whatsapp-cloudapi/types/cloudapi'
import { WhatsAppCloudAPIBaseUrl } from './constants.js'

interface UploadMediaParams {
  /** The access token for the WhatsApp Cloud API */
  accessToken: string
  /** The sender's phone number ID (e.g. "1234567890") */
  from: string
  /** The image file to upload as a Blob */
  file: Blob
  /**
   * Optional base URL for the API (defaults to Facebook Graph API, use
   * http://localhost:4004 for emulator)
   */
  baseUrl?: string
}

/**
 * Uploads an image to the WhatsApp Cloud API media endpoint
 * @param params - Upload parameters
 * @returns Promise with the media upload response containing the media ID
 */
export const uploadMedia = async (
  params: UploadMediaParams,
): Promise<CloudAPIMediaUploadResponse> => {
  const { accessToken, from, file, baseUrl } = params
  const apiUrl = baseUrl ?? WhatsAppCloudAPIBaseUrl

  // Validate file size
  if (file.size > ImageMediaConstraints.MaxFileSize) {
    throw new Error(
      `File size too large: ${file.size.toString()} bytes. Maximum allowed: ${ImageMediaConstraints.MaxFileSize.toString()} bytes (5MB)`,
    )
  }

  // Validate MIME type
  const supportedTypes = ImageMediaConstraints.SupportedMimeTypes

  if (!supportedTypes.includes(file.type)) {
    throw new Error(
      `Unsupported MIME type: ${file.type}. Supported types: ${ImageMediaConstraints.SupportedMimeTypes.join(', ')}`,
    )
  }

  // Create FormData for multipart upload
  const formData = new FormData()
  formData.append('messaging_product', 'whatsapp')
  formData.append('file', file)

  // Send the upload request
  const response = await fetch(`${apiUrl}/v22.0/${from}/media`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      // Note: Don't set Content-Type header - let the browser set it for FormData
    },
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`WhatsApp Media Upload Error: ${JSON.stringify(error)}`)
  }

  return response.json() as Promise<CloudAPIMediaUploadResponse>
}
