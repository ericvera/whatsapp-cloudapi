import type {
  CloudAPIRequest,
  CloudAPIResponse,
} from '@whatsapp-cloudapi/types/cloudapi'
import type { Request, Response } from 'express'
import { nanoid } from 'nanoid'
import type { WebhookService } from '../services/WebhookService.js'
import type { MediaRoutes } from './MediaRoutes.js'

export class MessageRoutes {
  constructor(
    private readonly businessPhoneNumberId: string,
    private readonly webhookService: WebhookService | undefined,
    private readonly mediaRoutes: MediaRoutes,
  ) {}

  private extractMessageContent(body: CloudAPIRequest): string {
    switch (body.type) {
      case 'text':
        return body.text.body
      case 'template':
        return `[template: ${body.template.name}, params: ${JSON.stringify(body.template.components)}]`
      case 'image':
        return `[image: media_id=${body.image.id}${body.image.caption ? `, caption="${body.image.caption}"` : ''}]`
      default: {
        // Exhaustive check - this should never happen with current types
        return '[unknown message type]'
      }
    }
  }

  public handleSendMessage(req: Request, res: Response): void {
    try {
      const body = req.body as CloudAPIRequest
      const { to } = body

      if (!to) {
        console.error('❌ Message send failed: Missing recipient phone number')
        res.status(400).json({
          error: {
            message: 'Recipient phone number is required',
            type: 'OAuthException',
            code: 400,
          },
        })
        return
      }

      // Validate media ID for image messages
      if (body.type === 'image') {
        const mediaExists = this.mediaRoutes.isMediaValid(body.image.id)

        if (!mediaExists) {
          console.error(
            `❌ Image message failed: Media ID ${body.image.id} not found or expired`,
          )
          res.status(400).json({
            error: {
              message: 'Media not found',
              type: 'WhatsAppBusinessAPIError',
              code: 131052,
              error_subcode: 1404,
            },
          })
          return
        }
      }

      const messageId = `message_${nanoid(6)}`

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
    } catch (error) {
      console.error('❌ Message send error:', error)
      res.status(500).json({
        error: {
          message: 'Internal server error during message send',
          type: 'OAuthException',
          code: 500,
        },
      })
    }
  }
}
