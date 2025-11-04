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

/**
 * Request body for simulating an incoming interactive message response
 * (button click or list selection)
 */
export interface SimulateIncomingInteractiveRequest {
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
   * Type of interactive response
   */
  interactive_type: 'button_reply' | 'list_reply'

  /**
   * Button ID (required when interactive_type is 'button_reply')
   */
  button_id?: string

  /**
   * Button title (required when interactive_type is 'button_reply')
   */
  button_title?: string

  /**
   * List item ID (required when interactive_type is 'list_reply')
   */
  list_item_id?: string

  /**
   * List item title (required when interactive_type is 'list_reply')
   */
  list_item_title?: string

  /**
   * List item description (optional for interactive_type 'list_reply')
   */
  list_item_description?: string
}
