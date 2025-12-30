/**
 * Contact information for message senders in webhooks
 */
export interface WebhookContact {
  /**
   * WhatsApp ID for the contact
   * A business can respond to a customer using this ID
   * This ID may not match the customer's phone number
   */
  wa_id: string

  /**
   * Additional unique, alphanumeric identifier for a WhatsApp user
   */
  user_id?: string

  /**
   * Profile information
   * May be absent for certain message types
   * (e.g., system messages, Meta security codes)
   */
  profile?: {
    /**
     * Contact's name
     */
    name: string
  }
}
