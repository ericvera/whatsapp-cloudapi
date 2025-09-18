import type {
  CloudAPIRequest,
  CloudAPIResponse,
  CloudAPISendFlowMessageRequest,
  CloudAPISendInteractiveCTAURLRequest,
} from '@whatsapp-cloudapi/types/cloudapi'
import type { Request, Response } from 'express'
import { nanoid } from 'nanoid'
import { WhatsAppFlowMessageVersion } from '../constants.js'
import type { WebhookService } from '../services/WebhookService.js'
import type { MediaRoutes } from './MediaRoutes.js'

export class MessageRoutes {
  constructor(
    private readonly businessPhoneNumberId: string,
    private readonly webhookService: WebhookService | undefined,
    private readonly mediaRoutes: MediaRoutes,
  ) {}

  // Type guards for interactive message types
  private isCTAURLMessage(
    body: CloudAPIRequest,
  ): body is CloudAPISendInteractiveCTAURLRequest {
    return (
      body.type === 'interactive' &&
      'interactive' in body &&
      body.interactive.type === 'cta_url'
    )
  }

  private isFlowMessage(
    body: CloudAPIRequest,
  ): body is CloudAPISendFlowMessageRequest {
    return (
      body.type === 'interactive' &&
      'interactive' in body &&
      body.interactive.type === 'flow'
    )
  }

