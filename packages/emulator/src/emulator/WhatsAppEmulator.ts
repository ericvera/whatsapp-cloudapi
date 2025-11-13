import type {
  SimulateIncomingInteractiveRequest,
  SimulateIncomingTextRequest,
} from '@whatsapp-cloudapi/types/simulation'
import bodyParser from 'body-parser'
import cors from 'cors'
import type { Express, NextFunction, Request, Response } from 'express'
import express from 'express'
import type { Server } from 'http'
import { EmulatorConfiguration } from '../config/EmulatorConfig.js'
import { SupportedVersion, UnsupportedVersionError } from '../constants.js'
import { MediaRoutes } from '../routes/MediaRoutes.js'
import { MessageRoutes } from '../routes/MessageRoutes.js'
import { EmulatorLogger } from '../services/Logger.js'
import {
  exportMedia,
  importMedia,
} from '../services/MediaPersistenceService.js'
import { WebhookService } from '../services/WebhookService.js'
import type { EmulatorOptions } from '../types/config.js'
import type {
  SimulateIncomingInteractiveResponse,
  SimulateIncomingMessageResponse,
} from '../types/simulation.js'
import { normalizeWhatsAppId } from '../utils/phoneUtils.js'

export class WhatsAppEmulator {
  private app: Express | null = null
  private server: Server | null = null
  private config: EmulatorConfiguration | null = null
  private webhookService: WebhookService | undefined
  private messageRoutes: MessageRoutes | null = null
  private mediaRoutes: MediaRoutes | null = null
  private options: EmulatorOptions
  private logger: EmulatorLogger

