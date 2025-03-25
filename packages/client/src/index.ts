export const add = (a: number, b: number): number => a + b

import { WhatsAppMessage } from '@whatsapp-cloudapi/types'

export const sendMessage = (message: WhatsAppMessage): string => {
  return `[SEND] ${message.to}`
}
