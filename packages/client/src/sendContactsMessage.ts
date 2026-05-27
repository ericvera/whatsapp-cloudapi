import {
  CloudAPIContact,
  CloudAPIResponse,
  CloudAPISendContactsMessageRequest,
} from '@whatsapp-cloudapi/types/cloudapi'
import { buildRecipient } from './internal/buildRecipient.js'
import { sendRequest } from './internal/sendRequest.js'

interface SendContactsMessageParams {
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
  /** The contacts to share (at least one required) */
  contacts: CloudAPIContact[]
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
 * Sends a contacts message sharing one or more contact cards
 * @param params - Send contacts message parameters
 * @returns Promise with the API response
 */
export const sendContactsMessage = async (
  params: SendContactsMessageParams,
): Promise<CloudAPIResponse> => {
  const {
    accessToken,
    from,
    to,
    recipient,
    contacts,
    context,
    bizOpaqueCallbackData,
    baseUrl,
  } = params

  if (contacts.length === 0) {
    throw new Error('At least one contact is required')
  }

  const message: CloudAPISendContactsMessageRequest = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    ...buildRecipient(to, recipient),
    ...(context && { context: { message_id: context.messageId } }),
    type: 'contacts',
    contacts,
    ...(bizOpaqueCallbackData && {
      biz_opaque_callback_data: bizOpaqueCallbackData,
    }),
  }

  return sendRequest(accessToken, from, message, baseUrl)
}
