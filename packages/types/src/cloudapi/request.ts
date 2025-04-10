// Ref: https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages/

/**
 * Request body for sending a text message
 */
export interface CloudAPISendTextMessageRequest {
  /**
   * Identifier for the messaging service
   * Always set to 'whatsapp'
   */
  messaging_product: 'whatsapp'

  /**
   * Type of recipient
   * Currently only supports individual recipients
   */
  recipient_type?: 'individual'

  /**
   * An arbitrary string, useful for tracking.
   */
  biz_opaque_callback_data?: string

  /**
   * WhatsApp ID or phone number of the recipient
   * Phone numbers must include the country code
   * @example "+16505551234"
   */
  to: string

  /**
   * Type of message
   * Set to 'text' for text messages
   */
  type: 'text'

  /**
   * The text message content
   */
  text: {
    /**
     * Whether to enable link preview for URLs in the message
     * If true, WhatsApp will attempt to render a preview of the first URL in the body text
     * URLs must begin with http:// or https://
     * If multiple URLs are present, only the first one will be previewed
     */
    preview_url?: boolean

    /**
     * The text content of the message
     * Maximum length: 4096 characters
     * Can include URLs which will be clickable
     */
    body: string
  }
}

/**
 * Parameter interface for template components
 */
export interface CloudAPITemplateParameter {
  /**
   * The type of parameter
   */
  type:
    | 'text'
    | 'currency'
    | 'date_time'
    | 'image'
    | 'document'
    | 'video'
    | 'payload'

  /**
   * Text parameter
   * Used when type='text'
   */
  text?: string

  /**
   * Currency parameter
   * Used when type='currency'
   */
  currency?: {
    /**
     * The currency code (e.g., "USD")
     */
    code: string
    /**
     * The amount in thousands
     * e.g., 10.99 would be represented as 10990
     */
    amount_1000: number
    /**
     * Fallback value if localization fails
     */
    fallback_value: string
  }

  /**
   * Date time parameter
   * Used when type='date_time'
   */
  date_time?: {
    /**
     * The fallback value for the date time
     * Format: "MONTH DAY, YEAR"
     */
    fallback_value: string
  }

  /**
   * Image parameter
   * Used when type='image'
   */
  image?: {
    /**
     * ID of the image
     * Only one of id or link should be provided
     */
    id?: string
    /**
     * Link to the image
     * Only one of id or link should be provided
     */
    link?: string
  }

  /**
   * Document parameter
   * Used when type='document'
   */
  document?: {
    /**
     * ID of the document
     * Only one of id or link should be provided
     */
    id?: string
    /**
     * Link to the document
     * Only one of id or link should be provided
     */
    link?: string
    /**
     * Caption for the document
     */
    caption?: string
    /**
     * Filename for the document
     */
    filename?: string
  }

  /**
   * Video parameter
   * Used when type='video'
   */
  video?: {
    /**
     * ID of the video
     * Only one of id or link should be provided
     */
    id?: string
    /**
     * Link to the video
     * Only one of id or link should be provided
     */
    link?: string
    /**
     * Caption for the video
     */
    caption?: string
  }

  /**
   * Payload parameter for buttons
   * Used when type='payload'
   */
  payload?: string
}

/**
 * Component of a template message
 */
export interface CloudAPITemplateComponent {
  /**
   * The type of component
   * - header: The header of the message
   * - body: The body of the message
   * - footer: The footer of the message
   * - button: Interactive buttons
   */
  type: 'header' | 'body' | 'footer' | 'button'

  /**
   * Sub-type of the component
   * Only used when type='button'
   * - quick_reply: Quick reply button
   * - url: URL button
   * - call_to_action: Call to action button
   */
  sub_type?: 'quick_reply' | 'url' | 'call_to_action'

  /**
   * Index of the button
   * Only used when type='button'
   * Must match the index of the button in the template
   */
  index?: string | number

  /**
   * Parameters for the component
   * Different parameters are needed depending on the component type
   */
  parameters: CloudAPITemplateParameter[]
}

/**
 * Request body for sending a template message
 */
export interface CloudAPISendTemplateMessageRequest {
  /**
   * Identifier for the messaging service
   * Always set to 'whatsapp'
   */
  messaging_product: 'whatsapp'

  /**
   * Type of recipient
   * Currently only supports individual recipients
   */
  recipient_type?: 'individual'

  /**
   * The context of a previous message to reply to
   */
  context?: {
    /**
     * The message ID of the message being replied to
     */
    message_id: string
  }

  /**
   * An arbitrary string, useful for tracking.
   * Maximum length: 512 characters
   */
  biz_opaque_callback_data?: string

  /**
   * WhatsApp ID or phone number of the recipient
   * Phone numbers must include the country code
   * @example "+16505551234"
   */
  to: string

  /**
   * Type of message
   * Set to 'template' for template messages
   */
  type: 'template'

  /**
   * The template message content
   */
  template: {
    /**
     * The name of the template
     * Must be an approved template name
     */
    name: string

    /**
     * The language of the template
     */
    language: {
      /**
       * The language and locale code (e.g., "en_US")
       * Required field
       */
      code: string

      /**
       * Language policy
       * When set to 'deterministic', messages are sent using the exact language and locale code you specify
       * If not specified, WhatsApp determines which language to use when the template is available in multiple languages
       */
      policy?: 'deterministic'
    }

    /**
     * The components of the template
     * Use to customize the template with variable values
     */
    components?: CloudAPITemplateComponent[]
  }
}

export type CloudAPIRequest =
  | CloudAPISendTextMessageRequest
  | CloudAPISendTemplateMessageRequest
