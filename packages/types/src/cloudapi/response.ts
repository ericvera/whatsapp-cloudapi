// Ref: https://developers.facebook.com/docs/whatsapp/cloud-api/messages/text-messages

/**
 * Main response type for WhatsApp Cloud API requests
 */
export interface CloudAPIResponse {
  /**
   * Identifier for the messaging service
   * Always set to 'whatsapp'
   */
  messaging_product: 'whatsapp'

  /**
   * Array of contacts that received the message
   */
  contacts: {
    /**
     * The phone number or WhatsApp ID provided in the API request
     */
    input: string

    /**
     * The WhatsApp ID for the contact
     * Note: This may differ from the input phone number
     */
    wa_id: string
  }[]

  /**
   * Information about the sent messages
   */
  messages: {
    /**
     * Unique identifier for the message
     * This ID is used in webhooks for tracking message status
     */
    id: string
  }[]
}

/**
 * Error response from the WhatsApp Cloud API
 * Ref: https://developers.facebook.com/docs/whatsapp/cloud-api/support/error-codes
 */
export interface CloudAPIErrorResponse {
  error: {
    /** Error message describing what went wrong */
    message: string
    /** Type of error that occurred */
    type: string
    /** HTTP status code */
    code: number
    /** Additional error code for more specific error types */
    error_subcode?: number
    /** Additional error details */
    error_data?: {
      /** The messaging product that generated the error */
      messaging_product: string
      /** Detailed explanation of the error */
      details: string
    }
  }
}

/**
 * Supported WhatsApp Cloud API version
 */
export type CloudAPIVersion = 'v22.0'
