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
  /**
   * Secret token for webhook endpoint validation (used for GET /webhook
   * verification)
   */
  secret: string
  /** Optional timeout in milliseconds for webhook requests (defaults to 5000) */
  timeout?: number
}

export interface EmulatorPersistenceConfig {
  /** Directory to import media metadata from */
  importPath?: string
  /** Directory to export media metadata to (defaults to importPath if not specified) */
  exportOnExit?: string
  /** Whether export was explicitly requested */
  shouldExport: boolean
}

export interface EmulatorOptions extends EmulatorConfig {
  /** Webhook configuration */
  webhook?: EmulatorWebhookConfig
  /** Media persistence configuration */
  persistence?: EmulatorPersistenceConfig
}
