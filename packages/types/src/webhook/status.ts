import { WebhookError } from './error.js'

/**
 * Conversation origin types for webhook status updates
 */
export type WebhookConversationType =
  | 'authentication'
  | 'authentication_international'
  | 'marketing'
  | 'marketing_lite'
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
   * - 'CBP': conversation-based pricing
   * - 'PMP': per-message pricing
   */
  pricing_model: 'CBP' | 'PMP'

  /**
   * Pricing type for the message
   * - 'regular': a regular paid message
   * - 'free_customer_service': within the free customer-service window
   * - 'free_entry_point': free entry-point conversation
   * Prefer `type` + `category` over the deprecated `billable` flag.
   */
  type?: 'regular' | 'free_customer_service' | 'free_entry_point'

  /**
   * Whether the message was billable
   * @deprecated Use `type` and `category` instead.
   */
  billable?: boolean
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
   * Type of recipient
   * Only included when the message was sent to a group.
   */
  recipient_type?: 'individual' | 'group'

  /**
   * Phone number of the group participant the status is for
   * Only included for group messages.
   */
  recipient_participant_id?: string

  /**
   * Hash of the recipient's identity key
   * Only included when the identity-change-check feature is enabled.
   */
  recipient_identity_key_hash?: string

  /**
   * Current status of the message
   * - sent: Message has been sent by the business
   * - delivered: Message has been delivered to the recipient
   * - read: Message has been read by the recipient
   * - played: A voice message has been played for the first time
   * - failed: Message failed to send (see `errors` for details)
   */
  status: 'delivered' | 'read' | 'sent' | 'played' | 'failed'

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
