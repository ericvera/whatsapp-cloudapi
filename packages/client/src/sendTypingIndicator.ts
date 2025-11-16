import {
  CloudAPISendTypingIndicatorRequest,
  CloudAPITypingIndicatorResponse,
} from '@whatsapp-cloudapi/types/cloudapi'
import { sendRequest } from './internal/sendRequest.js'

interface SendTypingIndicatorParams {
  /** The access token for the WhatsApp Cloud API */
  accessToken: string

  /** The senders phone number ID (e.g. "1234567890") */
  from: string

  /** The recipient's phone number with country code (e.g. "+1234567890") */
  to: string

  /**
   * The typing action to perform
   * - 'typing': Show typing indicator (displays for up to 25 seconds)
   * - 'stopped': Stop showing typing indicator
   */
  action: 'typing' | 'stopped'

  /**
   * Optional base URL for the API (defaults to Facebook Graph API, use
   * http://localhost:4004 for emulator)
   */
  baseUrl?: string
}

/**
 * Helper function to send a typing indicator to a WhatsApp user
 *
 * The typing indicator shows a "typing..." status in the chat and automatically
 * disappears after 25 seconds or when a message is sent, whichever comes first.
 *
 * @param params - The parameters for sending the typing indicator
 * @returns Promise with the API response
 *
 * @example
 * ```typescript
 * // Show typing indicator
 * await sendTypingIndicator({
 *   accessToken: 'YOUR_ACCESS_TOKEN',
 *   from: 'YOUR_PHONE_NUMBER_ID',
 *   to: '+1234567890',
 *   action: 'typing'
 * })
 *
 * // Stop typing indicator
 * await sendTypingIndicator({
 *   accessToken: 'YOUR_ACCESS_TOKEN',
 *   from: 'YOUR_PHONE_NUMBER_ID',
 *   to: '+1234567890',
 *   action: 'stopped'
 * })
 * ```
 */
export const sendTypingIndicator = async ({
  accessToken,
  from,
  to,
  action,
  baseUrl,
}: SendTypingIndicatorParams): Promise<CloudAPITypingIndicatorResponse> => {
  const message: CloudAPISendTypingIndicatorRequest = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'typing_indicator',
    typing_indicator: {
      action,
    },
  }

  return sendRequest(accessToken, from, message, baseUrl)
}
