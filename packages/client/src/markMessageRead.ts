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
   * Optional: Show a typing indicator while preparing response
   * The typing indicator will be dismissed after 25 seconds or when you
   * send a message, whichever comes first
   * @default false
   */
  showTypingIndicator?: boolean

  /**
   * Optional base URL for the API (defaults to Facebook Graph API, use
   * http://localhost:4004 for emulator)
   */
  baseUrl?: string
}

/**
 * Helper function to mark a WhatsApp message as read
 *
 * Optionally displays a typing indicator to show the user that you are
 * preparing a response. The typing indicator will auto-dismiss after 25
 * seconds or when you send a message.
 *
 * @param params - The parameters for marking a message as read
 * @returns Promise with the API response
 *
 * @example
 * ```typescript
 * // Mark as read without typing indicator
 * await markMessageRead({
 *   accessToken: 'YOUR_ACCESS_TOKEN',
 *   from: 'YOUR_PHONE_NUMBER_ID',
 *   messageId: 'wamid.HBg...'
 * })
 *
 * // Mark as read and show typing indicator
 * await markMessageRead({
 *   accessToken: 'YOUR_ACCESS_TOKEN',
 *   from: 'YOUR_PHONE_NUMBER_ID',
 *   messageId: 'wamid.HBg...',
 *   showTypingIndicator: true
 * })
 * ```
 */
export const markMessageRead = async ({
  accessToken,
  from,
  messageId,
  showTypingIndicator = false,
  baseUrl,
}: MarkMessageReadParams): Promise<CloudAPIMarkReadResponse> => {
  const message: CloudAPIMarkMessageReadRequest = {
    messaging_product: 'whatsapp',
    status: 'read',
    message_id: messageId,
    ...(showTypingIndicator && {
      typing_indicator: {
        type: 'text',
      },
    }),
  }

  return sendRequest(accessToken, from, message, baseUrl)
}
