import { WebhookContact } from './contact.js'
import { WebhookError } from './error.js'
import type { WebhookMessage } from './message.js'
import { WebhookStatus } from './status.js'

// Ref: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/components

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
   * Array of changes that triggered this webhook
   */
  changes: WebhookChange[]
}

/**
 * Individual change within a webhook entry
 */
export interface WebhookChange {
  /**
   * Details of the change that triggered the webhook
   */
  value: WebhookValue

  /**
   * Type of notification
   * Value will be 'messages'
   */
  field: 'messages'
}

/**
 * Value object containing webhook change details
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
  metadata: {
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
