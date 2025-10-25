// Ref: https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages/
// Ref: https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-message-templates/
// Ref: https://developers.facebook.com/docs/whatsapp/cloud-api/reference/media

/**
 * Base interface for common message request properties
 */
export interface CloudAPIMessageRequestBase {
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
   * Maximum length: 512 characters
   */
  biz_opaque_callback_data?: string

  /**
   * WhatsApp ID or phone number of the recipient
   * Phone numbers must include the country code
   * @example "+16505551234"
   */
  to: string
}

/**
 * Request body for sending an image message
 */
export interface CloudAPISendImageMessageRequest
  extends CloudAPIMessageRequestBase {
  /**
   * Type of message
   * Set to 'image' for image messages
   */
  type: 'image'

  /**
   * The image message content
   */
  image: {
    /**
     * Media ID of the uploaded image
     * Obtained from the media upload endpoint
     */
    id: string

    /**
     * Optional caption for the image
     * Maximum length: 1024 characters
     */
    caption?: string
  }
}

/**
 * Request body for sending a text message
 */
export interface CloudAPISendTextMessageRequest
  extends CloudAPIMessageRequestBase {
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
     * If true, WhatsApp will attempt to render a preview of the first URL in
     * the body text
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
    | 'location'

  /**
   * Text parameter
   * Used when type='text'
   */
  text?: string

  /**
   * Parameter name for named parameters in templates
   * Used when implementing named parameters in template's body text
   */
  parameter_name?: string

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
   * Location parameter
   * Used when type='location'
   */
  location?: {
    /**
     * Location latitude
     */
    latitude: string
    /**
     * Location longitude
     */
    longitude: string
    /**
     * Name that will appear below the map
     */
    name?: string
    /**
     * Address that will appear after the name
     */
    address?: string
  }

  /**
   * Payload parameter for buttons
   * Used when type='payload'
   */
  payload?: string

  /**
   * OTP code for authentication templates (v23.0)
   * Used when implementing one-tap or zero-tap authentication
   */
  code?: string

  /**
   * Button configuration for authentication templates (v23.0)
   */
  button?: {
    /** Button type for authentication */
    type: 'otp'
    /** OTP type: copy_code or one_tap */
    otp_type?: 'copy_code' | 'one_tap'
    /** Text shown on the button */
    text?: string
    /** Autofill text for one-tap */
    autofill_text?: string
    /** Zero-tap terms acceptance */
    zero_tap_terms_accepted?: boolean
    /** Supported apps for authentication */
    supported_apps?: {
      /** Android package name */
      package_name: string
      /** App signature hash */
      signature_hash: string
    }[]
  }
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
 * Reply button for interactive button messages
 */
export interface CloudAPIReplyButton {
  /**
   * Button type
   * Must be 'reply' for reply buttons
   */
  type: 'reply'

  /**
   * Button reply configuration
   */
  reply: {
    /**
     * Unique button identifier
     * Maximum 256 characters
     * Used to identify which button was clicked
     */
    id: string

    /**
     * Text displayed on the button
     * Maximum 20 characters
     */
    title: string
  }
}

/**
 * List item row for interactive list messages
 */
export interface CloudAPIListRow {
  /**
   * Unique row identifier
   * Maximum 200 characters
   * Used to identify which item was selected
   */
  id: string

  /**
   * Title text for the row
   * Maximum 24 characters
   */
  title: string

  /**
   * Optional description for the row
   * Maximum 72 characters
   */
  description?: string
}

/**
 * Section for organizing list items
 */
export interface CloudAPIListSection {
  /**
   * Optional section title
   * Maximum 24 characters
   */
  title?: string

  /**
   * Array of rows in this section
   * Maximum 10 rows across all sections
   */
  rows: CloudAPIListRow[]
}

/**
 * Base interface for message requests that support context
 * (replying to messages)
 */
export interface CloudAPIMessageRequestWithContext
  extends CloudAPIMessageRequestBase {
  /**
   * The context of a previous message to reply to
   */
  context?: {
    /**
     * The message ID of the message being replied to
     */
    message_id: string
  }
}

/**
 * Request body for sending a template message
 */
export interface CloudAPISendTemplateMessageRequest
  extends CloudAPIMessageRequestWithContext {
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
       * When set to 'deterministic', messages are sent using the exact
       * language and locale code you specify
       * If not specified, WhatsApp determines which language to use when the
       * template is available in multiple languages
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

/**
 * Request body for sending an interactive CTA URL message
 */
export interface CloudAPISendInteractiveCTAURLRequest
  extends CloudAPIMessageRequestWithContext {
  /**
   * Type of message
   * Set to 'interactive' for interactive messages
   */
  type: 'interactive'

  /**
   * The interactive message content
   */
  interactive: {
    /**
     * Type of interactive message
     * Set to 'cta_url' for call-to-action URL messages
     */
    type: 'cta_url'

    /**
     * Optional header content
     * Only one header type can be used per message
     * Currently only text and image headers are supported
     */
    header?:
      | {
          type: 'text'
          /**
           * Header text content
           * Maximum 60 characters
           */
          text: string
        }
      | {
          type: 'image'
          image: {
            /**
             * Media ID of the uploaded image
             * Obtained from the media upload endpoint
             */
            id: string
          }
        }

    /**
     * Required message body
     */
    body: {
      /**
       * Body text content
       * Maximum 1024 characters
       * URLs are automatically hyperlinked
       */
      text: string
    }

    /**
     * Optional footer content
     */
    footer?: {
      /**
       * Footer text content
       * Maximum 60 characters
       * URLs are automatically hyperlinked
       */
      text: string
    }

    /**
     * Required action with CTA URL button
     */
    action: {
      /**
       * Action name
       * Must be 'cta_url' for CTA URL messages
       */
      name: 'cta_url'

      /**
       * Action parameters
       */
      parameters: {
        /**
         * Text displayed on the CTA button
         * Maximum 20 characters
         */
        display_text: string

        /**
         * URL to open when button is tapped
         * Must start with http:// or https://
         * Must include a hostname (IP addresses not supported)
         */
        url: string
      }
    }
  }
}

/**
 * Request body for sending a WhatsApp Flow message (v23.0)
 */
export interface CloudAPISendFlowMessageRequest
  extends CloudAPIMessageRequestBase {
  /**
   * Type of message
   * Set to 'interactive' for flow messages
   */
  type: 'interactive'

  /**
   * The interactive flow message content
   */
  interactive: {
    /**
     * Type of interactive message
     * Set to 'flow' for WhatsApp Flow messages
     */
    type: 'flow'

    /**
     * Optional header content
     */
    header?: {
      type: 'text' | 'image' | 'video' | 'document'
      text?: string
      image?: { id?: string; link?: string }
      video?: { id?: string; link?: string }
      document?: { id?: string; link?: string; filename?: string }
    }

    /**
     * Required message body
     */
    body: {
      /**
       * Body text content
       * Maximum 1024 characters
       */
      text: string
    }

    /**
     * Optional footer content
     */
    footer?: {
      /**
       * Footer text content
       * Maximum 60 characters
       */
      text: string
    }

    /**
     * Required flow action configuration
     */
    action: {
      /**
       * Action name
       * Must be 'flow' for flow messages
       */
      name: 'flow'

      /**
       * Flow parameters
       */
      parameters: {
        /**
         * Flow message version
         * Currently only version 3 is supported
         */
        flow_message_version: '3'

        /**
         * Token for flow session
         */
        flow_token: string

        /**
         * Unique ID of the flow
         */
        flow_id: string

        /**
         * Call-to-action text on the button
         */
        flow_cta: string

        /**
         * Type of flow action
         */
        flow_action: 'navigate' | 'data_exchange'

        /**
         * Payload for flow action
         */
        flow_action_payload?: {
          /**
           * Screen to navigate to
           */
          screen?: string

          /**
           * Additional data to pass to the flow
           */
          data?: Record<string, unknown>
        }
      }
    }
  }
}

/**
 * Request body for sending an interactive buttons message
 */
export interface CloudAPISendInteractiveButtonsMessageRequest
  extends CloudAPIMessageRequestWithContext {
  /**
   * Type of message
   * Set to 'interactive' for interactive messages
   */
  type: 'interactive'

  /**
   * The interactive message content
   */
  interactive: {
    /**
     * Type of interactive message
     * Set to 'button' for reply buttons messages
     */
    type: 'button'

    /**
     * Optional header content
     * Only one header type can be used per message
     */
    header?:
      | {
          type: 'text'
          /**
           * Header text content
           * Maximum 60 characters
           */
          text: string
        }
      | {
          type: 'image'
          image: {
            /**
             * Media ID of the uploaded image
             * Only one of id or link should be provided
             */
            id?: string
            /**
             * Link to the image
             * Only one of id or link should be provided
             */
            link?: string
          }
        }
      | {
          type: 'video'
          video: {
            /**
             * Media ID of the uploaded video
             * Only one of id or link should be provided
             */
            id?: string
            /**
             * Link to the video
             * Only one of id or link should be provided
             */
            link?: string
          }
        }
      | {
          type: 'document'
          document: {
            /**
             * Media ID of the uploaded document
             * Only one of id or link should be provided
             */
            id?: string
            /**
             * Link to the document
             * Only one of id or link should be provided
             */
            link?: string
            /**
             * Filename for the document
             */
            filename?: string
          }
        }

    /**
     * Required message body
     */
    body: {
      /**
       * Body text content
       * Maximum 1024 characters
       * URLs are automatically hyperlinked
       */
      text: string
    }

    /**
     * Optional footer content
     */
    footer?: {
      /**
       * Footer text content
       * Maximum 60 characters
       * URLs are automatically hyperlinked
       */
      text: string
    }

    /**
     * Required action with reply buttons
     */
    action: {
      /**
       * Array of reply buttons
       * Minimum 1 button, maximum 3 buttons
       */
      buttons: CloudAPIReplyButton[]
    }
  }
}

/**
 * Request body for sending an interactive list message
 */
export interface CloudAPISendInteractiveListMessageRequest
  extends CloudAPIMessageRequestWithContext {
  /**
   * Type of message
   * Set to 'interactive' for interactive messages
   */
  type: 'interactive'

  /**
   * The interactive message content
   */
  interactive: {
    /**
     * Type of interactive message
     * Set to 'list' for list messages
     */
    type: 'list'

    /**
     * Optional header content
     */
    header?: {
      type: 'text'
      /**
       * Header text content
       * Maximum 60 characters
       */
      text: string
    }

    /**
     * Required message body
     */
    body: {
      /**
       * Body text content
       * Maximum 1024 characters
       * URLs are automatically hyperlinked
       */
      text: string
    }

    /**
     * Optional footer content
     */
    footer?: {
      /**
       * Footer text content
       * Maximum 60 characters
       * URLs are automatically hyperlinked
       */
      text: string
    }

    /**
     * Required action with list configuration
     */
    action: {
      /**
       * Button text to open the list
       * Maximum 20 characters
       */
      button: string

      /**
       * Array of sections containing list items
       * Minimum 1 section, maximum 10 rows total across all sections
       */
      sections: CloudAPIListSection[]
    }
  }
}

/**
 * Request body for sending a reaction message (v23.0)
 */
export interface CloudAPISendReactionMessageRequest
  extends CloudAPIMessageRequestBase {
  /**
   * Type of message
   * Set to 'reaction' for reaction messages
   */
  type: 'reaction'

  /**
   * The reaction content
   */
  reaction: {
    /**
     * ID of the message to react to
     */
    message_id: string

    /**
     * Emoji to use as reaction
     * Send empty string to remove reaction
     */
    emoji: string
  }
}

/**
 * Request body for marking a message as read
 */
export interface CloudAPIMarkMessageReadRequest {
  /**
   * Identifier for the messaging service
   * Always set to 'whatsapp'
   */
  messaging_product: 'whatsapp'

  /**
   * Status to set
   * Must be 'read' to mark message as read
   */
  status: 'read'

  /**
   * ID of the message to mark as read
   */
  message_id: string
}

export type CloudAPIRequest =
  | CloudAPISendTextMessageRequest
  | CloudAPISendTemplateMessageRequest
  | CloudAPISendImageMessageRequest
  | CloudAPISendInteractiveCTAURLRequest
  | CloudAPISendInteractiveButtonsMessageRequest
  | CloudAPISendInteractiveListMessageRequest
  | CloudAPISendFlowMessageRequest
  | CloudAPISendReactionMessageRequest