  private extractMessageContent(body: CloudAPIRequest): string {
    switch (body.type) {
      case 'text':
        return body.text.body
      case 'template':
        return `[template: ${body.template.name}, params: ${JSON.stringify(body.template.components)}]`
      case 'image':
        return `[image: media_id=${body.image.id}${body.image.caption ? `, caption="${body.image.caption}"` : ''}]`
      case 'interactive': {
        if (this.isCTAURLMessage(body)) {
          const headerInfo = body.interactive.header
            ? `, header=${body.interactive.header.type}`
            : ''
          const footerInfo = body.interactive.footer
            ? `, footer="${body.interactive.footer.text}"`
            : ''
          return `[cta_url: "${body.interactive.body.text}", button="${body.interactive.action.parameters.display_text}", url="${body.interactive.action.parameters.url}"${headerInfo}${footerInfo}]`
        } else if (this.isFlowMessage(body)) {
          const flowData =
            body.interactive.action.parameters.flow_action_payload?.data
          const dataStr = flowData ? `, data=${JSON.stringify(flowData)}` : ''
          const screenStr = body.interactive.action.parameters
            .flow_action_payload?.screen
            ? `, screen="${body.interactive.action.parameters.flow_action_payload.screen}"`
            : ''
          return `[flow: "${body.interactive.body.text}", flow_id="${body.interactive.action.parameters.flow_id}", action="${body.interactive.action.parameters.flow_action}", cta="${body.interactive.action.parameters.flow_cta}"${screenStr}${dataStr}]`
        }
        return '[unknown interactive type]'
      }
      case 'reaction':
        return `[reaction: emoji="${body.reaction.emoji}" to message="${body.reaction.message_id}"]`
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

      // Validate media IDs for interactive messages
      if (body.type === 'interactive') {
        // Handle CTA URL messages
        if (this.isCTAURLMessage(body)) {
          const header = body.interactive.header

          // Validate header type - only text and image are supported
          if (header) {
            const headerType = header.type as string

            if (headerType !== 'text' && headerType !== 'image') {
              console.error(
                `❌ CTA message failed: Unsupported header type: ${headerType}`,
              )
              res.status(400).json({
                error: {
                  message:
                    'Only text and image headers are supported for CTA URL messages',
                  type: 'WhatsAppBusinessAPIError',
                  code: 400,
                },
              })
              return
            }
          }

          if (header?.type === 'image' && header.image.id) {
            const mediaId = header.image.id
            const mediaExists = this.mediaRoutes.isMediaValid(mediaId)
            if (!mediaExists) {
              console.error(
                `❌ CTA message failed: Media ID ${mediaId} not found or expired`,
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

          // Validate CTA URL format and ensure it's not an IP address
          const url = body.interactive.action.parameters.url

          // Validate URL format
          try {
            const urlObj = new URL(url)

            // Check if protocol is HTTP or HTTPS
            if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
              console.error('❌ CTA message failed: Invalid URL protocol')
              res.status(400).json({
                error: {
                  message: 'URL must use http:// or https:// protocol',
                  type: 'WhatsAppBusinessAPIError',
                  code: 400,
                },
              })
              return
            }

            // Check if hostname is an IP address (IPv4 or IPv6)
            const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/

            // Check for IPv6 by looking for colons (IPv6 addresses contain colons)
            const hasColons = urlObj.hostname.includes(':')

            if (ipv4Pattern.test(urlObj.hostname) || hasColons) {
              console.error(
                '❌ CTA message failed: URL hostname cannot be an IP address',
              )
              res.status(400).json({
                error: {
                  message: 'URL hostname cannot be an IP address',
                  type: 'WhatsAppBusinessAPIError',
                  code: 400,
                },
              })
              return
            }
          } catch {
            console.error('❌ CTA message failed: Invalid URL format')
            res.status(400).json({
              error: {
                message: 'Invalid URL format',
                type: 'WhatsAppBusinessAPIError',
                code: 400,
              },
            })
            return
          }

          // Validate character limits
          const bodyText = body.interactive.body.text
          const buttonText = body.interactive.action.parameters.display_text
          const headerText =
            body.interactive.header?.type === 'text'
              ? body.interactive.header.text
              : undefined
          const footerText = body.interactive.footer?.text

          if (bodyText.length > 1024) {
            console.error(
              '❌ CTA message failed: Body text exceeds 1024 characters',
            )
            res.status(400).json({
              error: {
                message: 'Body text cannot exceed 1024 characters',
                type: 'WhatsAppBusinessAPIError',
                code: 400,
              },
            })
            return
          }

          if (buttonText.length > 20) {
            console.error(
              '❌ CTA message failed: Button text exceeds 20 characters',
            )
            res.status(400).json({
              error: {
                message: 'Button text cannot exceed 20 characters',
                type: 'WhatsAppBusinessAPIError',
                code: 400,
              },
            })
            return
          }

          if (headerText && headerText.length > 60) {
            console.error(
              '❌ CTA message failed: Header text exceeds 60 characters',
            )
            res.status(400).json({
              error: {
                message: 'Header text cannot exceed 60 characters',
                type: 'WhatsAppBusinessAPIError',
                code: 400,
              },
            })
            return
          }

          if (footerText && footerText.length > 60) {
            console.error(
              '❌ CTA message failed: Footer text exceeds 60 characters',
            )
            res.status(400).json({
              error: {
                message: 'Footer text cannot exceed 60 characters',
                type: 'WhatsAppBusinessAPIError',
                code: 400,
              },
            })
            return
          }
        } else if (this.isFlowMessage(body)) {
          // Flow message validation
          const flowParams = body.interactive.action.parameters
          const header = body.interactive.header
          const bodyText = body.interactive.body.text
          const footerText = body.interactive.footer?.text

          // Validate required fields
          if (!flowParams.flow_token) {
            console.error('❌ Flow message failed: Missing flow_token')
            res.status(400).json({
              error: {
                message: 'Flow token is required',
                type: 'WhatsAppBusinessAPIError',
                code: 400,
              },
            })
            return
          }

          if (!flowParams.flow_id) {
            console.error('❌ Flow message failed: Missing flow_id')
            res.status(400).json({
              error: {
                message: 'Flow ID is required',
                type: 'WhatsAppBusinessAPIError',
                code: 400,
              },
            })
            return
          }

          if (!flowParams.flow_cta) {
            console.error('❌ Flow message failed: Missing flow_cta')
            res.status(400).json({
              error: {
                message: 'Flow CTA is required',
                type: 'WhatsAppBusinessAPIError',
                code: 400,
              },
            })
            return
          }

          // Validate character limits
          if (bodyText.length > 1024) {
            console.error(
              '❌ Flow message failed: Body text exceeds 1024 characters',
            )
            res.status(400).json({
              error: {
                message: 'Body text cannot exceed 1024 characters',
                type: 'WhatsAppBusinessAPIError',
                code: 400,
              },
            })
            return
          }

          if (
            header?.type === 'text' &&
            header.text &&
            header.text.length > 60
          ) {
            console.error(
              '❌ Flow message failed: Header text exceeds 60 characters',
            )
            res.status(400).json({
              error: {
                message: 'Header text cannot exceed 60 characters',
                type: 'WhatsAppBusinessAPIError',
                code: 400,
              },
            })
            return
          }

          if (footerText && footerText.length > 60) {
            console.error(
              '❌ Flow message failed: Footer text exceeds 60 characters',
            )
            res.status(400).json({
              error: {
                message: 'Footer text cannot exceed 60 characters',
                type: 'WhatsAppBusinessAPIError',
                code: 400,
              },
            })
            return
          }

          // Validate flow action and screen parameter
          if (flowParams.flow_action === 'navigate') {
            const screen = flowParams.flow_action_payload?.screen
            if (!screen) {
              console.error(
                '❌ Flow message failed: Screen parameter required for navigate action',
              )
              res.status(400).json({
                error: {
                  message:
                    'Screen parameter is required for navigate flow action',
                  type: 'WhatsAppBusinessAPIError',
                  code: 400,
                },
              })
              return
            }
          }

          // Validate media IDs in headers
          if (header) {
            let mediaId: string | undefined

            if (header.type === 'image' && header.image?.id) {
              mediaId = header.image.id
            } else if (header.type === 'video' && header.video?.id) {
              mediaId = header.video.id
            } else if (header.type === 'document' && header.document?.id) {
              mediaId = header.document.id
            }

            if (mediaId) {
              const mediaExists = this.mediaRoutes.isMediaValid(mediaId)

              if (!mediaExists) {
                console.error(
                  `❌ Flow message failed: Media ID ${mediaId} not found or expired`,
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
          }

          // Validate flow message version
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          if (flowParams.flow_message_version !== WhatsAppFlowMessageVersion) {
            console.error(
              `❌ Flow message failed: Unsupported flow message version: ${flowParams.flow_message_version as string}`,
            )
            res.status(400).json({
              error: {
                message: 'Only flow message version 3 is supported',
                type: 'WhatsAppBusinessAPIError',
                code: 400,
              },
            })
            return
          }

          const flowData = flowParams.flow_action_payload?.data
          console.log('📱 Flow message received:', {
            flow_id: flowParams.flow_id,
            flow_action: flowParams.flow_action,
            screen: flowParams.flow_action_payload?.screen,
            data: flowData ? JSON.stringify(flowData) : 'none',
          })
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
