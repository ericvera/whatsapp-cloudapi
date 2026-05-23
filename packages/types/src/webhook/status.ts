import { WebhookError } from './error.js'

/**
 * Conversation origin types for webhook status updates
 */
export type WebhookConversationType =
  | 'authentication'
  | 'marketing'
  | 'utility'
  | 'service'
  | 'referral_conversion'

/**
 * Conversation information for webhook status updates
 */
export interface WebhookConversation {
  /**
   * Unique identifier for the conversation
   */
  id: string

  /**
   * Information about how the conversation started
   */
  origin?: {
    /**
     * Category of the conversation
     * Determines pricing and features available
     */
    type: WebhookConversationType
  }

  /**
   * Date when the conversation expires
   * Only present for messages with status 'sent'
   */
  expiration_timestamp?: string
}

/**
 * Pricing information for webhook status updates
 */
export interface WebhookPricing {
  /**
   * Indicates the conversation category
   */
  category: WebhookConversationType

  /**
   * Type of pricing model used by the business
   * Current supported value is CBP
   */
  pricing_model: 'CBP'
}

/**
 * Status update for a message sent by the business
 */
export interface WebhookStatus {
  /**
   * ID of the message this status update is for
   */
  id: string

  /**
   * Phone-number-based WhatsApp ID of the message recipient
   * May be omitted for `failed` statuses when the message was addressed to a
   * business-scoped user ID rather than a phone number.
   */
  recipient_id?: string

  /**
   * Business-scoped user ID (BSUID) of the message recipient
   * Always set for `sent`, `delivered`, and `read` statuses.
   */
  recipient_user_id?: string

  /**
   * Parent business-scoped user ID of the message recipient
   * Only present for businesses enrolled in parent BSUIDs.
   */
  recipient_parent_user_id?: string

  /**
   * Current status of the message
   * - sent: Message has been sent by the business
   * - delivered: Message has been delivered to the recipient
   * - read: Message has been read by the recipient
   * - failed: Message failed to send (see `errors` for details)
   */
  status: 'delivered' | 'read' | 'sent' | 'failed'

  /**
   * Unix timestamp for when this status was updated
   */
  timestamp: string

  /**
   * Arbitrary string included in the original sent message
   */
  biz_opaque_callback_data?: string

  /**
   * Information about the conversation this status belongs to
   */
  conversation?: WebhookConversation

  /**
   * Pricing information for the message
   */
  pricing?: WebhookPricing

  /**
   * Error information if the message failed
   */
  errors?: WebhookError[]
}
