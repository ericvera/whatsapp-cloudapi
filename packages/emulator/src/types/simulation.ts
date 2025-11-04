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

export interface SimulateIncomingInteractiveResponse {
  message: string
  from: string
  interactive_type: 'button_reply' | 'list_reply'
  details: {
    id: string
    title: string
    description?: string
  }
}
