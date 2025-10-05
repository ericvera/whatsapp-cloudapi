import type { SimulateIncomingTextRequest } from '@whatsapp-cloudapi/types/simulation'
import bodyParser from 'body-parser'
import cors from 'cors'
import type { Express, NextFunction, Request, Response } from 'express'
import express from 'express'
import type { Server } from 'http'
import { EmulatorConfiguration } from '../config/EmulatorConfig.js'
import { SupportedVersion, UnsupportedVersionError } from '../constants.js'
import { MediaRoutes } from '../routes/MediaRoutes.js'
import { MessageRoutes } from '../routes/MessageRoutes.js'
import {
  exportMedia,
  importMedia,
} from '../services/MediaPersistenceService.js'
import { WebhookService } from '../services/WebhookService.js'
import type { EmulatorOptions } from '../types/config.js'
import type { SimulateIncomingMessageResponse } from '../types/simulation.js'
import { normalizeWhatsAppId } from '../utils/phoneUtils.js'

export class WhatsAppEmulator {
  private app: Express | null = null
  private server: Server | null = null
  private config: EmulatorConfiguration | null = null
  private webhookService: WebhookService | undefined
  private messageRoutes: MessageRoutes | null = null
  private mediaRoutes: MediaRoutes | null = null
  private options: EmulatorOptions

  constructor(options: EmulatorOptions) {
    this.options = options
    this.app = express()
    this.config = new EmulatorConfiguration(options)

    if (this.config.webhook) {
      this.webhookService = new WebhookService(this.config.webhook)
    }

    // MediaRoutes will be initialized after potential import
    this.mediaRoutes = null
    this.messageRoutes = null

    this.app.use(cors())
    this.app.use(bodyParser.json())

    this.app.use((_req: Request, _res: Response, next: NextFunction) => {
      console.log(
        `📞 Emulated phone number: ${this.config?.server.businessPhoneNumberId ?? 'unknown'}`,
      )
      next()
    })

    this.app.use((req: Request, _: Response, next: NextFunction) => {
      console.log(`🌐 ${req.method} ${req.url}`)
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
      console.error(
        `❌ Unsupported API version: ${version ?? 'undefined'}. Supported version: ${SupportedVersion}`,
      )
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
      console.error(
        `❌ Phone number ID mismatch: expected ${this.config?.server.businessPhoneNumberId ?? 'unknown'}, got ${phoneNumberId ?? 'undefined'}`,
      )
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
        console.error(
          '❌ Simulate incoming message failed: Missing from or message in request body',
        )
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

      console.log(
        `📥 Simulating incoming message from ${body.from}: "${body.message}"`,
      )

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
      console.error('❌ Simulate incoming message error:', error)
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
      console.log('✅ Webhook endpoint validation successful')
      res.status(200).send(challenge)
    } else {
      console.log('❌ Webhook endpoint validation failed')
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
        console.log(
          `📁 Importing media metadata from: ${this.options.persistence.importPath}`,
        )
        initialMediaStorage = await importMedia(
          this.options.persistence.importPath,
        )
      }

      // Initialize routes with imported media storage
      this.mediaRoutes = new MediaRoutes(initialMediaStorage)
      this.messageRoutes = new MessageRoutes(
        config.server.businessPhoneNumberId,
        config.server.displayPhoneNumber,
        this.webhookService,
        this.mediaRoutes,
      )

      // Setup routes after initialization
      this.setupRoutes()

      const { host, port } = config.server

      this.server = this.app.listen(port, host, () => {
        console.log(
          `🚀 WhatsApp Cloud API Emulator running at http://${host}:${port.toString()}`,
        )
        console.log(
          `📞 Emulating phone number: ${config.server.businessPhoneNumberId}`,
        )

        if (this.options.persistence?.importPath) {
          console.log(
            `📁 Media persistence: Import from ${this.options.persistence.importPath}`,
          )
        }

        if (this.options.persistence?.shouldExport) {
          const exportPath =
            this.options.persistence.exportOnExit ??
            this.options.persistence.importPath
          console.log(
            `💾 Media persistence: Export on exit to ${exportPath ?? 'unknown'}`,
          )
        }
      })
    } catch (error) {
      console.error('❌ Failed to start emulator:', error)
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

        console.log(`💾 Exporting media metadata to: ${exportPath}`)
        await exportMedia(exportPath, this.mediaRoutes.getMediaStorage())
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
        console.log('🛑 Emulator stopped')
      }
    } catch (error) {
      console.error('❌ Error during emulator shutdown:', error)
      throw error
    }
  }
}
