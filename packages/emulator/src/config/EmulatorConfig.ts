import type {
  EmulatorConfig,
  EmulatorOptions,
  EmulatorWebhookConfig,
} from '../types/index.js'
import { normalizeWhatsAppId } from '../utils/phoneUtils.js'

export class EmulatorConfiguration {
  public readonly server: Required<EmulatorConfig>
  public readonly webhook: EmulatorWebhookConfig | undefined

  constructor(options: EmulatorOptions) {
    const { webhook, ...serverOptions } = options

    const normalizedBusinessPhoneNumberId = normalizeWhatsAppId(
      serverOptions.businessPhoneNumberId,
    )

    // Generate display phone number: 1555 + last 7 digits of
    // businessPhoneNumberId
    const defaultDisplayPhoneNumber = `1555${normalizedBusinessPhoneNumberId.slice(-7)}`

    this.server = {
      host: 'localhost',
      port: 4004,
      delay: 0,
      ...serverOptions,
      // Normalize business phone number ID
      businessPhoneNumberId: normalizedBusinessPhoneNumberId,
      // Use provided displayPhoneNumber or generate default
      displayPhoneNumber:
        serverOptions.displayPhoneNumber !== undefined
          ? normalizeWhatsAppId(serverOptions.displayPhoneNumber)
          : defaultDisplayPhoneNumber,
    }

    this.webhook = webhook
  }

  public getServerUrl(): URL {
    return new URL(`http://${this.server.host}:${this.server.port.toString()}`)
  }
}
