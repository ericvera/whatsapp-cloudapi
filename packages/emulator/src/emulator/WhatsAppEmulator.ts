import bodyParser from 'body-parser'
import cors from 'cors'
import type { Express, NextFunction, Request, Response } from 'express'
import express from 'express'
import type { Server } from 'http'
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
      `/:version/${this.config.server.businessPhoneNumberId}/messages`,
      this.validateVersion.bind(this),
      this.messageRoutes.handleSendMessage.bind(this.messageRoutes),
    )
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
