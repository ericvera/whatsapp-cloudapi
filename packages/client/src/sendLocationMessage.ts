import {
  CloudAPIResponse,
  CloudAPISendLocationMessageRequest,
} from '@whatsapp-cloudapi/types/cloudapi'
import { buildRecipient } from './internal/buildRecipient.js'
import { sendRequest } from './internal/sendRequest.js'

interface SendLocationMessageParams {
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
  /** Latitude of the location */
  latitude: number
  /** Longitude of the location */
  longitude: number
  /** Optional name of the location */
  name?: string
  /** Optional address of the location */
  address?: string
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
 * Sends a location message
 * @param params - Send location message parameters
 * @returns Promise with the API response
 */
export const sendLocationMessage = async (
  params: SendLocationMessageParams,
): Promise<CloudAPIResponse> => {
  const {
    accessToken,
    from,
    to,
    recipient,
    latitude,
    longitude,
    name,
    address,
    context,
    bizOpaqueCallbackData,
    baseUrl,
  } = params

  const message: CloudAPISendLocationMessageRequest = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    ...buildRecipient(to, recipient),
    ...(context && { context: { message_id: context.messageId } }),
    type: 'location',
    location: {
      latitude,
      longitude,
      ...(name && { name }),
      ...(address && { address }),
    },
    ...(bizOpaqueCallbackData && {
      biz_opaque_callback_data: bizOpaqueCallbackData,
    }),
  }

  return sendRequest(accessToken, from, message, baseUrl)
}
