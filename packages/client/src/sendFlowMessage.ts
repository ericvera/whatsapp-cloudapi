import {
  CloudAPIResponse,
  CloudAPISendFlowMessageRequest,
} from '@whatsapp-cloudapi/types/cloudapi'
import { sendRequest } from './internal/sendRequest.js'

interface SendFlowMessageParams {
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
  /** Token for flow session */
  flowToken: string
  /** Unique ID of the flow */
  flowId: string
  /** Call-to-action text on the button */
  flowCta: string
  /** Type of flow action */
  flowAction: 'navigate' | 'data_exchange'
  /** Screen to navigate to (required for navigate action) */
  screen?: string
  /** Additional data to pass to the flow */
  data?: Record<string, unknown>
  /**
   * Optional header text (maximum 60 characters, cannot be used with other
   * header types)
   */
  headerText?: string
  /**
   * Optional image header using media ID (cannot be used with other header
   * types)
   */
  headerImage?: { id?: string; link?: string }
  /**
   * Optional video header using media ID (cannot be used with other header
   * types)
   */
  headerVideo?: { id?: string; link?: string }
  /**
   * Optional document header using media ID (cannot be used with other header
   * types)
   */
  headerDocument?: { id?: string; link?: string; filename?: string }
  /** Optional footer text (maximum 60 characters) */
  footerText?: string
  /** An arbitrary string, useful for tracking */
  bizOpaqueCallbackData?: string
  /** Optional base URL for the API (defaults to Facebook Graph API, use http://localhost:4004 for emulator) */
  baseUrl?: string
}

/**
 * Helper function to send a WhatsApp Flow message
 * @param params - The parameters for sending a flow message
 * @returns Promise with the API response
 */
export const sendFlowMessage = async ({
  accessToken,
  from,
  to,
  bodyText,
  flowToken,
  flowId,
  flowCta,
  flowAction,
  screen,
  data,
  headerText,
  headerImage,
  headerVideo,
  headerDocument,
  footerText,
  bizOpaqueCallbackData,
  baseUrl,
}: SendFlowMessageParams): Promise<CloudAPIResponse> => {
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

  // Validate required screen parameter for navigate action
  if (flowAction === 'navigate' && !screen) {
    throw new Error('Screen parameter is required for navigate flow action')
  }

  const message: CloudAPISendFlowMessageRequest = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive: {
      type: 'flow',
      body: {
        text: bodyText,
      },
      action: {
        name: 'flow',
        parameters: {
          flow_message_version: '3',
          flow_token: flowToken,
          flow_id: flowId,
          flow_cta: flowCta,
          flow_action: flowAction,
        },
      },
    },
  }

  // Add flow action payload if screen or data is provided
  if (screen || data) {
    message.interactive.action.parameters.flow_action_payload = {
      ...(screen && { screen }),
      ...(data && { data }),
    }
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
