import type {
  EmulatorConfig,
  EmulatorOptions,
  EmulatorWebhookConfig,
} from '../types/index.js'

export class EmulatorConfiguration {
  public readonly server: Required<EmulatorConfig>
  public readonly webhook: Required<EmulatorWebhookConfig> | undefined

  constructor(options: EmulatorOptions) {
    const { webhook, ...serverOptions } = options

    this.server = {
      host: 'localhost',
      port: 4004,
      delay: 0,
      ...serverOptions,
    }

    this.webhook = webhook
      ? {
          timeout: 5000,
          ...webhook,
        }
      : undefined
  }

  public getServerUrl(): URL {
    return new URL(`http://${this.server.host}:${this.server.port.toString()}`)
  }
}
