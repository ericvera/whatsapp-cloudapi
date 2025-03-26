export const add = (a: number, b: number): number => a + b

import { CloudAPISendTextMessageRequest } from '@whatsapp-cloudapi/types/cloudapi'

export const sendMessage = (
  message: CloudAPISendTextMessageRequest,
): string => {
  if (message.type === 'text') {
    return `[SEND] ${message.to}: ${message.text.body}`
  }

  return `[SEND] ${message.to}`
}
