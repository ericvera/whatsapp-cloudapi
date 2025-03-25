/**
 * Base types for WhatsApp Cloud API
 */

export interface WhatsAppMessage {
  messaging_product: 'whatsapp'
  recipient_type: 'individual'
  to: string
  type:
    | 'text'
    | 'template'
    | 'image'
    | 'document'
    | 'audio'
    | 'video'
    | 'sticker'
}

export interface TextMessage extends WhatsAppMessage {
  type: 'text'
  text: {
    preview_url?: boolean
    body: string
  }
}

export interface TemplateMessage extends WhatsAppMessage {
  type: 'template'
  template: {
    name: string
    language: {
      code: string
    }
    components?: Array<{
      type: 'body' | 'button' | 'header'
      parameters: Array<{
        type: 'text' | 'currency' | 'date_time' | 'image' | 'document' | 'video'
        text?: string
        currency?: {
          fallback_value: string
          code: string
          amount_1000: number
        }
        date_time?: {
          fallback_value: string
        }
        image?: {
          link: string
        }
        document?: {
          link: string
        }
        video?: {
          link: string
        }
      }>
    }>
  }
}
