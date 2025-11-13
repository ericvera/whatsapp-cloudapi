import type { WebhookPayload } from '@whatsapp-cloudapi/types/webhook'
import type { EmulatorWebhookConfig } from '../types/index.js'
import type { EmulatorLogger } from './Logger.js'

export class WebhookService {
  private readonly config: Required<EmulatorWebhookConfig>
  private readonly logger: EmulatorLogger

  constructor(config: EmulatorWebhookConfig, logger: EmulatorLogger) {
    this.config = {
      timeout: 5000,
      ...config,
    }
    this.logger = logger
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

  public async sendIncomingButtonReply(
    from: string,
    contactName: string,
    buttonId: string,
    buttonTitle: string,
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
                    type: 'interactive',
                    interactive: {
                      type: 'button_reply',
                      button_reply: {
                        id: buttonId,
                        title: buttonTitle,
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

  public async sendIncomingListReply(
    from: string,
    contactName: string,
    listItemId: string,
    listItemTitle: string,
    listItemDescription: string,
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
                    type: 'interactive',
                    interactive: {
                      type: 'list_reply',
                      list_reply: {
                        id: listItemId,
                        title: listItemTitle,
                        description: listItemDescription,
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
    const startTime = Date.now()

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

      const duration = Date.now() - startTime

      if (!response.ok) {
        this.logger.webhookFailed(
          this.config.url,
          `${response.status.toString()} ${response.statusText}`,
        )
      } else {
        this.logger.webhookDelivered(this.config.url, response.status, duration)
      }
    } catch (error) {
      this.logger.webhookFailed(
        this.config.url,
        error instanceof Error ? error.message : 'Unknown error',
      )
    }
  }
}
