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
import { WebhookService } from '../services/WebhookService.js'
import type { EmulatorOptions } from '../types/config.js'
import type { MediaListResponse } from '../types/media.js'
import type { SimulateIncomingMessageResponse } from '../types/simulation.js'

export class WhatsAppEmulator {
  private app: Express | null = null
  private server: Server | null = null
  private config: EmulatorConfiguration | null = null
  private webhookService: WebhookService | undefined
  private messageRoutes: MessageRoutes | null = null
  private mediaRoutes: MediaRoutes | null = null

  constructor(options: EmulatorOptions) {
    this.app = express()
    this.config = new EmulatorConfiguration(options)

    if (this.config.webhook) {
      this.webhookService = new WebhookService(this.config.webhook)
    }

    this.mediaRoutes = new MediaRoutes()
    this.messageRoutes = new MessageRoutes(
      this.config.server.businessPhoneNumberId,
      this.webhookService,
      this.mediaRoutes,
    )

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

    this.setupRoutes()
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

    // Media expiration endpoints - order matters! Specific routes before parameterized ones
    this.app.post('/debug/media/expire/all', (req: Request, res: Response) => {
      this.mediaRoutes?.expireAllMedia(req, res)
    })

    this.app.post('/debug/media/expire/:id', (req: Request, res: Response) => {
      this.mediaRoutes?.expireMedia(req, res)
    })

    // Health check endpoint
    this.app.get('/debug/health', (_req: Request, res: Response) => {
      const response: MediaListResponse = {
        media: [],
        note: `WhatsApp Cloud API Emulator is running on phone number: ${this.config?.server.businessPhoneNumberId ?? 'unknown'}`,
      }
      res.status(200).json(response)
    })

    // Simulate incoming message endpoint
    this.app.post('/debug/simulate-incoming', (req: Request, res: Response) => {
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

        console.log(
          `📥 Simulating incoming message from ${body.from}: "${body.message}"`,
        )

        if (this.webhookService) {
          void this.webhookService.sendIncomingMessage(
            body.from,
            body.name ?? 'Test User',
            body.message,
            this.config?.server.businessPhoneNumberId ?? '',
          )
        }

        const response: SimulateIncomingMessageResponse = {
          message: 'Incoming message simulated successfully',
          from: body.from,
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
    })
  }

  public start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (!this.config) {
          reject(new Error('Emulator configuration not initialized'))
          return
        }

        // Local reference to avoid repeated null checks
        const config = this.config

        const server = this.app?.listen(
          config.server.port,
          config.server.host,
          () => {
            console.log(
              `🚀 WhatsApp Cloud API Emulator started on http://${config.server.host}:${config.server.port.toString()}`,
            )
            console.log(
              `📞 Emulated business phone number ID: ${config.server.businessPhoneNumberId}`,
            )

            if (config.webhook) {
              console.log(`🔗 Webhook URL configured: ${config.webhook.url}`)
            }
            resolve()
          },
        )

        this.server = server ?? null

        server?.on('error', (error: Error) => {
          console.error('❌ Failed to start emulator:', error)
          reject(error)
        })
      } catch (error) {
        console.error('❌ Failed to start emulator:', error)
        reject(
          error instanceof Error
            ? error
            : new Error('Unknown error during start'),
        )
      }
    })
  }

  public stop(): Promise<void> {
    return new Promise((resolve) => {
      try {
        if (this.server) {
          this.server.close(() => {
            this.server = null
            console.log('🛑 WhatsApp Cloud API Emulator stopped')
            resolve()
          })
        } else {
          resolve()
        }
      } catch (error) {
        console.error('❌ Failed to stop emulator:', error)
        // Still resolve to avoid hanging
        resolve()
      }
    })
  }
}
