import {
  CloudAPIMarkMessageReadRequest,
  CloudAPIMarkReadResponse,
} from '@whatsapp-cloudapi/types/cloudapi'
import { sendRequest } from './internal/sendRequest.js'

interface MarkMessageReadParams {
  /** The access token for the WhatsApp Cloud API */
  accessToken: string

  /** The senders phone number ID (e.g. "1234567890") */
  from: string

  /** The message ID to mark as read */
  messageId: string

  /**
   * Optional base URL for the API (defaults to Facebook Graph API, use
   * http://localhost:4004 for emulator)
   */
  baseUrl?: string
}

/**
 * Helper function to mark a WhatsApp message as read
 *
 * @param params - The parameters for marking a message as read
 * @returns Promise with the API response
 */
export const markMessageRead = async ({
  accessToken,
  from,
  messageId,
  baseUrl,
}: MarkMessageReadParams): Promise<CloudAPIMarkReadResponse> => {
  const message: CloudAPIMarkMessageReadRequest = {
    messaging_product: 'whatsapp',
    status: 'read',
    message_id: messageId,
  }

  return sendRequest(accessToken, from, message, baseUrl)
}
