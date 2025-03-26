import type {
  CloudAPIResponse,
  CloudAPISendTextMessageRequest,
} from '@whatsapp-cloudapi/types/cloudapi'
import bodyParser from 'body-parser'
import cors from 'cors'
import type { Express, NextFunction, Request, Response } from 'express'
import express from 'express'
import type { Server } from 'http'
import { SupportedVersion, UnsupportedVersionError } from './constants.js'
import type { EmulatorOptions } from './types.js'

export class WhatsAppEmulator {
  private server: Server | null = null
  private app: Express | null = null
  private readonly options: Required<EmulatorOptions>

  constructor(options: EmulatorOptions) {
    this.options = {
      host: 'localhost',
      port: 4004,
      delay: 0,
      ...options,
    }
  }

  private setupApp(): void {
    this.app = express()
    this.app.use(cors())
    this.app.use(bodyParser.json())

    // Add artificial delay if configured
    if (this.options.delay > 0) {
      this.app.use((_req: Request, _res: Response, next: NextFunction) => {
        setTimeout(next, this.options.delay)
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
      `/:version/${this.options.businessPhoneNumberId}/messages`,
      this.validateVersion.bind(this),
      this.handleSendMessage.bind(this),
    )
  }

  private handleSendMessage(req: Request, res: Response): void {
    const { to } = req.body as CloudAPISendTextMessageRequest

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
          id: `mock_${String(Date.now())}_${Math.random().toString(36).slice(2)}`,
        },
      ],
    }
    res.status(200).json(response)
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
          this.options.port,
          this.options.host,
          () => {
            console.log(
              `WhatsApp emulator running at http://${this.options.host}:${String(this.options.port)}`,
            )
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

      const server = this.server
      server.close((error?: Error) => {
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
