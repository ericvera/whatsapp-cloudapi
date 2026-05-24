import {
  CloudAPIResponse,
  CloudAPISendCallPermissionRequestMessageRequest,
} from '@whatsapp-cloudapi/types/cloudapi'
import { InteractiveBodyMaxLength } from './constants.js'
import { sendRequest } from './internal/sendRequest.js'

interface SendCallPermissionRequestMessageParams {
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
  /** Body text explaining why you want to call (maximum 1024 characters) */
  bodyText: string
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
 * Sends an interactive message requesting permission to call the user
 * @param params - Send call permission request message parameters
 * @returns Promise with the API response
 */
export const sendCallPermissionRequestMessage = async (
  params: SendCallPermissionRequestMessageParams,
): Promise<CloudAPIResponse> => {
  const {
    accessToken,
    from,
    to,
    recipient,
    bodyText,
    context,
    bizOpaqueCallbackData,
    baseUrl,
  } = params

  if (!to && !recipient) {
    throw new Error('Either "to" or "recipient" is required')
  }

  if (bodyText.length > InteractiveBodyMaxLength) {
    throw new Error(
      `Body text too long: ${bodyText.length.toString()} characters. Maximum allowed: ${InteractiveBodyMaxLength.toString()} characters`,
    )
  }

  const message: CloudAPISendCallPermissionRequestMessageRequest = {
    messaging_product: 'whatsapp',
    ...(to && { recipient_type: 'individual', to }),
    ...(recipient && { recipient }),
    ...(context && { context: { message_id: context.messageId } }),
    type: 'interactive',
    interactive: {
      type: 'call_permission_request',
      body: { text: bodyText },
      action: { name: 'call_permission_request' },
    },
    ...(bizOpaqueCallbackData && {
      biz_opaque_callback_data: bizOpaqueCallbackData,
    }),
  }

  return sendRequest(accessToken, from, message, baseUrl)
}
