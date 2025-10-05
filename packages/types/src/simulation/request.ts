/**
 * Request interfaces for WhatsApp emulator simulation endpoints
 */

/**
 * Request body for simulating an incoming text message
 */
export interface SimulateIncomingTextRequest {
  /**
   * Phone number of the sender (with or without + prefix)
   * The + prefix will be stripped to match WhatsApp ID format
   * Example: "+1234567890" or "1234567890"
   */
  from: string

  /**
   * Display name of the sender
   */
  name?: string

  /**
   * Text content of the message
   */
  message: string
}
