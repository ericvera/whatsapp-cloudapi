import {
  CloudAPIResponse,
  CloudAPISendDocumentMessageRequest,
} from '@whatsapp-cloudapi/types/cloudapi'
import { MediaCaptionMaxLength } from './constants.js'
import { sendRequest } from './internal/sendRequest.js'

interface SendDocumentMessageParams {
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
  /** The media ID of the uploaded document (one of mediaId / link required) */
  mediaId?: string
  /** A public URL to the document file (one of mediaId / link required) */
  link?: string
  /** Optional caption for the document (maximum 1024 characters) */
  caption?: string
  /** Optional filename to display for the document */
  filename?: string
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
 * Sends a document message using a media ID or a public link
 * @param params - Send document message parameters
 * @returns Promise with the API response
 */
export const sendDocumentMessage = async (
  params: SendDocumentMessageParams,
): Promise<CloudAPIResponse> => {
  const {
    accessToken,
    from,
    to,
    recipient,
    mediaId,
    link,
    caption,
    filename,
    context,
    bizOpaqueCallbackData,
    baseUrl,
  } = params

  if (!to && !recipient) {
    throw new Error('Either "to" or "recipient" is required')
  }

  if (!mediaId && !link) {
    throw new Error('Either "mediaId" or "link" is required')
  }

  if (caption && caption.length > MediaCaptionMaxLength) {
    throw new Error(
      `Caption too long: ${caption.length.toString()} characters. Maximum allowed: ${MediaCaptionMaxLength.toString()} characters`,
    )
  }

  const message: CloudAPISendDocumentMessageRequest = {
    messaging_product: 'whatsapp',
    ...(to && { recipient_type: 'individual', to }),
    ...(recipient && { recipient }),
    ...(context && { context: { message_id: context.messageId } }),
    type: 'document',
    document: {
      ...(mediaId && { id: mediaId }),
      ...(link && { link }),
      ...(caption && { caption }),
      ...(filename && { filename }),
    },
    ...(bizOpaqueCallbackData && {
      biz_opaque_callback_data: bizOpaqueCallbackData,
    }),
  }

  return sendRequest(accessToken, from, message, baseUrl)
}
