export interface EmulatorConfig {
  /**
   * Business phone number ID to emulate
   * This is the ID used by the Cloud API (e.g., "50000000000001")
   */
  businessPhoneNumberId: string
  /**
   * Display phone number (optional)
   * The actual phone number shown to users (e.g., "17871231234")
   * If not provided, will be derived from businessPhoneNumberId
   */
  displayPhoneNumber?: string
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
   * Verify token for webhook endpoint validation (used for GET /webhook
   * subscription verification). This is the token you configure in the Meta
   * App Dashboard.
   */
  verifyToken: string
  /**
   * App secret used to generate X-Hub-Signature-256 header for webhook
   * requests. When provided, outgoing webhook requests will include a signature
   * that recipients can use to verify the request authenticity.
   */
  appSecret?: string
  /**
   * Optional timeout in milliseconds for webhook requests (defaults to
   * 5000)
   */
  timeout?: number
}

export interface EmulatorPersistenceConfig {
  /** Directory to import media metadata from */
  importPath?: string
  /**
   * Directory to export media metadata to (defaults to importPath if not
   * specified)
   */
  exportOnExit?: string
  /** Whether export was explicitly requested */
  shouldExport: boolean
}

export interface EmulatorOptions extends EmulatorConfig {
  /** Webhook configuration */
  webhook?: EmulatorWebhookConfig
  /** Media persistence configuration */
  persistence?: EmulatorPersistenceConfig
  /** Logging configuration */
  log?: {
    level?: 'quiet' | 'normal' | 'verbose'
  }
}
