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
   * - 'individual': Message to a single recipient
   * - 'group': Message to a group
   *
   * Required by the v25.0 Messages reference (the API defaults it to
   * `'individual'` when omitted).
   */
  recipient_type: 'individual' | 'group'

  /**
   * An arbitrary string, useful for tracking.
   * Maximum length: 512 characters
   */
  biz_opaque_callback_data?: string

  /**
   * WhatsApp ID or phone number of the recipient
   * Phone numbers must include the country code
   * Optional only when `recipient` (a business-scoped user ID) is provided
   * instead. If both are set, `to` takes precedence. The "at least one of
   * `to` / `recipient`" rule is enforced by {@link CloudAPIRecipientAddressing}
   * on {@link CloudAPIRequest}.
   * @example "+16505551234"
   */
  to?: string

  /**
   * Business-scoped user ID (BSUID) of the recipient
   * Use this to send to a user who has hidden their phone number behind a
   * WhatsApp username. May be combined with `to`, in which case `to` takes
   * precedence. Not supported for one-tap/zero-tap/copy-code authentication
   * templates.
   * @example "US.13491208655302741918"
   */
  recipient?: string

  /**
   * The context of a previous message to reply to.
   * Available on every message type (a top-level field of the message object).
   */
  context?: {
    /**
     * The message ID of the message being replied to
     */
    message_id: string
  }

  /**
   * Controls whether event activity is shared for each message
   * This parameter will override the WhatsApp Business Account level setting
   * for MM Lite API and the Business level setting for Cloud API
   */
  message_activity_sharing?: boolean
}

/**
 * Request body for sending an image message
 */
export interface CloudAPISendImageMessageRequest extends CloudAPIMessageRequestBase {
  /**
   * Type of message
   * Set to 'image' for image messages
   */
  type: 'image'

  /**
   * The image message content
   * Provide exactly one of `id` (uploaded media) or `link` (public URL).
   */
  image: {
    /**
     * Media ID of the uploaded image
     * Obtained from the media upload endpoint. One of `id` / `link` required.
     */
    id?: string

    /**
     * Public URL of the image to send
     * One of `id` / `link` is required.
     */
    link?: string

    /**
     * Optional caption for the image
     * Maximum length: 1024 characters
     */
    caption?: string
  }
}

/**
 * Request body for sending an audio message
 */
export interface CloudAPISendAudioMessageRequest extends CloudAPIMessageRequestBase {
  /**
   * Type of message
   * Set to 'audio' for audio messages
   */
  type: 'audio'

  /**
   * The audio message content
   */
  audio: {
    /**
     * Media ID of the uploaded audio
     * Only one of id or link should be provided
     */
    id?: string

    /**
     * URL of the audio file
     * Only one of id or link should be provided
     */
    link?: string
  }
}

/**
 * Request body for sending a video message
 */
export interface CloudAPISendVideoMessageRequest extends CloudAPIMessageRequestBase {
  /**
   * Type of message
   * Set to 'video' for video messages
   */
  type: 'video'

  /**
   * The video message content
   */
  video: {
    /**
     * Media ID of the uploaded video
     * Only one of id or link should be provided
     */
    id?: string

    /**
     * URL of the video file
     * Only one of id or link should be provided
     */
    link?: string

    /**
     * Optional caption for the video
     * Maximum length: 1024 characters
     */
    caption?: string
  }
}

/**
 * Request body for sending a document message
 */
export interface CloudAPISendDocumentMessageRequest extends CloudAPIMessageRequestBase {
  /**
   * Type of message
   * Set to 'document' for document messages
   */
  type: 'document'

  /**
   * The document message content
   */
  document: {
    /**
     * Media ID of the uploaded document
     * Only one of id or link should be provided
     */
    id?: string

    /**
     * URL of the document file
     * Only one of id or link should be provided
     */
    link?: string

    /**
     * Optional caption for the document
     * Maximum length: 1024 characters
     */
    caption?: string

    /**
     * Filename to be used for the document
     */
    filename?: string
  }
}

/**
 * Request body for sending a sticker message
 */
export interface CloudAPISendStickerMessageRequest extends CloudAPIMessageRequestBase {
  /**
   * Type of message
   * Set to 'sticker' for sticker messages
   */
  type: 'sticker'

