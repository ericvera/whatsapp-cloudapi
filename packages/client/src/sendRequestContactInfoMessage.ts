import {
  CloudAPIResponse,
  CloudAPISendRequestContactInfoMessageRequest,
} from '@whatsapp-cloudapi/types/cloudapi'
import { InteractiveBodyMaxLength } from './constants.js'
import { sendRequest } from './internal/sendRequest.js'

interface SendRequestContactInfoMessageParams {
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
   * This is the common addressing mode for a contact-info request.
   */
  recipient?: string
  /** Body text explaining why you need their contact info (max 1024 chars) */
  bodyText: string
  /** An arbitrary string, useful for tracking */
  bizOpaqueCallbackData?: string
  /**
   * Optional base URL for the API (defaults to Facebook Graph API, use
   * http://localhost:4004 for emulator)
   */
  baseUrl?: string
}

/**
 * Sends an interactive message asking the user to share their contact info
 * @param params - Send request-contact-info message parameters
 * @returns Promise with the API response
 */
export const sendRequestContactInfoMessage = async (
  params: SendRequestContactInfoMessageParams,
): Promise<CloudAPIResponse> => {
  const {
    accessToken,
    from,
    to,
    recipient,
    bodyText,
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

  const message: CloudAPISendRequestContactInfoMessageRequest = {
    messaging_product: 'whatsapp',
    ...(to && { recipient_type: 'individual', to }),
    ...(recipient && { recipient }),
    type: 'interactive',
    interactive: {
      type: 'contact_request',
      body: { text: bodyText },
      action: { name: 'request_contact_info' },
    },
    ...(bizOpaqueCallbackData && {
      biz_opaque_callback_data: bizOpaqueCallbackData,
    }),
  }

  return sendRequest(accessToken, from, message, baseUrl)
}
