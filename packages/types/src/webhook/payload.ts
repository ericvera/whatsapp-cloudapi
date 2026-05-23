import { WebhookContact } from './contact.js'
import { WebhookError } from './error.js'
import type { WebhookMessage } from './message.js'
import { WebhookStatus } from './status.js'

// Ref: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/components
// Ref: https://developers.facebook.com/docs/whatsapp/business-scoped-user-ids/

/**
 * Main webhook payload received from WhatsApp Cloud API
 */
export interface WebhookPayload {
  /**
   * The specific webhook a business is subscribed to
   * Always set to 'whatsapp_business_account'
   */
  object: 'whatsapp_business_account'

  /**
   * Array of webhook entries containing changes
   */
  entry: WebhookEntry[]
}

/**
 * Individual webhook entry containing changes
 */
export interface WebhookEntry {
  /**
   * WhatsApp Business Account ID
   * Identifies which business account received the webhook
   */
  id: string

  /**
   * Unix timestamp for when the entry was generated
   * Present on some events (e.g. business_username_update).
   */
  time?: number

  /**
   * Array of changes that triggered this webhook
   */
  changes: WebhookChange[]
}

/**
 * Metadata describing the business subscribed to the webhook
 */
export interface WebhookMetadata {
  /**
   * The phone number that is displayed for a business
   */
  display_phone_number: string

  /**
   * ID for the phone number
   * A business can respond to a message using this ID
   */
  phone_number_id: string
}

/**
 * A change delivered under the 'messages' webhook field
 * Covers incoming messages, status updates, the shared-contacts webhook, and
 * system messages.
 */
export interface WebhookMessagesChange {
  /**
   * Details of the change that triggered the webhook
   */
  value: WebhookValue

  /**
   * Type of notification
   */
  field: 'messages'
}

/**
 * A change delivered under the 'user_id_update' webhook field
 * Sent when a user's business-scoped user ID (BSUID) changes.
 */
export interface WebhookUserIdUpdateChange {
  value: WebhookUserIdUpdateValue
  field: 'user_id_update'
}

/**
 * A change delivered under the 'business_username_update' webhook field
 * Sent when a business username's status changes.
 */
export interface WebhookBusinessUsernameUpdateChange {
  value: WebhookBusinessUsernameUpdateValue
  field: 'business_username_update'
}

/**
 * A change delivered under the 'user_preferences' webhook field
 * Sent when a user updates a messaging preference (e.g. marketing opt-out).
 */
export interface WebhookUserPreferencesChange {
  value: WebhookUserPreferencesValue
  field: 'user_preferences'
}

/**
 * Individual change within a webhook entry
 * Discriminated on `field`.
 */
export type WebhookChange =
  | WebhookMessagesChange
  | WebhookUserIdUpdateChange
  | WebhookBusinessUsernameUpdateChange
  | WebhookUserPreferencesChange

/**
 * Value object for changes delivered under the 'messages' field
 * This object is nested within the changes array of the entry array
 */
export interface WebhookValue {
  /**
   * Product used to send the message
   * Value is always whatsapp
   */
  messaging_product: 'whatsapp'

  /**
   * A metadata object describing the business subscribed to the webhook
   */
  metadata: WebhookMetadata

  /**
   * Array of contact objects with information for the customer who sent a
   * message to the business
   */
  contacts?: WebhookContact[]

  /**
   * An array of error objects describing the error
   */
  errors?: WebhookError[]

  /**
   * Information about a message received by the business that is subscribed
   * to the webhook
   */
  messages?: WebhookMessage[]

  /**
   * Status object for a message that was sent by the business that is
   * subscribed to the webhook
   */
  statuses?: WebhookStatus[]
}

/**
 * Previous/current pair used when a business-scoped user ID changes
 */
export interface WebhookUserIdChange {
  /**
   * The user's previous BSUID
   */
  previous: string

  /**
   * The user's current BSUID
   */
  current: string
}

/**
 * Entry describing a change to a user's business-scoped user ID
 */
export interface WebhookUserIdUpdate {
  /**
   * Phone-number-based WhatsApp ID of the user
   * Omitted when the user has adopted a username and the phone number is
   * unavailable.
   */
  wa_id?: string

  /**
   * Human-readable description of the update
   */
  detail: string

  /**
   * Previous and current business-scoped user ID (BSUID)
   */
  user_id: WebhookUserIdChange

  /**
   * Previous and current parent BSUID
   * Only included if parent BSUIDs are enabled.
   */
  parent_user_id?: WebhookUserIdChange

  /**
   * Unix timestamp for when the webhook was sent
   */
  timestamp: string
}

/**
 * Value object for changes delivered under the 'user_id_update' field
 */
export interface WebhookUserIdUpdateValue {
  messaging_product: 'whatsapp'
  metadata: WebhookMetadata
  contacts?: WebhookContact[]
  user_id_update: WebhookUserIdUpdate[]
}

/**
 * Value object for changes delivered under the 'business_username_update' field
 */
export interface WebhookBusinessUsernameUpdateValue {
  /**
   * The business's displayed phone number
   */
  display_phone_number: string

  /**
   * The business username
   * Omitted when `status` is 'deleted'.
   */
  username?: string

  /**
   * Status of the business username
   * - 'approved': approved and visible to users
   * - 'reserved': reserved for the phone number but not yet visible
   * - 'deleted': deleted via the WhatsApp Business app
   */
  status: 'approved' | 'deleted' | 'reserved'
}

/**
 * Entry describing a user's messaging preference update
 */
export interface WebhookUserPreference {
  /**
   * Phone-number-based WhatsApp ID of the user
   * Omitted when the phone number is unavailable.
   */
  wa_id?: string

  /**
   * Business-scoped user ID (BSUID) of the user
   */
  user_id: string

  /**
   * Parent BSUID of the user
   * Only included if parent BSUIDs are enabled.
   */
  parent_user_id?: string

  /**
   * Human-readable description of the preference
   */
  detail: string

  /**
   * Category the preference applies to
   * @example "marketing_messages"
   */
  category: string

  /**
   * The preference value the user selected
   */
  value: string

  /**
   * Unix timestamp for when the webhook was sent
   */
  timestamp: number
}

/**
 * Value object for changes delivered under the 'user_preferences' field
 */
export interface WebhookUserPreferencesValue {
  messaging_product: 'whatsapp'
  metadata: WebhookMetadata
  contacts?: WebhookContact[]
  user_preferences: WebhookUserPreference[]
}
