/**
 * Contact information for message senders in webhooks
 * Ref: https://developers.facebook.com/docs/whatsapp/business-scoped-user-ids/
 */
export interface WebhookContact {
  /**
   * Phone-number-based WhatsApp ID for the contact
   * A business can respond to a customer using this ID
   * This ID may not match the customer's phone number
   *
   * May be omitted when the user has adopted a WhatsApp username and the
   * business has had no recent phone-number interaction with them. In that
   * case, use `user_id` (the business-scoped user ID) to reply instead.
   */
  wa_id?: string

  /**
   * Business-scoped user ID (BSUID) for the WhatsApp user
   * Format: ISO 3166 alpha-2 country code + '.' + up to 128 alphanumerics
   * (e.g. "US.13491208655302741918")
   *
   * Present in all messages webhooks regardless of whether the user has
   * enabled the username feature. Use it to reply when `wa_id` is unavailable.
   */
  user_id?: string

  /**
   * Parent business-scoped user ID
   * Only present for businesses enrolled in parent BSUIDs (managed /
   * multi-portfolio). Format includes an "ENT" segment
   * (e.g. "US.ENT.11815799212886844830").
   */
  parent_user_id?: string

  /**
   * Hash of the user's identity key
   * Only included when the identity-change-check feature is enabled for the
   * business.
   */
  identity_key_hash?: string

  /**
   * Profile information
   * May be absent for certain message types
   * (e.g., system messages, Meta security codes)
   */
  profile?: {
    /**
     * Contact's display name
     */
    name: string

    /**
     * Contact's WhatsApp username (without the leading '@' in the value)
     * Only present once the user has adopted a username.
     */
    username?: string
  }
}
