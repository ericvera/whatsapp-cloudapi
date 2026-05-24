import { CloudAPIMediaUploadResponse } from '@whatsapp-cloudapi/types/cloudapi'
import {
  AllSupportedMediaMimeTypes,
  MediaCategory,
  MediaSpecByCategory,
  WhatsAppCloudAPIBaseUrl,
  WhatsAppCloudAPIVersion,
} from './constants.js'

interface UploadMediaParams {
  /** The access token for the WhatsApp Cloud API */
  accessToken: string
  /** The sender's phone number ID (e.g. "1234567890") */
  from: string
  /** The media file to upload as a Blob (image/audio/video/document/sticker) */
  file: Blob
  /**
   * Optional base URL for the API (defaults to Facebook Graph API, use
   * http://localhost:4004 for emulator)
   */
  baseUrl?: string
}

/**
 * Uploads a media file to the WhatsApp Cloud API media endpoint
 * Supports all v25.0 media categories (image, audio, video, document, sticker);
 * the MIME type and size limit are validated per category.
 * @param params - Upload parameters
 * @returns Promise with the media upload response containing the media ID
 */
export const uploadMedia = async (
  params: UploadMediaParams,
): Promise<CloudAPIMediaUploadResponse> => {
  const { accessToken, from, file, baseUrl } = params
  const apiUrl = baseUrl ?? WhatsAppCloudAPIBaseUrl

  // Determine the media category from the file's MIME type
  const category = (Object.keys(MediaSpecByCategory) as MediaCategory[]).find(
    (cat) => MediaSpecByCategory[cat].mimeTypes.includes(file.type),
  )

  if (!category) {
    throw new Error(
      `Unsupported MIME type: ${file.type}. Supported types: ${AllSupportedMediaMimeTypes.join(', ')}`,
    )
  }

  // Validate file size against the category's limit
  const { maxBytes } = MediaSpecByCategory[category]

  if (file.size > maxBytes) {
    throw new Error(
      `File size too large: ${file.size.toString()} bytes. Maximum allowed for ${category}: ${maxBytes.toString()} bytes`,
    )
  }

  // Create FormData for multipart upload
  const formData = new FormData()
  formData.append('messaging_product', 'whatsapp')
  formData.append('file', file)
  // Note: Browser will automatically set Content-Length header to include
  // the entire multipart body (file.size + multipart boundaries/headers)

  // Send the upload request
  const response = await fetch(
    `${apiUrl}/${WhatsAppCloudAPIVersion}/${from}/media`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        // NOTE: Don't set Content-Type header - let the browser set it for
        // FormData
      },
      body: formData,
    },
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`WhatsApp Media Upload Error: ${JSON.stringify(error)}`)
  }

  return response.json() as Promise<CloudAPIMediaUploadResponse>
}
