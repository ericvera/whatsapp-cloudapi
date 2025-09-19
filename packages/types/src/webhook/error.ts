/**
 * Error object for webhook notifications
 * Maps to equivalent properties in API error response payloads
 */
export interface WebhookError {
  /**
   * Error code
   * @example 130429
   */
  code: number

  /**
   * Error code title
   * @example "Rate limit hit"
   */
  title: string

  /**
   * Error code message
   * This value is the same as the title value
   * @example "Rate limit hit"
   */
  message: string

  /**
   * Additional error details
   */
  error_data?: {
    /**
     * Detailed explanation of the error
     * @example "Message failed to send because there were too many messages
     *   sent from this phone number in a short period of time"
     */
    details: string
  }
}
