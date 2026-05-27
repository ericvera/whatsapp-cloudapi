import {
  CloudAPIResponse,
  CloudAPISendProductMessageRequest,
} from '@whatsapp-cloudapi/types/cloudapi'
import {
  InteractiveBodyMaxLength,
  InteractiveFooterMaxLength,
} from './constants.js'
import { buildRecipient } from './internal/buildRecipient.js'
import { sendRequest } from './internal/sendRequest.js'

interface SendProductMessageParams {
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
  /** ID of the catalog connected to the WhatsApp Business Account */
  catalogId: string
  /** Retailer ID of the product to share */
  productRetailerId: string
  /** Optional body text content (maximum 1024 characters) */
  bodyText?: string
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
 * Sends a single-product message sharing one item from a connected catalog
 * @param params - Send product message parameters
 * @returns Promise with the API response
 */
export const sendProductMessage = async (
  params: SendProductMessageParams,
): Promise<CloudAPIResponse> => {
  const {
    accessToken,
    from,
    to,
    recipient,
    catalogId,
    productRetailerId,
    bodyText,
    footerText,
    context,
    bizOpaqueCallbackData,
    baseUrl,
  } = params

  if (bodyText && bodyText.length > InteractiveBodyMaxLength) {
    throw new Error(
      `Body text too long: ${bodyText.length.toString()} characters. Maximum allowed: ${InteractiveBodyMaxLength.toString()} characters`,
    )
  }

  if (footerText && footerText.length > InteractiveFooterMaxLength) {
    throw new Error(
      `Footer text too long: ${footerText.length.toString()} characters. Maximum allowed: ${InteractiveFooterMaxLength.toString()} characters`,
    )
  }

  const message: CloudAPISendProductMessageRequest = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    ...buildRecipient(to, recipient),
    ...(context && { context: { message_id: context.messageId } }),
    type: 'interactive',
    interactive: {
      type: 'product',
      ...(bodyText && { body: { text: bodyText } }),
      ...(footerText && { footer: { text: footerText } }),
      action: {
        catalog_id: catalogId,
        product_retailer_id: productRetailerId,
      },
    },
    ...(bizOpaqueCallbackData && {
      biz_opaque_callback_data: bizOpaqueCallbackData,
    }),
  }

  return sendRequest(accessToken, from, message, baseUrl)
}
