import bodyParser from 'body-parser'
import cors from 'cors'
import type { Express, NextFunction, Request, Response } from 'express'
import express from 'express'
import type { Server } from 'http'
import type { SimulateIncomingTextRequest } from '../../../types/src/simulation/request.js'
import { EmulatorConfiguration } from '../config/EmulatorConfig.js'
import { SupportedVersion, UnsupportedVersionError } from '../constants.js'
import { MessageRoutes } from '../routes/MessageRoutes.js'
import { WebhookService } from '../services/WebhookService.js'
import type { EmulatorOptions } from '../types/config.js'

export class WhatsAppEmulator {
  private server: Server | null = null
  private app: Express | null = null
  private readonly config: EmulatorConfiguration
  private readonly webhookService: WebhookService | undefined
  private readonly messageRoutes: MessageRoutes

  constructor(options: EmulatorOptions) {
    this.config = new EmulatorConfiguration(options)

    if (this.config.webhook) {
      this.webhookService = new WebhookService(this.config.webhook)
    }

    this.messageRoutes = new MessageRoutes(
      this.config.server.businessPhoneNumberId,
      this.webhookService,
    )
  }

  private setupApp(): void {
    this.app = express()
    this.app.use(cors())
    this.app.use(bodyParser.json())

    // Add artificial delay if configured
    if (this.config.server.delay > 0) {
      this.app.use((_req: Request, _res: Response, next: NextFunction) => {
        setTimeout(next, this.config.server.delay)
      })
    }

    this.setupRoutes()
  }

  private validateVersion(
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    const version = req.params['version']

    if (!version || version !== SupportedVersion) {
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

    if (!phoneNumberId) {
      res.status(400).json({ error: 'Phone number ID is required' })
      return
    }

    if (phoneNumberId !== this.config.server.businessPhoneNumberId) {
      res.status(400).json({
        error: 'Invalid phone number ID',
        expected: this.config.server.businessPhoneNumberId,
        received: phoneNumberId,
      })
      return
    }

    next()
  }

  private setupRoutes(): void {
    if (!this.app) {
      throw new Error('App not initialized')
    }

    // Health check endpoint
    this.app.get('/are-you-ok', (_req: Request, res: Response) => {
      res.json({ status: 'ok' })
    })

    // WhatsApp Cloud API endpoints with version validation
    this.app.post(
      '/:version/:phoneNumberId/messages',
      this.validateVersion.bind(this),
      this.validatePhoneNumberId.bind(this),
      this.messageRoutes.handleSendMessage.bind(this.messageRoutes),
    )

    // Simulation endpoints for testing
    this.app.post('/simulate/incoming/text', (req: Request, res: Response) => {
      if (!this.webhookService) {
        res.status(400).json({
          error:
            'Webhook not configured. Please configure webhook when starting the emulator.',
        })
        return
      }

      const body = req.body as Partial<SimulateIncomingTextRequest>
      const { from, name = 'Test User', message } = body

      if (
        !from ||
        !message ||
        typeof from !== 'string' ||
        typeof message !== 'string'
      ) {
        res
          .status(400)
          .json({ error: 'from and message are required and must be strings' })
        return
      }

      const contactName = typeof name === 'string' ? name : 'Test User'

      console.log(
        `📲 Incoming message from ${from} (${contactName}): "${message}"`,
      )

      void this.webhookService.sendIncomingMessage(
        from,
        contactName,
        message,
        this.config.server.businessPhoneNumberId,
      )

      res.json({ success: true, messageSimulated: true })
    })

    // Catch-all route for unhandled requests (must be last)
    this.app.use('*', (req: Request, res: Response) => {
      // Log the unhandled request for troubleshooting
      console.log(`❌ Unhandled request: ${req.method} ${req.originalUrl}`)

      // Log headers (always safe)
      console.log(`   Headers: ${JSON.stringify(req.headers, null, 2)}`)

      // Log body if present
      if (req.body) {
        try {
          const bodyStr = JSON.stringify(req.body, null, 2)

          if (bodyStr !== '{}' && bodyStr !== 'null') {
            console.log(`   Body: ${bodyStr}`)
          }
        } catch {
          console.log(`   Body: [unable to stringify]`)
        }
      }

      // Log query parameters if present
      const queryStr = JSON.stringify(req.query, null, 2)

      if (queryStr !== '{}') {
        console.log(`   Query: ${queryStr}`)
      }

      // Return helpful error response
      const availableRoutes = [
        `GET /are-you-ok`,
        `POST /v{version}/{phoneNumberId}/messages (phoneNumberId must be: ${this.config.server.businessPhoneNumberId})`,
        `POST /simulate/incoming/text`,
      ]

      res.status(404).json({
        error: 'Route not found',
        message: `The endpoint ${req.method} ${req.originalUrl} is not supported by the WhatsApp Cloud API emulator`,
        availableRoutes,
        documentation: 'See the emulator documentation for supported endpoints',
      })
    })
  }

  /**
   * Start the emulator server
   * @throws {Error} If the server fails to start
   */
  public async start(): Promise<void> {
    this.setupApp()

    if (!this.app) {
      throw new Error('App not initialized')
    }

    return new Promise((resolve, reject) => {
      try {
        const server = this.app?.listen(
          this.config.server.port,
          this.config.server.host,
          () => {
            const url = this.config.getServerUrl()

            console.log(`WhatsApp emulator running at ${url.toString()}`)
            if (this.webhookService && this.config.webhook?.url) {
              console.log(
                `Webhook notifications will be sent to ${this.config.webhook.url}`,
              )
            }
            resolve()
          },
        )

        if (!server) {
          throw new Error('Failed to create server')
        }

        this.server = server

        server.on('error', (error: Error) => {
          reject(new Error(`Failed to start emulator: ${error.message}`))
        })
      } catch (error) {
        reject(
          new Error(
            `Failed to start emulator: ${error instanceof Error ? error.message : 'Unknown error'}`,
          ),
        )
      }
    })
  }

  /**
   * Stop the emulator server
   * @throws {Error} If the server fails to stop
   */
  public async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        resolve()
        return
      }

      this.server.close((error?: Error) => {
        if (error) {
          reject(new Error(`Failed to stop emulator: ${error.message}`))
          return
        }
        this.server = null
        this.app = null
        resolve()
      })
    })
  }
}