  /**
   * The sticker message content
   */
  sticker: {
    /**
     * Media ID of the uploaded sticker
     * Only one of id or link should be provided
     */
    id?: string

    /**
     * URL of the sticker file
     * Only one of id or link should be provided
     */
    link?: string
  }
}

/**
 * Request body for sending a location message
 */
export interface CloudAPISendLocationMessageRequest extends CloudAPIMessageRequestBase {
  /**
   * Type of message
   * Set to 'location' for location messages
   */
  type: 'location'

  /**
   * The location message content
   */
  location: {
    /**
     * Latitude of the location
     */
    latitude: number

    /**
     * Longitude of the location
     */
    longitude: number

    /**
     * Name of the location
     */
    name?: string

    /**
     * Address of the location
     */
    address?: string
  }
}

/**
 * Contact name object for contacts message
 */
export interface CloudAPIContactName {
  /**
   * Formatted full name
   */
  formatted_name: string

  /**
   * First name
   */
  first_name?: string

  /**
   * Last name
   */
  last_name?: string

  /**
   * Middle name
   */
  middle_name?: string

  /**
   * Name prefix
   */
  prefix?: string

  /**
   * Name suffix
   */
  suffix?: string
}

/**
 * Contact phone object for contacts message
 */
export interface CloudAPIContactPhone {
  /**
   * Phone number
   */
  phone: string

  /**
   * Phone type
   */
  type?: 'HOME' | 'WORK'

  /**
   * WhatsApp ID
   */
  wa_id?: string
}

/**
 * Contact email object for contacts message
 */
export interface CloudAPIContactEmail {
  /**
   * Email address
   */
  email: string

  /**
   * Email type
   */
  type?: 'HOME' | 'WORK'
}

/**
 * Contact address object for contacts message
 */
export interface CloudAPIContactAddress {
  /**
   * Street address
   */
  street?: string

  /**
   * City name
   */
  city?: string

  /**
   * State abbreviation
   */
  state?: string

  /**
   * ZIP code
   */
  zip?: string

  /**
   * Full country name
   */
  country?: string

  /**
   * Two-letter ISO country code
   */
  country_code?: string

  /**
   * Address type
   */
  type?: 'HOME' | 'WORK'
}

/**
 * Contact URL object for contacts message
 */
export interface CloudAPIContactUrl {
  /**
   * URL
   */
  url: string

  /**
   * URL type
   */
  type?: 'HOME' | 'WORK'
}

/**
 * Contact organization object for contacts message
 */
export interface CloudAPIContactOrg {
  /**
   * Company name
   */
  company?: string

  /**
   * Department name
   */
  department?: string

  /**
   * Job title
   */
  title?: string
}

/**
 * Contact object for contacts message
 */
export interface CloudAPIContact {
  /**
   * Contact name (required)
   */
  name: CloudAPIContactName

  /**
   * Contact phone numbers
   */
  phones?: CloudAPIContactPhone[]

  /**
   * Contact email addresses
   */
  emails?: CloudAPIContactEmail[]

  /**
   * Contact addresses
   */
  addresses?: CloudAPIContactAddress[]

  /**
   * Contact URLs
   */
  urls?: CloudAPIContactUrl[]

  /**
   * Contact organization
   */
  org?: CloudAPIContactOrg

  /**
   * Contact birthday (YYYY-MM-DD format)
   */
  birthday?: string
}

/**
 * Request body for sending a contacts message
 */
export interface CloudAPISendContactsMessageRequest extends CloudAPIMessageRequestBase {
  /**
   * Type of message
   * Set to 'contacts' for contacts messages
   */
  type: 'contacts'

  /**
   * Array of contact objects
   */
  contacts: CloudAPIContact[]
}

/**
 * Request body for sending a text message
 */
export interface CloudAPISendTextMessageRequest extends CloudAPIMessageRequestBase {
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
   * OTP code for authentication templates
   * Used when implementing one-tap or zero-tap authentication
   */
  code?: string

