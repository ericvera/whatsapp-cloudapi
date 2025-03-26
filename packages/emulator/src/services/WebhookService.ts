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

  public async sendMessageStatus(
    messageId: string,
    to: string,
    businessPhoneNumberId: string,
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
                  display_phone_number: businessPhoneNumberId,
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

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Hub-Signature-256': this.config.secret,
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
      }
    } catch (error) {
      console.error(
        'Error sending webhook:',
        error instanceof Error ? error.message : 'Unknown error',
      )
    }
  }
}
