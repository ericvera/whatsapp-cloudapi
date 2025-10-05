import type { WebhookPayload } from '@whatsapp-cloudapi/types/webhook'
import type { EmulatorWebhookConfig } from '../types/index.js'

export class WebhookService {
  private readonly config: Required<EmulatorWebhookConfig>

  constructor(config: EmulatorWebhookConfig) {
    this.config = {
      timeout: 5000,
      ...config,
    }
  }

  public async sendIncomingMessage(
    from: string,
    contactName: string,
    messageText: string,
    businessPhoneNumberId: string,
    displayPhoneNumber: string,
  ): Promise<void> {
    const messageId = `mock_incoming_${String(Date.now())}_${Math.random().toString(36).slice(2)}`

    const webhookPayload: WebhookPayload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: businessPhoneNumberId,
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: displayPhoneNumber,
                  phone_number_id: businessPhoneNumberId,
                },
                contacts: [
                  {
                    wa_id: from,
                    profile: {
                      name: contactName,
                    },
                  },
                ],
                messages: [
                  {
                    id: messageId,
                    from,
                    timestamp: String(Math.floor(Date.now() / 1000)),
                    type: 'text',
                    text: {
                      body: messageText,
                    },
                  },
                ],
              },
              field: 'messages',
            },
          ],
        },
      ],
    }

    await this.sendWebhook(webhookPayload)
  }

  public async sendMessageStatus(
    messageId: string,
    to: string,
    businessPhoneNumberId: string,
    displayPhoneNumber: string,
  ): Promise<void> {
    const webhookPayload: WebhookPayload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: businessPhoneNumberId,
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: displayPhoneNumber,
                  phone_number_id: businessPhoneNumberId,
                },
                statuses: [
                  {
                    id: messageId,
                    recipient_id: to,
                    status: 'sent',
                    timestamp: String(Math.floor(Date.now() / 1000)),
                    conversation: {
                      id: `mock_conv_${messageId}`,
                      origin: {
                        type: 'service',
                      },
                    },
                  },
                ],
              },
              field: 'messages',
            },
          ],
        },
      ],
    }

    await this.sendWebhook(webhookPayload)
  }

  private async sendWebhook(webhookPayload: WebhookPayload): Promise<void> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      const response = await fetch(this.config.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(webhookPayload),
        signal: AbortSignal.timeout(this.config.timeout),
      })

      if (!response.ok) {
        console.error(
          `Failed to deliver webhook: ${response.status.toString()} ${response.statusText}`,
        )
      } else {
        console.log(`🔗 Webhook delivered successfully to ${this.config.url}`)
      }
    } catch (error) {
      console.error(
        'Error sending webhook:',
        error instanceof Error ? error.message : 'Unknown error',
      )
    }
  }
}
