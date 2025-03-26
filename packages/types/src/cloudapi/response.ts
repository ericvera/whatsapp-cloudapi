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
  contacts: Array<{
    /**
     * The phone number or WhatsApp ID provided in the API request
     */
    input: string

    /**
     * The WhatsApp ID for the contact
     * Note: This may differ from the input phone number
     */
    wa_id: string
  }>

  /**
   * Information about the sent messages
   */
  messages: Array<{
    /**
     * Unique identifier for the message
     * This ID is used in webhooks for tracking message status
     */
    id: string
  }>
}
