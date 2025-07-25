/**
 * Request interfaces for WhatsApp emulator simulation endpoints
 */

/**
 * Request body for simulating an incoming text message
 */
export interface SimulateIncomingTextRequest {
  /**
   * Phone number of the sender in E.164 format
   */
  from: string

  /**
   * Display name of the sender
   */
  name: string

  /**
   * Text content of the message
   */
  message: string
}
