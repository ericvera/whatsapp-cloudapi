import {
  CloudAPIResponse,
  CloudAPISendReactionMessageRequest,
} from '@whatsapp-cloudapi/types/cloudapi'
import { sendRequest } from './internal/sendRequest.js'

interface SendReactionMessageParams {
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
  /** The ID of the message to react to */
  messageId: string
  /** The emoji to react with; an empty string removes the reaction */
  emoji: string
  /** An arbitrary string, useful for tracking */
  bizOpaqueCallbackData?: string
  /**
   * Optional base URL for the API (defaults to Facebook Graph API, use
   * http://localhost:4004 for emulator)
   */
  baseUrl?: string
}

/**
 * Sends a reaction to a message (an empty emoji removes the reaction)
 * @param params - Send reaction message parameters
 * @returns Promise with the API response
 */
export const sendReactionMessage = async (
  params: SendReactionMessageParams,
): Promise<CloudAPIResponse> => {
  const {
    accessToken,
    from,
    to,
    recipient,
    messageId,
    emoji,
    bizOpaqueCallbackData,
    baseUrl,
  } = params

  if (!to && !recipient) {
    throw new Error('Either "to" or "recipient" is required')
  }

  const message: CloudAPISendReactionMessageRequest = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    ...(to && { to }),
    ...(recipient && { recipient }),
    type: 'reaction',
    reaction: {
      message_id: messageId,
      emoji,
    },
    ...(bizOpaqueCallbackData && {
      biz_opaque_callback_data: bizOpaqueCallbackData,
    }),
  }

  return sendRequest(accessToken, from, message, baseUrl)
}
