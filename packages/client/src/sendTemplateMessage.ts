import {
  CloudAPIResponse,
  CloudAPISendTemplateMessageRequest,
  CloudAPITemplateComponent,
} from '@whatsapp-cloudapi/types/cloudapi'
import { sendRequest } from './internal/sendRequest.js'

interface SendTemplateMessageParams {
  /** The access token for the WhatsApp Cloud API */
  accessToken: string
  /** The senders phone number ID (e.g. "1234567890") */
  from: string
  /**
   * The recipient's phone number with country code or phone number ID (e.g.
   * "+16505551234" or "5551234")
   */
  to: string
  /**
   * The name of the template to send
   * This must be an approved template name
   */
  templateName: string
  /**
   * The language code for the template (e.g. "en_US")
   * Must be a valid locale format supported by WhatsApp
   */
  languageCode: string
  /**
   * Optional language policy
   * When set to 'deterministic', messages are sent using the language and
   * locale code you specify
   * If not provided, WhatsApp will determine the language to use
   */
  languagePolicy?: 'deterministic'
  /**
   * Optional message ID to reply to
   * When provided, the template message will be sent as a reply to the
   * specified message
   */
  replyToMessageId?: string
  /**
   * Components for the template (header, body, buttons, etc.)
   * Use to customize the template with variable values
   *
   * Example:
   * ```typescript
   * [
   *   {
   *     type: "header",
   *     parameters: [
   *       {
   *         type: "image",
   *         image: {
   *           link: "https://example.com/image.jpg"
   *         }
   *       }
   *     ]
   *   },
   *   {
   *     type: "body",
   *     parameters: [
   *       {
   *         type: "text",
   *         text: "Hello World"
   *       }
   *     ]
   *   },
   *   {
   *     type: "button",
   *     sub_type: "quick_reply",
   *     index: "0",
   *     parameters: [
   *       {
   *         type: "payload",
   *         payload: "PAYLOAD_1"
   *       }
   *     ]
   *   }
   * ]
   * ```
   */
  components?: CloudAPITemplateComponent[]
  /**
   * An arbitrary string, useful for tracking
   * Maximum length: 512 characters
   */
  bizOpaqueCallbackData?: string
  /** Optional base URL for the API (defaults to Facebook Graph API, use http://localhost:4004 for emulator) */
  baseUrl?: string
}

/**
 * Helper function to send a WhatsApp template message
 * @param params - The parameters for sending a template message
 * @returns Promise with the API response
 *
 * @example
 * ```typescript
 * // Send a simple template message
 * await sendTemplateMessage({
 *   accessToken: "your-access-token",
 *   from: "1234567890",
 *   to: "+16505551234",
 *   templateName: "hello_world",
 *   languageCode: "en_US"
 * });
 *
 * // Send a template with deterministic language policy
 * await sendTemplateMessage({
 *   accessToken: "your-access-token",
 *   from: "1234567890",
 *   to: "+16505551234",
 *   templateName: "hello_world",
 *   languageCode: "en_US",
 *   languagePolicy: "deterministic"
 * });
 *
 * // Send a template as a reply to a previous message
 * await sendTemplateMessage({
 *   accessToken: "your-access-token",
 *   from: "1234567890",
 *   to: "+16505551234",
 *   templateName: "hello_world",
 *   languageCode: "en_US",
 *   replyToMessageId:
 *     "wamid.HBgLMTY1MDUwNzY1MjAVAgARGBI5QTNDQTVCM0Q0Q0Q2RTY3RTcA"
 * });
 *
 * // Send a template with components
 * await sendTemplateMessage({
 *   accessToken: "your-access-token",
 *   from: "1234567890",
 *   to: "+16505551234",
 *   templateName: "order_confirmation",
 *   languageCode: "en_US",
 *   components: [
 *     {
 *       type: "body",
 *       parameters: [
 *         {
 *           type: "text",
 *           text: "John"
 *         },
 *         {
 *           type: "currency",
 *           currency: {
 *             code: "USD",
 *             amount_1000: 10990,
 *             fallback_value: "$10.99"
 *           }
 *         }
 *       ]
 *     }
 *   ]
 * });
 * ```
 */
export const sendTemplateMessage = async ({
  accessToken,
  from,
  to,
  templateName,
  languageCode,
  languagePolicy,
  replyToMessageId,
  components,
  bizOpaqueCallbackData,
  baseUrl,
}: SendTemplateMessageParams): Promise<CloudAPIResponse> => {
  const message: CloudAPISendTemplateMessageRequest = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: {
        code: languageCode,
        ...(languagePolicy && { policy: languagePolicy }),
      },
    },
  }

  if (replyToMessageId) {
    message.context = {
      message_id: replyToMessageId,
    }
  }

  if (components) {
    message.template.components = components
  }

  if (bizOpaqueCallbackData) {
    message.biz_opaque_callback_data = bizOpaqueCallbackData
  }

  return sendRequest(accessToken, from, message, baseUrl)
}
