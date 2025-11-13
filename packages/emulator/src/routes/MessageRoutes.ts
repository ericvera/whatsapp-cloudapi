import type {
  CloudAPIMarkMessageReadRequest,
  CloudAPIMarkReadResponse,
  CloudAPIRequest,
  CloudAPIResponse,
  CloudAPISendFlowMessageRequest,
  CloudAPISendInteractiveButtonsMessageRequest,
  CloudAPISendInteractiveCTAURLRequest,
  CloudAPISendInteractiveListMessageRequest,
} from '@whatsapp-cloudapi/types/cloudapi'
import type { Request, Response } from 'express'
import { nanoid } from 'nanoid'
import { WhatsAppFlowMessageVersion } from '../constants.js'
import type { EmulatorLogger } from '../services/Logger.js'
import type { WebhookService } from '../services/WebhookService.js'
import { normalizeWhatsAppId } from '../utils/phoneUtils.js'
import type { MediaRoutes } from './MediaRoutes.js'

export class MessageRoutes {
  constructor(
    private readonly businessPhoneNumberId: string,
    private readonly displayPhoneNumber: string,
    private readonly webhookService: WebhookService | undefined,
    private readonly mediaRoutes: MediaRoutes,
    private readonly logger: EmulatorLogger,
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

  private isButtonsMessage(
    body: CloudAPIRequest,
  ): body is CloudAPISendInteractiveButtonsMessageRequest {
    return (
      body.type === 'interactive' &&
      'interactive' in body &&
      body.interactive.type === 'button'
    )
  }

  private isListMessage(
    body: CloudAPIRequest,
  ): body is CloudAPISendInteractiveListMessageRequest {
    return (
      body.type === 'interactive' &&
      'interactive' in body &&
      body.interactive.type === 'list'
    )
  }

  private isMarkAsReadRequest(
    body: unknown,
  ): body is CloudAPIMarkMessageReadRequest {
    const req = body as Partial<CloudAPIMarkMessageReadRequest>
    return req.status === 'read' && typeof req.message_id === 'string'
  }

  private logOutgoingMessage(
    body: CloudAPIRequest,
    recipient: string,
    messageId: string,
  ): void {
    const context = {
      direction: 'sent' as const,
      recipient,
      messageId,
    }

    const messageType = body.type

    switch (body.type) {
      case 'text':
        this.logger.textMessage(body.text.body, context)
        break
      case 'image':
        this.logger.imageMessage(body.image.caption, body.image.id, context)
        break
      case 'reaction':
        this.logger.reactionMessage(
          body.reaction.emoji,
          body.reaction.message_id,
          context,
        )
        break
      case 'interactive':
        if (this.isButtonsMessage(body)) {
          const headerText =
            body.interactive.header?.type === 'text'
              ? body.interactive.header.text
              : undefined

          const buttons = body.interactive.action.buttons.map((btn) => ({
            id: btn.reply.id,
            title: btn.reply.title,
          }))

          this.logger.interactiveButtonMessage(
            headerText,
            body.interactive.body.text,
            body.interactive.footer?.text,
            buttons,
            context,
          )
        } else if (this.isListMessage(body)) {
          const sections = body.interactive.action.sections.map((section) => ({
            ...(section.title ? { title: section.title } : {}),
            rows: section.rows.map((row) => ({
              id: row.id,
              title: row.title,
              ...(row.description ? { description: row.description } : {}),
            })),
          }))

          this.logger.interactiveListMessage(
            body.interactive.header?.text,
            body.interactive.body.text,
            body.interactive.footer?.text,
            body.interactive.action.button,
            sections,
            context,
          )
        } else {
          // For CTA URL and Flow messages, just log as text for now
          this.logger.textMessage(body.interactive.body.text, context)
        }
        break
      case 'template':
        // Log template as text with template name
        this.logger.textMessage(`Template: ${body.template.name}`, context)
        break
      default:
        this.logger.unsupportedMessage(messageType, body, context)
        break
    }
  }

  public handleSendMessage(req: Request, res: Response): void {
    try {
      // Check if this is a mark-as-read request
      if (this.isMarkAsReadRequest(req.body)) {
        this.handleMarkAsRead(req, res)
        return
      }

      const body = req.body as CloudAPIRequest
      const { to } = body

      if (!to) {
        this.logger.validationError({
          field: 'to',
          reason: 'Missing recipient phone number',
        })

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
          this.logger.validationError({
            field: 'image.id',
            value: body.image.id,
            reason: 'Media ID not found or expired',
          })

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
              this.logger.validationError({
                field: 'header.type',
                value: headerType,
                reason:
                  'Only text and image headers are supported for CTA URL messages',
              })

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
              this.logger.validationError({
                field: 'header.image.id',
                value: mediaId,
                reason: 'Media ID not found or expired',
              })

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
              this.logger.validationError({
                field: 'action.parameters.url',
                value: url,
                reason: 'URL must use http:// or https:// protocol',
              })

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

            // Check for IPv6 by looking for colons (IPv6 addresses contain
            // colons)
            const hasColons = urlObj.hostname.includes(':')

            if (ipv4Pattern.test(urlObj.hostname) || hasColons) {
              this.logger.validationError({
                field: 'action.parameters.url',
                value: url,
                reason: 'URL hostname cannot be an IP address',
              })

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
            this.logger.validationError({
              field: 'action.parameters.url',
              value: url,
              reason: 'Invalid URL format',
            })

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
            this.logger.validationError({
              field: 'body.text',
              value: `${bodyText.length.toString()} characters`,
              reason: 'Body text cannot exceed 1024 characters',
            })

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
            this.logger.validationError({
              field: 'action.parameters.display_text',
              value: `${buttonText.length.toString()} characters`,
              reason: 'Button text cannot exceed 20 characters',
            })

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
            this.logger.validationError({
              field: 'header.text',
              value: `${headerText.length.toString()} characters`,
              reason: 'Header text cannot exceed 60 characters',
            })

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
            this.logger.validationError({
              field: 'footer.text',
              value: `${footerText.length.toString()} characters`,
              reason: 'Footer text cannot exceed 60 characters',
            })

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
            this.logger.validationError({
              field: 'action.parameters.flow_token',
              reason: 'Flow token is required',
            })

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
            this.logger.validationError({
              field: 'action.parameters.flow_id',
              reason: 'Flow ID is required',
            })

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
            this.logger.validationError({
              field: 'action.parameters.flow_cta',
              reason: 'Flow CTA is required',
            })

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
            this.logger.validationError({
              field: 'body.text',
              value: `${bodyText.length.toString()} characters`,
              reason: 'Body text cannot exceed 1024 characters',
            })

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
            this.logger.validationError({
              field: 'header.text',
              value: `${header.text.length.toString()} characters`,
              reason: 'Header text cannot exceed 60 characters',
            })

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
            this.logger.validationError({
              field: 'footer.text',
              value: `${footerText.length.toString()} characters`,
              reason: 'Footer text cannot exceed 60 characters',
            })

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
              this.logger.validationError({
                field: 'action.parameters.flow_action_payload.screen',
                reason: 'Screen parameter is required for navigate flow action',
              })

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
                this.logger.validationError({
                  field: `header.${header.type}.id`,
                  value: mediaId,
                  reason: 'Media ID not found or expired',
                })

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
          /* eslint-disable-next-line
             @typescript-eslint/no-unnecessary-condition */
          if (flowParams.flow_message_version !== WhatsAppFlowMessageVersion) {
            this.logger.validationError({
              field: 'action.parameters.flow_message_version',
              value: String(flowParams.flow_message_version),
              reason: 'Only flow message version 3 is supported',
            })

            res.status(400).json({
              error: {
                message: 'Only flow message version 3 is supported',
                type: 'WhatsAppBusinessAPIError',
                code: 400,
              },
            })

            return
          }
        } else if (this.isButtonsMessage(body)) {
          // Button message validation
          const { interactive } = body
          const buttons = interactive.action.buttons
          const header = interactive.header
          const bodyText = interactive.body.text
          const footerText = interactive.footer?.text

          // Validate button count
          if (buttons.length < 1 || buttons.length > 3) {
            this.logger.validationError({
              field: 'action.buttons',
              value: `${buttons.length.toString()} buttons`,
              reason: 'Must provide between 1 and 3 buttons',
            })

            res.status(400).json({
              error: {
                message: 'Must provide between 1 and 3 buttons',
                type: 'WhatsAppBusinessAPIError',
                code: 400,
              },
            })

            return
          }

          // Validate button IDs are unique
          const buttonIds = new Set<string>()
          for (const button of buttons) {
            if (buttonIds.has(button.reply.id)) {
              this.logger.validationError({
                field: 'action.buttons.reply.id',
                value: button.reply.id,
                reason: 'Duplicate button ID found',
              })

              res.status(400).json({
                error: {
                  message: `Duplicate button ID found: ${button.reply.id}`,
                  type: 'WhatsAppBusinessAPIError',
                  code: 400,
                },
              })

              return
            }
            buttonIds.add(button.reply.id)

            // Validate button ID length
            if (button.reply.id.length > 256) {
              this.logger.validationError({
                field: 'action.buttons.reply.id',
                value: `${button.reply.id.length.toString()} characters`,
                reason: 'Button ID cannot exceed 256 characters',
              })

              res.status(400).json({
                error: {
                  message: 'Button ID cannot exceed 256 characters',
                  type: 'WhatsAppBusinessAPIError',
                  code: 400,
                },
              })

              return
            }

            // Validate button title length
            if (button.reply.title.length > 20) {
              this.logger.validationError({
                field: 'action.buttons.reply.title',
                value: `${button.reply.title.length.toString()} characters`,
                reason: 'Button title cannot exceed 20 characters',
              })

              res.status(400).json({
                error: {
                  message: 'Button title cannot exceed 20 characters',
                  type: 'WhatsAppBusinessAPIError',
                  code: 400,
                },
              })

              return
            }
          }

          // Validate character limits
          if (bodyText.length > 1024) {
            this.logger.validationError({
              field: 'body.text',
              value: `${bodyText.length.toString()} characters`,
              reason: 'Body text cannot exceed 1024 characters',
            })

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
            this.logger.validationError({
              field: 'header.text',
              value: `${header.text.length.toString()} characters`,
              reason: 'Header text cannot exceed 60 characters',
            })

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
            this.logger.validationError({
              field: 'footer.text',
              value: `${footerText.length.toString()} characters`,
              reason: 'Footer text cannot exceed 60 characters',
            })

            res.status(400).json({
              error: {
                message: 'Footer text cannot exceed 60 characters',
                type: 'WhatsAppBusinessAPIError',
                code: 400,
              },
            })

            return
          }

          // Validate media IDs in headers
          if (header) {
            let mediaId: string | undefined

            if (header.type === 'image' && header.image.id) {
              mediaId = header.image.id
            } else if (header.type === 'video' && header.video.id) {
              mediaId = header.video.id
            } else if (header.type === 'document' && header.document.id) {
              mediaId = header.document.id
            }

            if (mediaId) {
              const mediaExists = this.mediaRoutes.isMediaValid(mediaId)

              if (!mediaExists) {
                this.logger.validationError({
                  field: `header.${header.type}.id`,
                  value: mediaId,
                  reason: 'Media ID not found or expired',
                })

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
        } else if (this.isListMessage(body)) {
          // List message validation
          const { interactive } = body
          const sections = interactive.action.sections
          const buttonText = interactive.action.button
          const bodyText = interactive.body.text
          const headerText = interactive.header?.text
          const footerText = interactive.footer?.text

          // Validate sections count
          if (sections.length < 1) {
            this.logger.validationError({
              field: 'action.sections',
              value: '0 sections',
              reason: 'Must provide at least 1 section',
            })

            res.status(400).json({
              error: {
                message: 'Must provide at least 1 section',
                type: 'WhatsAppBusinessAPIError',
                code: 400,
              },
            })

            return
          }

          // Validate character limits
          if (bodyText.length > 1024) {
            this.logger.validationError({
              field: 'body.text',
              value: `${bodyText.length.toString()} characters`,
              reason: 'Body text cannot exceed 1024 characters',
            })

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
            this.logger.validationError({
              field: 'action.button',
              value: `${buttonText.length.toString()} characters`,
              reason: 'Button text cannot exceed 20 characters',
            })

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
            this.logger.validationError({
              field: 'header.text',
              value: `${headerText.length.toString()} characters`,
              reason: 'Header text cannot exceed 60 characters',
            })

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
            this.logger.validationError({
              field: 'footer.text',
              value: `${footerText.length.toString()} characters`,
              reason: 'Footer text cannot exceed 60 characters',
            })

            res.status(400).json({
              error: {
                message: 'Footer text cannot exceed 60 characters',
                type: 'WhatsAppBusinessAPIError',
                code: 400,
              },
            })

            return
          }

          // Validate sections and rows
          let totalRows = 0
          const rowIds = new Set<string>()

          for (const section of sections) {
            if (section.title && section.title.length > 24) {
              this.logger.validationError({
                field: 'action.sections.title',
                value: `${section.title.length.toString()} characters`,
                reason: 'Section title cannot exceed 24 characters',
              })

              res.status(400).json({
                error: {
                  message: 'Section title cannot exceed 24 characters',
                  type: 'WhatsAppBusinessAPIError',
                  code: 400,
                },
              })

              return
            }

            if (section.rows.length < 1) {
              this.logger.validationError({
                field: 'action.sections.rows',
                value: '0 rows',
                reason: 'Each section must have at least 1 row',
              })

              res.status(400).json({
                error: {
                  message: 'Each section must have at least 1 row',
                  type: 'WhatsAppBusinessAPIError',
                  code: 400,
                },
              })

              return
            }

            totalRows += section.rows.length

            for (const row of section.rows) {
              if (row.id.length > 200) {
                this.logger.validationError({
                  field: 'action.sections.rows.id',
                  value: `${row.id.length.toString()} characters`,
                  reason: 'Row ID cannot exceed 200 characters',
                })

                res.status(400).json({
                  error: {
                    message: 'Row ID cannot exceed 200 characters',
                    type: 'WhatsAppBusinessAPIError',
                    code: 400,
                  },
                })

                return
              }

              if (row.title.length > 24) {
                this.logger.validationError({
                  field: 'action.sections.rows.title',
                  value: `${row.title.length.toString()} characters`,
                  reason: 'Row title cannot exceed 24 characters',
                })

                res.status(400).json({
                  error: {
                    message: 'Row title cannot exceed 24 characters',
                    type: 'WhatsAppBusinessAPIError',
                    code: 400,
                  },
                })

                return
              }

              if (row.description && row.description.length > 72) {
                this.logger.validationError({
                  field: 'action.sections.rows.description',
                  value: `${row.description.length.toString()} characters`,
                  reason: 'Row description cannot exceed 72 characters',
                })

                res.status(400).json({
                  error: {
                    message: 'Row description cannot exceed 72 characters',
                    type: 'WhatsAppBusinessAPIError',
                    code: 400,
                  },
                })

                return
              }

              if (rowIds.has(row.id)) {
                this.logger.validationError({
                  field: 'action.sections.rows.id',
                  value: row.id,
                  reason: 'Duplicate row ID found',
                })

                res.status(400).json({
                  error: {
                    message: `Duplicate row ID found: ${row.id}`,
                    type: 'WhatsAppBusinessAPIError',
                    code: 400,
                  },
                })

                return
              }

              rowIds.add(row.id)
            }
          }

          if (totalRows > 10) {
            this.logger.validationError({
              field: 'action.sections.rows',
              value: `${totalRows.toString()} rows`,
              reason:
                'Total number of rows across all sections cannot exceed 10',
            })

            res.status(400).json({
              error: {
                message:
                  'Total number of rows across all sections cannot exceed 10',
                type: 'WhatsAppBusinessAPIError',
                code: 400,
              },
            })

            return
          }
        }
      }

      const messageId = `message_${nanoid(6)}`

      // Normalize WhatsApp ID (remove '+' prefix if present)
      const normalizedTo = normalizeWhatsAppId(to)

      // Log the message based on type
      this.logOutgoingMessage(body, normalizedTo, messageId)

      // Simulate successful message send
      const response: CloudAPIResponse = {
        messaging_product: 'whatsapp',
        contacts: [
          {
            input: normalizedTo,
            wa_id: normalizedTo,
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
          normalizedTo,
          this.businessPhoneNumberId,
          this.displayPhoneNumber,
        )
      }

      res.status(200).json(response)
    } catch (error) {
      this.logger.error('Message send error', {
        details: error instanceof Error ? error.message : String(error),
      })

      res.status(500).json({
        error: {
          message: 'Internal server error during message send',
          type: 'OAuthException',
          code: 500,
        },
      })
    }
  }

  private handleMarkAsRead(req: Request, res: Response): void {
    try {
      const body = req.body as CloudAPIMarkMessageReadRequest
      const { message_id } = body

      this.logger.markAsRead(message_id, {
        direction: 'sent',
        recipient: this.businessPhoneNumberId,
      })

      const response: CloudAPIMarkReadResponse = {
        success: true,
      }

      res.status(200).json(response)
    } catch (error) {
      this.logger.error('Mark as read error', {
        details: error instanceof Error ? error.message : String(error),
      })

      res.status(500).json({
        error: {
          message: 'Internal server error during mark as read',
          type: 'OAuthException',
          code: 500,
        },
      })
    }
  }
}
