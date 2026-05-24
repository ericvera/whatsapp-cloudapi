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
   * File size in bytes
   */
  file_size?: number

  /**
   * MIME type of the uploaded file
   */
  mime_type?: string

  /**
   * SHA256 hash of the file
   */
  sha256?: string
}

/**
 * Response from retrieving a media URL / metadata
 * Returned by GET /{media-id}, which resolves an uploaded or inbound media ID
 * to a short-lived authenticated download URL plus its metadata.
 * Ref: https://developers.facebook.com/docs/whatsapp/cloud-api/reference/media
 */
export interface CloudAPIMediaURLResponse {
  /**
   * Identifier for the messaging service
   * Always set to 'whatsapp'
   */
  messaging_product: 'whatsapp'

  /**
   * Short-lived, authenticated URL for downloading the media binary
   * Expires after 5 minutes; query the media ID again to obtain a new URL.
   * Requires the access token in the request to download.
   */
  url: string

  /**
   * MIME type of the media file
   */
  mime_type: string

  /**
   * SHA256 hash of the media file
   */
  sha256: string

  /**
   * File size in bytes
   */
  file_size: number

  /**
   * The unique identifier for the media
   */
  id: string
}

/**
 * Response from deleting a media asset
 * Returned by DELETE /{media-id}.
 * Ref: https://developers.facebook.com/docs/whatsapp/cloud-api/reference/media
 */
export interface CloudAPIMediaDeleteResponse {
  /**
   * Indicates whether the deletion was successful
   */
  success: boolean
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
     * The phone-number-based WhatsApp ID for the contact
     * Note: This may differ from the input phone number.
     * Omitted when the message was addressed to a business-scoped user ID.
     */
    wa_id?: string

    /**
     * The business-scoped user ID (BSUID) for the contact
     * Omitted when the message was addressed to a phone number.
     */
    user_id?: string
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
     * Status of the individual message
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
    /** Indicates if the error is transient and can be retried */
    is_transient?: boolean
    /** User-friendly error title */
    error_user_title?: string
    /** User-friendly error message */
    error_user_msg?: string
    /** Facebook trace ID for debugging */
    fbtrace_id?: string
    /** Additional error details */
    error_data?: {
      /** The messaging product that generated the error */
      messaging_product: string
      /** Detailed explanation of the error */
      details: string
      /** Field that caused the error */
      blame_field?: string
      /** Specification of the field */
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
export type CloudAPIVersion = 'v25.0'
