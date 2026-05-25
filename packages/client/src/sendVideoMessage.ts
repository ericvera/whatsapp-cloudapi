import {
  CloudAPIResponse,
  CloudAPISendVideoMessageRequest,
} from '@whatsapp-cloudapi/types/cloudapi'
import { MediaCaptionMaxLength } from './constants.js'
import { buildRecipient } from './internal/buildRecipient.js'
import { sendRequest } from './internal/sendRequest.js'

interface SendVideoMessageParams {
  /** The access token for the WhatsApp Cloud API */
  accessToken: string
  /** The sender's phone number ID (e.g. "1234567890") */
  from: string
  /**
   * The recipient's phone number with country code or phone number ID
   * (e.g. "+16505551234"). At least one of `to` / `recipient` is required.
   */
  to?: string
  /**
   * The recipient's business-scoped user ID (BSUID)
   * At least one of `to` / `recipient` is required; `to` takes precedence.
   */
  recipient?: string
  /** The media ID of the uploaded video (one of mediaId / link required) */
  mediaId?: string
  /** A public URL to the video file (one of mediaId / link required) */
  link?: string
  /** Optional caption for the video (maximum 1024 characters) */
  caption?: string
  /** Optional message ID to reply to */
  context?: { messageId: string }
  /** An arbitrary string, useful for tracking */
  bizOpaqueCallbackData?: string
  /**
   * Optional base URL for the API (defaults to Facebook Graph API, use
   * http://localhost:4004 for emulator)
   */
  baseUrl?: string
}

/**
 * Sends a video message using a media ID or a public link
 * @param params - Send video message parameters
 * @returns Promise with the API response
 */
export const sendVideoMessage = async (
  params: SendVideoMessageParams,
): Promise<CloudAPIResponse> => {
  const {
    accessToken,
    from,
    to,
    recipient,
    mediaId,
    link,
    caption,
    context,
    bizOpaqueCallbackData,
    baseUrl,
  } = params

  if (!mediaId && !link) {
    throw new Error('Either "mediaId" or "link" is required')
  }

  if (caption && caption.length > MediaCaptionMaxLength) {
    throw new Error(
      `Caption too long: ${caption.length.toString()} characters. Maximum allowed: ${MediaCaptionMaxLength.toString()} characters`,
    )
  }

  const message: CloudAPISendVideoMessageRequest = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    ...buildRecipient(to, recipient),
    ...(context && { context: { message_id: context.messageId } }),
    type: 'video',
    video: {
      ...(mediaId && { id: mediaId }),
      ...(link && { link }),
      ...(caption && { caption }),
    },
    ...(bizOpaqueCallbackData && {
      biz_opaque_callback_data: bizOpaqueCallbackData,
    }),
  }

  return sendRequest(accessToken, from, message, baseUrl)
}
