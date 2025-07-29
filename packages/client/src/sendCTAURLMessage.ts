import {
  CloudAPIResponse,
  CloudAPISendInteractiveCTAURLRequest,
} from '@whatsapp-cloudapi/types/cloudapi'
import { sendRequest } from './internal/sendRequest.js'

interface SendCTAURLMessageParams {
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
  /** The text displayed on the CTA button (maximum 20 characters) */
  buttonText: string
  /**
   * The URL to open when button is tapped (must start with http:// or https://)
   */
  url: string
  /**
   * Optional header text (maximum 60 characters, cannot be used with other
   * header types)
   */
  headerText?: string
  /**
   * Optional image header using media ID (cannot be used with other header
   * types)
   */
  headerImage?: { id: string }
  /** Optional footer text (maximum 60 characters) */
  footerText?: string
  /** An arbitrary string, useful for tracking */
  bizOpaqueCallbackData?: string
  /** Optional base URL for the API (defaults to Facebook Graph API, use http://localhost:4004 for emulator) */
  baseUrl?: string
}

/**
 * Helper function to send a WhatsApp CTA URL message
 * @param params - The parameters for sending a CTA URL message
 * @returns Promise with the API response
 */
export const sendCTAURLMessage = async ({
  accessToken,
  from,
  to,
  bodyText,
  buttonText,
  url,
  headerText,
  headerImage,
  footerText,
  bizOpaqueCallbackData,
  baseUrl,
}: SendCTAURLMessageParams): Promise<CloudAPIResponse> => {
  // Validate that only one header type is provided
  const headerCount = [headerText, headerImage].filter(Boolean).length
  if (headerCount > 1) {
    throw new Error(
      'Only one header type can be specified (headerText or headerImage)',
    )
  }

  // Validate character limits
  if (bodyText.length > 1024) {
    throw new Error('Body text cannot exceed 1024 characters')
  }
  if (buttonText.length > 20) {
    throw new Error('Button text cannot exceed 20 characters')
  }
  if (headerText && headerText.length > 60) {
    throw new Error('Header text cannot exceed 60 characters')
  }
  if (footerText && footerText.length > 60) {
    throw new Error('Footer text cannot exceed 60 characters')
  }

  // Validate URL format and ensure it's not an IP address
  try {
    const urlObj = new URL(url)

    // Check if protocol is HTTP or HTTPS
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      throw new Error('URL must use http:// or https:// protocol')
    }

    // Check if hostname is an IP address (IPv4 or IPv6)
    const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/

    // Check for IPv6 by looking for colons (IPv6 addresses contain colons)
    const hasColons = urlObj.hostname.includes(':')

    if (ipv4Pattern.test(urlObj.hostname) || hasColons) {
      throw new Error('URL hostname cannot be an IP address')
    }
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Invalid URL format')
    }
    throw error
  }

  const message: CloudAPISendInteractiveCTAURLRequest = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive: {
      type: 'cta_url',
      body: {
        text: bodyText,
      },
      action: {
        name: 'cta_url',
        parameters: {
          display_text: buttonText,
          url,
        },
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
      image: { id: headerImage.id },
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
