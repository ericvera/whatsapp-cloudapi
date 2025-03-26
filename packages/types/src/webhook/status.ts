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
   * WhatsApp ID of the message recipient
   */
  recipient_id: string

  /**
   * Current status of the message
   * - delivered: Message has been delivered to the recipient
   * - read: Message has been read by the recipient
   * - sent: Message has been sent by the business
   */
  status: 'delivered' | 'read' | 'sent'

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
  errors?: Array<WebhookError>
}