  /**
   * Button configuration for authentication templates
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
 * Base interface for message requests that support context (replying to
 * messages).
 *
 * @deprecated `context` is now available on every message request via
 * {@link CloudAPIMessageRequestBase}. This alias is retained for backward
 * compatibility and is equivalent to `CloudAPIMessageRequestBase`.
 */
export type CloudAPIMessageRequestWithContext = CloudAPIMessageRequestBase

/**
 * Request body for sending a template message
 */
export interface CloudAPISendTemplateMessageRequest extends CloudAPIMessageRequestBase {
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
export interface CloudAPISendInteractiveCTAURLRequest extends CloudAPIMessageRequestBase {
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
 * Request body for sending a WhatsApp Flow message
 */
export interface CloudAPISendFlowMessageRequest extends CloudAPIMessageRequestBase {
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
      type: 'text' | 'image' | 'video' | 'gif' | 'document'
      text?: string
      sub_text?: string
      image?: { id?: string; link?: string }
      video?: { id?: string; link?: string }
      gif?: { id?: string; link?: string }
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
         * Optional - defaults to unused
         */
        flow_token?: string

        /**
         * Unique ID of the flow
         * Required unless flow_name is set
         * Cannot be used with flow_name parameter
         */
        flow_id?: string

        /**
         * The name of the Flow
         * Required unless flow_id is set
         * Cannot be used with flow_id parameter
         * Note: Changing the Flow name will require updating this parameter
         */
        flow_name?: string

        /**
         * Call-to-action text on the button
         * Maximum 30 characters recommended (no emoji)
         */
        flow_cta: string

        /**
         * The current mode of the Flow
         * Default: published
         */
        mode?: 'draft' | 'published'

        /**
         * Type of flow action
         * Default: navigate
         */
        flow_action?: 'navigate' | 'data_exchange'

        /**
         * Payload for flow action
         * Optional only if flow_action is navigate
         */
        flow_action_payload?: {
          /**
           * Screen to navigate to
           * Default: FIRST_ENTRY_SCREEN
           */
          screen?: string

          /**
           * Additional data to pass to the flow
           * Must be a non-empty object
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
export interface CloudAPISendInteractiveButtonsMessageRequest extends CloudAPIMessageRequestBase {
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
          /**
           * Optional sub-text for the header
           * Maximum 60 characters
           */
          sub_text?: string
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
          type: 'gif'
          gif: {
            /**
             * Media ID of the uploaded gif
             * Only one of id or link should be provided
             */
            id?: string
            /**
             * Link to the gif
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
export interface CloudAPISendInteractiveListMessageRequest extends CloudAPIMessageRequestBase {
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
 * Request body for sending a reaction message
 */
export interface CloudAPISendReactionMessageRequest extends CloudAPIMessageRequestBase {
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
 * Request body for sending a call permission request message
 */
export interface CloudAPISendCallPermissionRequestMessageRequest extends CloudAPIMessageRequestBase {
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
     * Set to 'call_permission_request' to request call permissions
     */
    type: 'call_permission_request'

    /**
     * Required message body
     */
    body: {
      /**
       * Body text content explaining why you want to call
       * Maximum 1024 characters
       */
      text: string
    }

    /**
     * Required action for call permission request
     */
    action: {
      /**
       * Action name
       * Must be 'call_permission_request'
       */
      name: 'call_permission_request'
    }
  }
}

/**
 * Request body for sending a catalog message
 */
export interface CloudAPISendCatalogMessageRequest extends CloudAPIMessageRequestBase {
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
     * Set to 'catalog_message' for catalog messages
     */
    type: 'catalog_message'

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
     * Required action for catalog message
     */
    action: {
      /**
       * Action name
       * Must be 'catalog_message'
       */
      name: 'catalog_message'

      /**
       * Action parameters
       */
      parameters: {
        /**
         * Product retailer ID to use as thumbnail
         */
        thumbnail_product_retailer_id: string
      }
    }
  }
}

/**
 * Request body for sending a request-contact-info interactive message
 * Asks the user to share their phone number. Typically sent to a
 * business-scoped user ID (set `recipient`). The button cannot be customized,
 * so no parameters are required.
 * Ref: https://developers.facebook.com/docs/whatsapp/business-scoped-user-ids/
 */
export interface CloudAPISendRequestContactInfoMessageRequest extends CloudAPIMessageRequestBase {
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
     * Set to 'contact_request' to request the user's contact information
     */
    type: 'contact_request'

    /**
     * Required message body
     */
    body: {
      /**
       * Body text content explaining why you need their contact info
       * Maximum 1024 characters
       */
      text: string
    }

    /**
     * Required action for the contact-info request
     */
    action: {
      /**
       * Action name
       * Must be 'request_contact_info'
       */
      name: 'request_contact_info'
    }
  }
}

/**
 * Request body for marking a message as read
 * Ref: https://developers.facebook.com/docs/whatsapp/cloud-api/typing-indicators/
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

  /**
   * Optional typing indicator to show while preparing response
   * The typing indicator will be dismissed after 25 seconds or when you
   * send a message, whichever comes first
   */
  typing_indicator?: {
    /**
     * Type of typing indicator
     * Currently only 'text' is supported
     */
    type: 'text'
  }
}

/**
 * Request body for sending a single-product interactive message
 * Shares one product from a connected catalog.
 * Ref: https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages
 */
export interface CloudAPISendProductMessageRequest extends CloudAPIMessageRequestBase {
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
     * Set to 'product' for a single-product message
     */
    type: 'product'

