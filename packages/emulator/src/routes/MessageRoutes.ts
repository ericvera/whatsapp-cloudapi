import type {
  CloudAPIRequest,
  CloudAPIResponse,
} from '@whatsapp-cloudapi/types/cloudapi'
import type { Request, Response } from 'express'
import type { WebhookService } from '../services/WebhookService.js'

export class MessageRoutes {
  constructor(
    private readonly businessPhoneNumberId: string,
    private readonly webhookService: WebhookService | undefined,
  ) {}

  private extractMessageContent(body: CloudAPIRequest): string {
    switch (body.type) {
      case 'text':
        return body.text.body
      case 'template':
        return `[template: ${body.template.name}, params: ${JSON.stringify(body.template.components)}]`
      default: {
        // Exhaustive check - this should never happen with current types
        return '[unknown message type]'
      }
    }
  }

  public handleSendMessage(req: Request, res: Response): void {
    const body = req.body as CloudAPIRequest
    const { to } = body
    const messageId = `mock_${String(Date.now())}_${Math.random().toString(36).slice(2)}`

    const messageContent = this.extractMessageContent(body)

    console.log(
      `📤 Outgoing message (ID: ${messageId}) to ${to}: "${messageContent}"`,
    )

    // Simulate successful message send
    const response: CloudAPIResponse = {
      messaging_product: 'whatsapp',
      contacts: [
        {
          input: to,
          wa_id: to,
        },
      ],
      messages: [
        {
          id: messageId,
        },
      ],
    }

    // Send webhook asynchronously if configured
    if (this.webhookService) {
      void this.webhookService.sendMessageStatus(
        messageId,
        to,
        this.businessPhoneNumberId,
      )
    }

    res.status(200).json(response)
  }
}
