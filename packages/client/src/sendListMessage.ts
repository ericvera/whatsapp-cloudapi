import {
  CloudAPIListSection,
  CloudAPIResponse,
  CloudAPISendInteractiveListMessageRequest,
} from '@whatsapp-cloudapi/types/cloudapi'
import {
  InteractiveBodyMaxLength,
  InteractiveFooterMaxLength,
  InteractiveHeaderTextMaxLength,
  ListButtonTextMaxLength,
  ListRowDescriptionMaxLength,
  ListRowIdMaxLength,
  ListRowsMaxCount,
  ListRowsPerSectionMinCount,
  ListRowTitleMaxLength,
  ListSectionsMinCount,
  ListSectionTitleMaxLength,
} from './constants.js'
import { sendRequest } from './internal/sendRequest.js'

interface SendListMessageParams {
  /** The access token for the WhatsApp Cloud API */
  accessToken: string

  /** The senders phone number ID (e.g. "1234567890") */
  from: string

  /**
   * The recipient's phone number with country code or phone number ID (e.g.
   * "+16505551234" or "5551234")
   */
  to: string

  /** The main message text (maximum 1024 characters) */
  bodyText: string

  /** Button text to open the list (maximum 20 characters) */
  buttonText: string

  /** Array of sections containing list items (maximum 10 rows total) */
  sections: CloudAPIListSection[]

  /** Optional header text (maximum 60 characters) */
  headerText?: string

  /** Optional footer text (maximum 60 characters) */
  footerText?: string

  /** An arbitrary string, useful for tracking */
  bizOpaqueCallbackData?: string

  /**
   * Optional base URL for the API (defaults to Facebook Graph API, use
   * http://localhost:4004 for emulator)
   */
  baseUrl?: string
}

/**
 * Helper function to send a WhatsApp message with an interactive list
 *
 * @param params - The parameters for sending a list message
 * @returns Promise with the API response
 */
export const sendListMessage = async ({
  accessToken,
  from,
  to,
  bodyText,
  buttonText,
  sections,
  headerText,
  footerText,
  bizOpaqueCallbackData,
  baseUrl,
}: SendListMessageParams): Promise<CloudAPIResponse> => {
  // Validate sections count
  if (sections.length < ListSectionsMinCount) {
    throw new Error(
      `Must provide at least ${ListSectionsMinCount.toString()} section`,
    )
  }

  // Validate character limits
  if (bodyText.length > InteractiveBodyMaxLength) {
    throw new Error(
      `Body text cannot exceed ${InteractiveBodyMaxLength.toString()} characters`,
    )
  }

  if (buttonText.length > ListButtonTextMaxLength) {
    throw new Error(
      `Button text cannot exceed ${ListButtonTextMaxLength.toString()} characters`,
    )
  }

  if (headerText && headerText.length > InteractiveHeaderTextMaxLength) {
    throw new Error(
      `Header text cannot exceed ${InteractiveHeaderTextMaxLength.toString()} characters`,
    )
  }

  if (footerText && footerText.length > InteractiveFooterMaxLength) {
    throw new Error(
      `Footer text cannot exceed ${InteractiveFooterMaxLength.toString()} characters`,
    )
  }

  // Validate sections and rows
  let totalRows = 0
  const rowIds = new Set<string>()

  for (const section of sections) {
    if (section.title && section.title.length > ListSectionTitleMaxLength) {
      throw new Error(
        `Section title cannot exceed ${ListSectionTitleMaxLength.toString()} characters`,
      )
    }

    if (section.rows.length < ListRowsPerSectionMinCount) {
      throw new Error(
        `Each section must have at least ${ListRowsPerSectionMinCount.toString()} row`,
      )
    }

    totalRows += section.rows.length

    for (const row of section.rows) {
      if (row.id.length > ListRowIdMaxLength) {
        throw new Error(
          `Row ID cannot exceed ${ListRowIdMaxLength.toString()} characters`,
        )
      }

      if (row.title.length > ListRowTitleMaxLength) {
        throw new Error(
          `Row title cannot exceed ${ListRowTitleMaxLength.toString()} characters`,
        )
      }

      if (
        row.description &&
        row.description.length > ListRowDescriptionMaxLength
      ) {
        throw new Error(
          `Row description cannot exceed ${ListRowDescriptionMaxLength.toString()} characters`,
        )
      }

      if (rowIds.has(row.id)) {
        throw new Error(`Duplicate row ID found: ${row.id}`)
      }

      rowIds.add(row.id)
    }
  }

  if (totalRows > ListRowsMaxCount) {
    throw new Error(
      `Total number of rows across all sections cannot exceed ${ListRowsMaxCount.toString()}`,
    )
  }

  const message: CloudAPISendInteractiveListMessageRequest = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive: {
      type: 'list',
      body: {
        text: bodyText,
      },
      action: {
        button: buttonText,
        sections,
      },
    },
  }

  // Add header if provided
  if (headerText) {
    message.interactive.header = {
      type: 'text',
      text: headerText,
    }
  }

  // Add footer if provided
  if (footerText) {
    message.interactive.footer = {
      text: footerText,
    }
  }

  // Add tracking data if provided
  if (bizOpaqueCallbackData) {
    message.biz_opaque_callback_data = bizOpaqueCallbackData
  }

  return sendRequest(accessToken, from, message, baseUrl)
}
