export interface EmulatorConfig {
  /** Business phone number ID to emulate */
  businessPhoneNumberId: string
  /** Port to run the emulator server on */
  port?: number
  /** Host to bind to (defaults to localhost) */
  host?: string
  /** Simulate network delay in milliseconds */
  delay?: number
}

export interface EmulatorWebhookConfig {
  /** URL to send webhook events to */
  url: string
  /** Required secret token for webhook verification */
  secret: string
  /** Optional timeout in milliseconds for webhook requests (defaults to 5000) */
  timeout?: number
}

export interface EmulatorOptions extends EmulatorConfig {
  /** Webhook configuration */
  webhook?: EmulatorWebhookConfig
}
