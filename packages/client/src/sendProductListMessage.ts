import {
  CloudAPIResponse,
  CloudAPISendProductListMessageRequest,
} from '@whatsapp-cloudapi/types/cloudapi'
import {
  InteractiveBodyMaxLength,
  InteractiveFooterMaxLength,
  InteractiveHeaderTextMaxLength,
  ListSectionTitleMaxLength,
} from './constants.js'
import { sendRequest } from './internal/sendRequest.js'

/** A section grouping one or more catalog products under a title */
interface ProductListSection {
  /** Section title (maximum 24 characters) */
  title: string
  /** Retailer IDs of the products listed in this section (at least one) */
  productRetailerIds: string[]
}

interface SendProductListMessageParams {
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
  /** Header text content (maximum 60 characters) */
  headerText: string
  /** Body text content (maximum 1024 characters) */
  bodyText: string
  /** Product sections (at least one, each with at least one product) */
  sections: ProductListSection[]
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
 * Sends a multi-product message sharing catalog products grouped into sections
 * @param params - Send product-list message parameters
 * @returns Promise with the API response
 */
export const sendProductListMessage = async (
  params: SendProductListMessageParams,
): Promise<CloudAPIResponse> => {
  const {
    accessToken,
    from,
    to,
    recipient,
    catalogId,
    headerText,
    bodyText,
    sections,
    footerText,
    context,
    bizOpaqueCallbackData,
    baseUrl,
  } = params

  if (!to && !recipient) {
    throw new Error('Either "to" or "recipient" is required')
  }

  if (headerText.length > InteractiveHeaderTextMaxLength) {
    throw new Error(
      `Header text too long: ${headerText.length.toString()} characters. Maximum allowed: ${InteractiveHeaderTextMaxLength.toString()} characters`,
    )
  }

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

  if (sections.length === 0) {
    throw new Error('At least one product section is required')
  }

  for (const section of sections) {
    if (section.title.length > ListSectionTitleMaxLength) {
      throw new Error(
        `Section title too long: ${section.title.length.toString()} characters. Maximum allowed: ${ListSectionTitleMaxLength.toString()} characters`,
      )
    }

    if (section.productRetailerIds.length === 0) {
      throw new Error('Each product section requires at least one product')
    }
  }

  const message: CloudAPISendProductListMessageRequest = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    ...(to && { to }),
    ...(recipient && { recipient }),
    ...(context && { context: { message_id: context.messageId } }),
    type: 'interactive',
    interactive: {
      type: 'product_list',
      header: { type: 'text', text: headerText },
      body: { text: bodyText },
      ...(footerText && { footer: { text: footerText } }),
      action: {
        catalog_id: catalogId,
        sections: sections.map((section) => ({
          title: section.title,
          product_items: section.productRetailerIds.map((id) => ({
            product_retailer_id: id,
          })),
        })),
      },
    },
    ...(bizOpaqueCallbackData && {
      biz_opaque_callback_data: bizOpaqueCallbackData,
    }),
  }

  return sendRequest(accessToken, from, message, baseUrl)
}
