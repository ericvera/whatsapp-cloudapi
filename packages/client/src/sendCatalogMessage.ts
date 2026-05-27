import {
  CloudAPIResponse,
  CloudAPISendCatalogMessageRequest,
} from '@whatsapp-cloudapi/types/cloudapi'
import {
  InteractiveBodyMaxLength,
  InteractiveFooterMaxLength,
} from './constants.js'
import { buildRecipient } from './internal/buildRecipient.js'
import { sendRequest } from './internal/sendRequest.js'

interface SendCatalogMessageParams {
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
  /** Body text content (maximum 1024 characters) */
  bodyText: string
  /** Product retailer ID to use as the catalog thumbnail */
  thumbnailProductRetailerId: string
  /** Optional footer text content (maximum 60 characters) */
  footerText?: string
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
 * Sends a catalog message showcasing the business product catalog
 * @param params - Send catalog message parameters
 * @returns Promise with the API response
 */
export const sendCatalogMessage = async (
  params: SendCatalogMessageParams,
): Promise<CloudAPIResponse> => {
  const {
    accessToken,
    from,
    to,
    recipient,
    bodyText,
    thumbnailProductRetailerId,
    footerText,
    context,
    bizOpaqueCallbackData,
    baseUrl,
  } = params

  if (bodyText.length > InteractiveBodyMaxLength) {
    throw new Error(
      `Body text too long: ${bodyText.length.toString()} characters. Maximum allowed: ${InteractiveBodyMaxLength.toString()} characters`,
    )
  }

  if (footerText && footerText.length > InteractiveFooterMaxLength) {
    throw new Error(
      `Footer text too long: ${footerText.length.toString()} characters. Maximum allowed: ${InteractiveFooterMaxLength.toString()} characters`,
    )
  }

  const message: CloudAPISendCatalogMessageRequest = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    ...buildRecipient(to, recipient),
    ...(context && { context: { message_id: context.messageId } }),
    type: 'interactive',
    interactive: {
      type: 'catalog_message',
      body: { text: bodyText },
      ...(footerText && { footer: { text: footerText } }),
      action: {
        name: 'catalog_message',
        parameters: {
          thumbnail_product_retailer_id: thumbnailProductRetailerId,
        },
      },
    },
    ...(bizOpaqueCallbackData && {
      biz_opaque_callback_data: bizOpaqueCallbackData,
    }),
  }

  return sendRequest(accessToken, from, message, baseUrl)
}
