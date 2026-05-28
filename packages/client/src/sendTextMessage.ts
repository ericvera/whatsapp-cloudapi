import {
  CloudAPIResponse,
  CloudAPISendTextMessageRequest,
} from '@whatsapp-cloudapi/types/cloudapi'
import { buildRecipient } from './internal/buildRecipient.js'
import { sendRequest } from './internal/sendRequest.js'

interface SendTextMessageParams {
  /** The access token for the WhatsApp Cloud API */
  accessToken: string
  /** The senders phone number ID (e.g. "1234567890") */
  from: string
  /**
   * The recipient's phone number with country code or phone number ID
   * (e.g. "+16505551234"). At least one of `to` / `recipient` is required.
   */
  to?: string
  /**
   * The recipient's business-scoped user ID (BSUID).
   * At least one of `to` / `recipient` is required; `to` takes precedence.
   */
  recipient?: string
  /** The text message to send */
  text: string
  /** Whether to enable link preview for URLs in the message */
  previewUrl?: boolean
  /** An arbitrary string, useful for tracking */
  bizOpaqueCallbackData?: string
  /** Optional base URL for the API (defaults to Facebook Graph API, use http://localhost:4004 for emulator) */
  baseUrl?: string
}

/**
 * Helper function to send a WhatsApp text message
 * @param params - The parameters for sending a text message
 * @returns Promise with the API response
 */
export const sendTextMessage = async ({
  accessToken,
  from,
  to,
  recipient,
  text,
  previewUrl,
  bizOpaqueCallbackData,
  baseUrl,
}: SendTextMessageParams): Promise<CloudAPIResponse> => {
  const message: CloudAPISendTextMessageRequest = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    ...buildRecipient(to, recipient),
    type: 'text',
    text: {
      body: text,
      ...(previewUrl !== undefined && { preview_url: previewUrl }),
    },
  }

  if (bizOpaqueCallbackData) {
    message.biz_opaque_callback_data = bizOpaqueCallbackData
  }

  return sendRequest(accessToken, from, message, baseUrl)
}