  constructor(options: EmulatorOptions) {
    this.options = options
    this.logger = new EmulatorLogger(options.log)
    this.app = express()
    this.config = new EmulatorConfiguration(options)

    if (this.config.webhook) {
      this.webhookService = new WebhookService(this.config.webhook, this.logger)
    }

    // MediaRoutes will be initialized after potential import
    this.mediaRoutes = null
    this.messageRoutes = null

    this.app.use(cors())
    this.app.use(bodyParser.json())

    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now()

      res.on('finish', () => {
        const duration = Date.now() - startTime
        this.logger.httpRequest(req.method, req.url, res.statusCode, duration)
      })
      next()
    })
  }

  private validateVersion(
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    const version = req.params['version']
    if (version !== SupportedVersion) {
      this.logger.validationError({
        field: 'version',
        value: version,
        reason: `Unsupported API version. Supported version: ${SupportedVersion}`,
      })
      res.status(400).json(UnsupportedVersionError)
      return
    }

    next()
  }

  private validatePhoneNumberId(
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    const phoneNumberId = req.params['phoneNumberId']

    if (phoneNumberId !== this.config?.server.businessPhoneNumberId) {
      this.logger.validationError({
        field: 'phoneNumberId',
        value: phoneNumberId,
        reason: `Phone number ID mismatch: expected ${this.config?.server.businessPhoneNumberId ?? 'unknown'}`,
      })

      res.status(400).json({
        error: {
          message: `Phone number ID ${phoneNumberId ?? 'undefined'} not found`,
          type: 'OAuthException',
          code: 400,
        },
      })
      return
    }
    next()
  }

  private handleSimulateIncomingMessage(req: Request, res: Response): void {
    try {
      const body = req.body as Partial<SimulateIncomingTextRequest>

      if (!body.from || !body.message) {
        this.logger.validationError({
          reason: 'Missing from or message in request body',
          details: 'Both "from" and "message" are required in request body',
        })

        res.status(400).json({
          error: {
            message: 'Both "from" and "message" are required in request body',
            type: 'ValidationError',
            code: 400,
          },
        })
        return
      }

      // Normalize the sender ID (remove '+' prefix if present)
      const normalizedFrom = normalizeWhatsAppId(body.from)

      this.logger.textMessage(body.message, {
        direction: 'received',
        sender: normalizedFrom,
        ...(body.name ? { senderName: body.name } : {}),
      })

      if (this.webhookService) {
        void this.webhookService.sendIncomingMessage(
          normalizedFrom,
          body.name ?? 'Test User',
          body.message,
          this.config?.server.businessPhoneNumberId ?? '',
          this.config?.server.displayPhoneNumber ?? '',
        )
      }

      const response: SimulateIncomingMessageResponse = {
        message: 'Incoming message simulated successfully',
        input: body.from,
        from: normalizedFrom,
        text: body.message,
      }

      res.status(200).json(response)
    } catch (error) {
      this.logger.error('Simulate incoming message error', {
        details: String(error),
      })

      res.status(500).json({
        error: {
          message: 'Internal server error during message simulation',
          type: 'InternalServerError',
          code: 500,
        },
      })
    }
  }

  private handleSimulateIncomingInteractive(req: Request, res: Response): void {
    try {
      const body = req.body as Partial<SimulateIncomingInteractiveRequest>

      if (!body.from || !body.interactive_type) {
        this.logger.validationError({
          reason: 'Missing from or interactive_type in request body',
          details:
            'Both "from" and "interactive_type" are required in request body',
        })

        res.status(400).json({
          error: {
            message:
              'Both "from" and "interactive_type" are required in request body',
            type: 'ValidationError',
            code: 400,
          },
        })
        return
      }

      // Validate interactive_type
      if (
        body.interactive_type !== 'button_reply' &&
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        body.interactive_type !== 'list_reply'
      ) {
        this.logger.validationError({
          field: 'interactive_type',
          value: body.interactive_type,
          reason:
            'interactive_type must be either "button_reply" or "list_reply"',
        })

        res.status(400).json({
          error: {
            message:
              'interactive_type must be either "button_reply" or "list_reply"',
            type: 'ValidationError',
            code: 400,
          },
        })
        return
      }

      // Validate button_reply fields
      if (body.interactive_type === 'button_reply') {
        if (!body.button_id) {
          this.logger.validationError({
            field: 'button_id',
            reason:
              'button_id is required when interactive_type is "button_reply"',
          })

          res.status(400).json({
            error: {
              message:
                '"button_id" is required when interactive_type is "button_reply"',
              type: 'ValidationError',
              code: 400,
            },
          })
          return
        }
      }

      // Validate list_reply fields
      if (body.interactive_type === 'list_reply') {
        if (!body.list_item_id) {
          this.logger.validationError({
            field: 'list_item_id',
            reason:
              'list_item_id is required when interactive_type is "list_reply"',
          })

          res.status(400).json({
            error: {
              message:
                '"list_item_id" is required when interactive_type is "list_reply"',
              type: 'ValidationError',
              code: 400,
            },
          })
          return
        }
      }

      // Normalize the sender ID (remove '+' prefix if present)
      const normalizedFrom = normalizeWhatsAppId(body.from)

      if (body.interactive_type === 'button_reply') {
        const buttonId = body.button_id ?? ''
        const buttonTitle = body.button_title ?? buttonId

        // Note: We'll log button replies as text messages for now
        // The logger could be extended with a specific button reply formatter
        this.logger.textMessage(`Button: ${buttonTitle}`, {
          direction: 'received',
          sender: normalizedFrom,
          ...(body.name ? { senderName: body.name } : {}),
        })

        if (this.webhookService) {
          void this.webhookService.sendIncomingButtonReply(
            normalizedFrom,
            body.name ?? 'Test User',
            buttonId,
            buttonTitle,
            this.config?.server.businessPhoneNumberId ?? '',
            this.config?.server.displayPhoneNumber ?? '',
          )
        }

        const response: SimulateIncomingInteractiveResponse = {
          message: 'Interactive message simulated successfully',
          from: normalizedFrom,
          interactive_type: 'button_reply',
          details: {
            id: buttonId,
            title: buttonTitle,
          },
        }

        res.status(200).json(response)
      } else {
        // list_reply
        const listItemId = body.list_item_id ?? ''
        const listItemTitle = body.list_item_title ?? listItemId
        const listItemDescription = body.list_item_description ?? ''

        // Note: We'll log list replies as text messages for now
        // The logger could be extended with a specific list reply formatter
        this.logger.textMessage(`List: ${listItemTitle}`, {
          direction: 'received',
          sender: normalizedFrom,
          ...(body.name ? { senderName: body.name } : {}),
        })

        if (this.webhookService) {
          void this.webhookService.sendIncomingListReply(
            normalizedFrom,
            body.name ?? 'Test User',
            listItemId,
            listItemTitle,
            listItemDescription,
            this.config?.server.businessPhoneNumberId ?? '',
            this.config?.server.displayPhoneNumber ?? '',
          )
        }

        const response: SimulateIncomingInteractiveResponse = {
          message: 'Interactive message simulated successfully',
          from: normalizedFrom,
          interactive_type: 'list_reply',
          details: {
            id: listItemId,
            title: listItemTitle,
            description: listItemDescription,
          },
        }

        res.status(200).json(response)
      }
    } catch (error) {
      this.logger.error('Simulate interactive message error', {
        details: String(error),
      })

      res.status(500).json({
        error: {
          message: 'Internal server error during message simulation',
          type: 'InternalServerError',
          code: 500,
        },
      })
    }
  }

  private handleWebhookValidation(req: Request, res: Response): void {
    const mode = req.query['hub.mode']
    const token = req.query['hub.verify_token']
    const challenge = req.query['hub.challenge']

    if (
      mode === 'subscribe' &&
      this.config?.webhook?.secret &&
      token === this.config.webhook.secret
    ) {
      res.status(200).send(challenge)
    } else {
      this.logger.validationError({
        reason: 'Webhook validation failed',
        details: 'Invalid verification token or mode',
      })

      res.status(403).json({
        error: {
          message: 'Webhook validation failed',
          type: 'ValidationError',
          code: 403,
        },
      })
    }
  }

  private setupRoutes(): void {
    if (!this.app || !this.messageRoutes || !this.mediaRoutes) {
      throw new Error('App or routes not initialized')
    }

    // Message sending routes
    this.app.post(
      '/:version/:phoneNumberId/messages',
      this.validateVersion.bind(this),
      this.validatePhoneNumberId.bind(this),
      this.messageRoutes.handleSendMessage.bind(this.messageRoutes),
    )

    // Media upload routes
    this.app.post(
      '/:version/:phoneNumberId/media',
      this.validateVersion.bind(this),
      this.validatePhoneNumberId.bind(this),
      this.mediaRoutes.handleMediaUpload.bind(this.mediaRoutes),
    )

    // Debug endpoints for development and testing
    this.app.get('/debug/media/list', (req: Request, res: Response) => {
      this.mediaRoutes?.listMedia(req, res)
    })

    // Media expiration endpoints - order matters! Specific routes before
    // parameterized ones
    this.app.post('/debug/media/expire/all', (req: Request, res: Response) => {
      this.mediaRoutes?.expireAllMedia(req, res)
    })

    this.app.post('/debug/media/expire/:id', (req: Request, res: Response) => {
      this.mediaRoutes?.expireMedia(req, res)
    })

    // Debug health check endpoint
    this.app.get('/debug/health', (_req: Request, res: Response) => {
      res.status(200).json({ status: 'ok' })
    })

    // Debug simulate incoming text endpoint
    this.app.post(
      '/debug/messages/send-text',
      this.handleSimulateIncomingMessage.bind(this),
    )

    // Debug simulate incoming interactive endpoint
    this.app.post(
      '/debug/messages/send-interactive',
      this.handleSimulateIncomingInteractive.bind(this),
    )

    // Webhook validation endpoint
    this.app.get('/webhook', this.handleWebhookValidation.bind(this))
  }

  public async start(): Promise<void> {
    if (!this.app || !this.config) {
      throw new Error('Emulator not properly initialized')
    }

    // Local reference after null check
    const config = this.config

    try {
      // Import media metadata if specified
      let initialMediaStorage

      if (this.options.persistence?.importPath) {
        initialMediaStorage = await importMedia(
          this.options.persistence.importPath,
          this.logger,
        )
      }

      // Initialize routes with imported media storage
      this.mediaRoutes = new MediaRoutes(this.logger, initialMediaStorage)
      this.messageRoutes = new MessageRoutes(
        config.server.businessPhoneNumberId,
        config.server.displayPhoneNumber,
        this.webhookService,
        this.mediaRoutes,
        this.logger,
      )

      // Setup routes after initialization
      this.setupRoutes()

      const { host, port } = config.server

      this.server = this.app.listen(port, host, () => {
        this.logger.startup({
          address: `http://${host}:${port.toString()}`,
          phone: config.server.displayPhoneNumber,
          phoneId: config.server.businessPhoneNumberId,
          ...(this.options.webhook?.url
            ? { webhook: this.options.webhook.url }
            : {}),
          ...(this.options.persistence?.shouldExport
            ? {
                mediaPersistence:
                  this.options.persistence.exportOnExit ??
                  this.options.persistence.importPath,
              }
            : {}),
        })
      })
    } catch (error) {
      this.logger.error('Failed to start emulator', {
        details: String(error),
      })
      throw error
    }
  }

  public async stop(): Promise<void> {
    try {
      // Export media metadata if specified
      if (this.options.persistence?.shouldExport && this.mediaRoutes) {
        const exportPath =
          this.options.persistence.exportOnExit ??
          this.options.persistence.importPath

        if (!exportPath) {
          throw new Error('Export path is required when shouldExport is true')
        }

        await exportMedia(
          exportPath,
          this.mediaRoutes.getMediaStorage(),
          this.logger,
        )
      }

      if (this.server) {
        await new Promise<void>((resolve, reject) => {
          this.server?.close((error) => {
            if (error) {
              reject(error)
            } else {
              resolve()
            }
          })
        })

        this.server = null
        this.logger.shutdown()
      }
    } catch (error) {
      this.logger.error('Error during emulator shutdown', {
        details: String(error),
      })
      throw error
    }
  }
}
