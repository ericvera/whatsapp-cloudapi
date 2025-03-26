import type {
  CloudAPIResponse,
  CloudAPISendTextMessageRequest,
} from '@whatsapp-cloudapi/types/cloudapi'
import type { Request, Response } from 'express'
import type { WebhookService } from '../services/WebhookService.js'

export class MessageRoutes {
  constructor(
    private readonly businessPhoneNumberId: string,
    private readonly webhookService: WebhookService | undefined,
  ) {}

  public handleSendMessage(req: Request, res: Response): void {
    const { to } = req.body as CloudAPISendTextMessageRequest
    const messageId = `mock_${String(Date.now())}_${Math.random().toString(36).slice(2)}`

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
