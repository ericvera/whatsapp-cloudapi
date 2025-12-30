// Ref: https://developers.facebook.com/docs/whatsapp/cloud-api/messages/text-messages
// Ref: https://developers.facebook.com/docs/whatsapp/cloud-api/reference/media

/**
 * Response from uploading media to WhatsApp Cloud API
 */
export interface CloudAPIMediaUploadResponse {
  /**
   * The unique identifier for the uploaded media
   * Use this ID when sending media messages
   */
  id: string

  /**
   * File size in bytes (v24.0)
   */
  file_size?: number

  /**
   * MIME type of the uploaded file (v24.0)
   */
  mime_type?: string

  /**
   * SHA256 hash of the file (v24.0)
   */
  sha256?: string
}

/**
 * Image media constraints and supported formats
 */
export const ImageMediaConstraints = {
  /**
   * Supported MIME types for images
   */
  SupportedMimeTypes: ['image/jpeg', 'image/png'],

  /**
   * Maximum file size for images (5MB)
   */
  MaxFileSize: 5 * 1024 * 1024,
}

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

    /**
     * Status of the individual message (v24.0)
     * - 'accepted': Message was sent to the intended recipient
     * - 'held_for_quality_assessment': Message send was delayed until quality
     *   can be validated and it will either be sent or dropped
     * - 'paused': Message delivery has been paused
     */
    message_status?: 'accepted' | 'held_for_quality_assessment' | 'paused'
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
    /** Indicates if the error is transient and can be retried (v24.0) */
    is_transient?: boolean
    /** User-friendly error title (v24.0) */
    error_user_title?: string
    /** User-friendly error message (v24.0) */
    error_user_msg?: string
    /** Facebook trace ID for debugging (v24.0) */
    fbtrace_id?: string
    /** Additional error details */
    error_data?: {
      /** The messaging product that generated the error */
      messaging_product: string
      /** Detailed explanation of the error */
      details: string
      /** Field that caused the error (v24.0) */
      blame_field?: string
      /** Specification of the field (v24.0) */
      blame_field_spec?: string
    }
  }
}

/**
 * Response from marking a message as read
 */
export interface CloudAPIMarkReadResponse {
  /**
   * Indicates whether the operation was successful
   */
  success: boolean
}

/**
 * Supported WhatsApp Cloud API version
 */
export type CloudAPIVersion = 'v24.0'