    /**
     * Optional message body
     */
    body?: {
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
     * Required action identifying the catalog product to share
     */
    action: {
      /**
       * ID of the catalog connected to the WhatsApp Business Account
       */
      catalog_id: string

      /**
       * Retailer ID of the product to share
       */
      product_retailer_id: string
    }
  }
}

/**
 * Request body for sending a multi-product interactive message
 * Shares multiple catalog products grouped into sections.
 * Ref: https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages
 */
export interface CloudAPISendProductListMessageRequest extends CloudAPIMessageRequestBase {
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
     * Set to 'product_list' for a multi-product message
     */
    type: 'product_list'

    /**
     * Required header (text only for product-list messages)
     */
    header: {
      /**
       * Header type
       * Must be 'text' for product-list messages
       */
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
     * Required action identifying the catalog and the products to share
     */
    action: {
      /**
       * ID of the catalog connected to the WhatsApp Business Account
       */
      catalog_id: string

      /**
       * Product sections (each groups one or more products under a title)
       */
      sections: {
        /**
         * Section title
         * Maximum 24 characters
         */
        title: string

        /**
         * Products listed in this section
         */
        product_items: {
          /**
           * Retailer ID of the product to share
           */
          product_retailer_id: string
        }[]
      }[]
    }
  }
}

/**
 * Union of every outbound message request shape, addressed loosely. The
 * "at least one of `to` / `recipient`" rule is applied by
 * {@link CloudAPIRecipientAddressing} on {@link CloudAPIRequest}; prefer
 * `CloudAPIRequest` when you need a fully-addressed request.
 */
export type CloudAPIMessageRequest =
  | CloudAPISendTextMessageRequest
  | CloudAPISendTemplateMessageRequest
  | CloudAPISendImageMessageRequest
  | CloudAPISendAudioMessageRequest
  | CloudAPISendVideoMessageRequest
  | CloudAPISendDocumentMessageRequest
  | CloudAPISendStickerMessageRequest
  | CloudAPISendLocationMessageRequest
  | CloudAPISendContactsMessageRequest
  | CloudAPISendInteractiveCTAURLRequest
  | CloudAPISendInteractiveButtonsMessageRequest
  | CloudAPISendInteractiveListMessageRequest
  | CloudAPISendFlowMessageRequest
  | CloudAPISendReactionMessageRequest
  | CloudAPISendCallPermissionRequestMessageRequest
  | CloudAPISendCatalogMessageRequest
  | CloudAPISendRequestContactInfoMessageRequest
  | CloudAPISendProductMessageRequest
  | CloudAPISendProductListMessageRequest

/**
 * Addressing constraint for an outbound message: at least one of `to` (phone
 * number / group id) or `recipient` (business-scoped user ID) must be present.
 * When both are set, `to` takes precedence.
 */
export type CloudAPIRecipientAddressing =
  | { to: string; recipient?: string }
  | { to?: string; recipient: string }

/**
 * A fully-addressed outbound message request: any
 * {@link CloudAPIMessageRequest} shape with the "at least one of `to` /
 * `recipient`" rule enforced at the type level.
 */
export type CloudAPIRequest = CloudAPIMessageRequest &
  CloudAPIRecipientAddressing
