import {
  CloudAPIResponse,
  CloudAPISendTextMessageRequest,
} from '@whatsapp-cloudapi/types/cloudapi'
import { sendRequest } from './internal/sendRequest.js'

interface SendTextMessageParams {
  /** The access token for the WhatsApp Cloud API */
  accessToken: string
  /** The senders phone number ID (e.g. "1234567890") */
  from: string
  /** The recipient's phone number with country code or phone number ID (e.g. "+16505551234" or "5551234") */
  to: string
  /** The text message to send */
  text: string
  /** Whether to enable link preview for URLs in the message */
  previewUrl?: boolean
  /** An arbitrary string, useful for tracking */
  bizOpaqueCallbackData?: string
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
  text,
  previewUrl,
  bizOpaqueCallbackData,
}: SendTextMessageParams): Promise<CloudAPIResponse> => {
  const message: CloudAPISendTextMessageRequest = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'text',
    text: {
      body: text,
      ...(previewUrl !== undefined && { preview_url: previewUrl }),
    },
  }

  if (bizOpaqueCallbackData) {
    message.biz_opaque_callback_data = bizOpaqueCallbackData
  }

  return sendRequest(accessToken, from, message)
}
