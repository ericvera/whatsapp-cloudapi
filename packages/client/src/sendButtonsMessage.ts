import {
  CloudAPIResponse,
  CloudAPISendInteractiveButtonsMessageRequest,
} from '@whatsapp-cloudapi/types/cloudapi'
import { sendRequest } from './internal/sendRequest.js'

interface Button {
  /** Unique button identifier (maximum 256 characters) */
  id: string

  /** Text displayed on the button (maximum 20 characters) */
  title: string
}

interface SendButtonsMessageParams {
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

  /** Array of reply buttons (minimum 1, maximum 3) */
  buttons: Button[]

  /**
   * Optional header text (maximum 60 characters, cannot be used with other
   * header types)
   */
  headerText?: string

  /**
   * Optional image header using media ID or link (cannot be used with other
   * header types)
   */
  headerImage?: { id?: string; link?: string }

  /**
   * Optional video header using media ID or link (cannot be used with other
   * header types)
   */
  headerVideo?: { id?: string; link?: string }

  /**
   * Optional document header using media ID or link (cannot be used with other
   * header types)
   */
  headerDocument?: { id?: string; link?: string; filename?: string }

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
 * Helper function to send a WhatsApp message with interactive reply buttons
 * @param params - The parameters for sending a buttons message
 * @returns Promise with the API response
 */
export const sendButtonsMessage = async ({
  accessToken,
  from,
  to,
  bodyText,
  buttons,
  headerText,
  headerImage,
  headerVideo,
  headerDocument,
  footerText,
  bizOpaqueCallbackData,
  baseUrl,
}: SendButtonsMessageParams): Promise<CloudAPIResponse> => {
  // Validate that only one header type is provided
  const headerCount = [
    headerText,
    headerImage,
    headerVideo,
    headerDocument,
  ].filter(Boolean).length

  if (headerCount > 1) {
    throw new Error(
      'Only one header type can be specified (headerText, headerImage, headerVideo, or headerDocument)',
    )
  }

  // Validate button count
  if (buttons.length < 1 || buttons.length > 3) {
    throw new Error('Must provide between 1 and 3 buttons')
  }

  // Validate character limits
  if (bodyText.length > 1024) {
    throw new Error('Body text cannot exceed 1024 characters')
  }

  if (headerText && headerText.length > 60) {
    throw new Error('Header text cannot exceed 60 characters')
  }

  if (footerText && footerText.length > 60) {
    throw new Error('Footer text cannot exceed 60 characters')
  }

  // Validate button properties
  const buttonIds = new Set<string>()

  for (const button of buttons) {
    if (button.id.length > 256) {
      throw new Error('Button ID cannot exceed 256 characters')
    }

    if (button.title.length > 20) {
      throw new Error('Button title cannot exceed 20 characters')
    }

    if (buttonIds.has(button.id)) {
      throw new Error(`Duplicate button ID found: ${button.id}`)
    }

    buttonIds.add(button.id)
  }

  const message: CloudAPISendInteractiveButtonsMessageRequest = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: {
        text: bodyText,
      },
      action: {
        buttons: buttons.map((button) => ({
          type: 'reply',
          reply: {
            id: button.id,
            title: button.title,
          },
        })),
      },
    },
  }

  // Add header if provided
  if (headerText) {
    message.interactive.header = {
      type: 'text',
      text: headerText,
    }
  } else if (headerImage) {
    message.interactive.header = {
      type: 'image',
      image: headerImage,
    }
  } else if (headerVideo) {
    message.interactive.header = {
      type: 'video',
      video: headerVideo,
    }
  } else if (headerDocument) {
    message.interactive.header = {
      type: 'document',
      document: headerDocument,
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
