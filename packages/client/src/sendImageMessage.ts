import {
  CloudAPIResponse,
  CloudAPISendImageMessageRequest,
} from '@whatsapp-cloudapi/types/cloudapi'
import { sendRequest } from './internal/sendRequest.js'

interface SendImageMessageParams {
  /** The access token for the WhatsApp Cloud API */
  accessToken: string
  /** The sender's phone number ID (e.g. "1234567890") */
  from: string
  /** The recipient's phone number with country code or phone number ID (e.g. "+16505551234" or "5551234") */
  to: string
  /** The media ID of the uploaded image */
  mediaId: string
  /** Optional caption for the image (maximum 1024 characters) */
  caption?: string
  /** An arbitrary string, useful for tracking */
  bizOpaqueCallbackData?: string
  /** Optional base URL for the API (defaults to Facebook Graph API, use http://localhost:4004 for emulator) */
  baseUrl?: string
}

/**
 * Sends an image message using a media ID obtained from the media upload endpoint
 * @param params - Send image message parameters
 * @returns Promise with the API response
 */
export const sendImageMessage = async (
  params: SendImageMessageParams,
): Promise<CloudAPIResponse> => {
  const {
    accessToken,
    from,
    to,
    mediaId,
    caption,
    bizOpaqueCallbackData,
    baseUrl,
  } = params

  // Validate caption length
  if (caption && caption.length > 1024) {
    throw new Error(
      `Caption too long: ${caption.length.toString()} characters. Maximum allowed: 1024 characters`,
    )
  }

  const message: CloudAPISendImageMessageRequest = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'image',
    image: {
      id: mediaId,
      ...(caption && { caption }),
    },
    ...(bizOpaqueCallbackData && {
      biz_opaque_callback_data: bizOpaqueCallbackData,
    }),
  }

  return sendRequest(accessToken, from, message, baseUrl)
}
