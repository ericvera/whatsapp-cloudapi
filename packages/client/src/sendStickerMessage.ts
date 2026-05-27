import {
  CloudAPIResponse,
  CloudAPISendStickerMessageRequest,
} from '@whatsapp-cloudapi/types/cloudapi'
import { buildMediaSource } from './internal/buildMediaSource.js'
import { buildRecipient } from './internal/buildRecipient.js'
import { sendRequest } from './internal/sendRequest.js'

interface SendStickerMessageParams {
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
  /** The media ID of the uploaded sticker (one of mediaId / link required) */
  mediaId?: string
  /** A public URL to the sticker file (one of mediaId / link required) */
  link?: string
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
 * Sends a sticker message using a media ID or a public link
 * @param params - Send sticker message parameters
 * @returns Promise with the API response
 */
export const sendStickerMessage = async (
  params: SendStickerMessageParams,
): Promise<CloudAPIResponse> => {
  const {
    accessToken,
    from,
    to,
    recipient,
    mediaId,
    link,
    context,
    bizOpaqueCallbackData,
    baseUrl,
  } = params

  const message: CloudAPISendStickerMessageRequest = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    ...buildRecipient(to, recipient),
    ...(context && { context: { message_id: context.messageId } }),
    type: 'sticker',
    sticker: {
      ...buildMediaSource(mediaId, link),
    },
    ...(bizOpaqueCallbackData && {
      biz_opaque_callback_data: bizOpaqueCallbackData,
    }),
  }

  return sendRequest(accessToken, from, message, baseUrl)
}
