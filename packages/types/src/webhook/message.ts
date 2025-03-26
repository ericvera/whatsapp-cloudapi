/**
 * Base interface for all WhatsApp webhook message types
 * Contains common fields shared across all message types
 */
export interface WebhookMessageBase {
  /**
   * Unique identifier for the message
   */
  id: string

  /**
   * WhatsApp ID of the sender
   */
  from: string

  /**
   * Unix timestamp when WhatsApp server received the message
   */
  timestamp: string

  /**
   * Optional context information about the message
   */
  context?: {
    /**
     * Indicates if the message was forwarded
     */
    forwarded: boolean

    /**
     * Indicates if the message has been forwarded multiple times
     */
    frequently_forwarded: boolean

    /**
     * WhatsApp ID of the sender of the message being replied to
     */
    from?: string

    /**
     * Message ID of the message being replied to
     */
    id?: string
  }

  /**
   * Type of message received
   */
  type:
    | 'text'
    | 'audio'
    | 'button'
    | 'document'
    | 'image'
    | 'interactive'
    | 'order'
    | 'sticker'
    | 'system'
    | 'unknown'
    | 'video'
}

/**
 * Text message type received through webhook
 */
export interface WebhookTextMessage extends WebhookMessageBase {
  type: 'text'
  text: {
    /**
     * The actual text content of the message
     */
    body: string
  }
}

/**
 * Audio message type received through webhook
 */
export interface WebhookAudioMessage extends WebhookMessageBase {
  type: 'audio'
  audio: {
    /**
     * ID for the audio file
     */
    id: string
    /**
     * Mime type of the audio file
     */
    mime_type: string
  }
}

/**
 * Button message type received through webhook
 */
export interface WebhookButtonMessage extends WebhookMessageBase {
  type: 'button'
  button: {
    /**
     * The payload for a button clicked as part of an interactive message
     */
    payload: string
    /**
     * Button text
     */
    text: string
  }
}

/**
 * Document message type received through webhook
 */
export interface WebhookDocumentMessage extends WebhookMessageBase {
  type: 'document'
  document: {
    /**
     * ID for the document
     */
    id: string
    /**
     * Caption for the document, if provided
     */
    caption?: string
    /**
     * Name of the file
     */
    filename: string
    /**
     * Mime type of the document file
     */
    mime_type: string
  }
}

/**
 * Image message type received through webhook
 */
export interface WebhookImageMessage extends WebhookMessageBase {
  type: 'image'
  image: {
    /**
     * ID for the image
     */
    id: string
    /**
     * Caption for the image, if provided
     */
    caption?: string
    /**
     * Mime type of the image file
     */
    mime_type: string
    /**
     * SHA256 hash of the image
     */
    sha256: string
  }
}

/**
 * Interactive message type received through webhook
 */
export interface WebhookInteractiveMessage extends WebhookMessageBase {
  type: 'interactive'
  interactive: {
    /**
     * Type of interactive message
     */
    type: 'button_reply' | 'list_reply'
    /**
     * Button reply message payload
     */
    button_reply?: {
      /**
       * Unique ID for the button
       */
      id: string
      /**
       * Title of the button
       */
      title: string
    }
    /**
     * List reply message payload
     */
    list_reply?: {
      /**
       * Unique ID for the selected item
       */
      id: string
      /**
       * Title of the selected item
       */
      title: string
      /**
       * Description of the selected item
       */
      description: string
    }
  }
}

/**
 * Order message type received through webhook
 */
export interface WebhookOrderMessage extends WebhookMessageBase {
  type: 'order'
  order: {
    /**
     * Catalog ID for the order
     */
    catalog_id: string
    /**
     * Product items in the order
     */
    product_items: Array<{
      /**
       * Product ID
       */
      product_retailer_id: string
      /**
       * Quantity ordered
       */
      quantity: number
      /**
       * Item price
       */
      item_price: number
      /**
       * Currency code
       */
      currency: string
    }>
  }
}

/**
 * Sticker message type received through webhook
 */
export interface WebhookStickerMessage extends WebhookMessageBase {
  type: 'sticker'
  sticker: {
    /**
     * ID for the sticker
     */
    id: string
    /**
     * Mime type of the sticker file
     */
    mime_type: string
    /**
     * SHA256 hash of the sticker
     */
    sha256: string
    /**
     * Whether the sticker is animated
     */
    animated: boolean
  }
}

/**
 * System message type received through webhook (e.g. customer number change messages)
 */
export interface WebhookSystemMessage extends WebhookMessageBase {
  type: 'system'
  system: {
    /**
     * The type of system update
     */
    body: string
    /**
     * New WhatsApp ID if this was a customer number change message
     */
    new_wa_id?: string
  }
}

/**
 * Video message type received through webhook
 */
export interface WebhookVideoMessage extends WebhookMessageBase {
  type: 'video'
  video: {
    /**
     * ID for the video
     */
    id: string
    /**
     * Caption for the video, if provided
     */
    caption?: string
    /**
     * Mime type of the video file
     */
    mime_type: string
    /**
     * SHA256 hash of the video
     */
    sha256: string
  }
}

/**
 * Unknown message type received through webhook
 */
export interface WebhookUnknownMessage extends WebhookMessageBase {
  type: 'unknown'
}

/**
 * Union type of all possible webhook message types
 */
export type WebhookMessage =
  | WebhookTextMessage
  | WebhookAudioMessage
  | WebhookButtonMessage
  | WebhookDocumentMessage
  | WebhookImageMessage
  | WebhookInteractiveMessage
  | WebhookOrderMessage
  | WebhookStickerMessage
  | WebhookSystemMessage
  | WebhookUnknownMessage
  | WebhookVideoMessage
