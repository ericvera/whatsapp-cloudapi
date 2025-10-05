export interface SimulateIncomingMessageResponse {
  message: string
  /**
   * Original input value (may include + prefix)
   */
  input: string
  /**
   * WhatsApp ID (normalized, without + prefix)
   */
  from: string
  text: string
}
