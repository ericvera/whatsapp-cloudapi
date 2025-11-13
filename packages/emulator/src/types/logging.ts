export type LogLevel = 'quiet' | 'normal' | 'verbose'

export type LogCategory =
  // Sent/received messages
  | 'message'
  // Webhook delivery
  | 'webhook'
  // HTTP requests
  | 'http'
  // Media operations
  | 'media'
  // Validation errors
  | 'validation'
  // Startup/shutdown
  | 'system'
  // All errors
  | 'error'

export interface EmulatorLogConfig {
  /** Controls the verbosity level of logging output */
  level: LogLevel
}

export interface StartupInfo {
  address: string
  phone: string
  phoneId: string
  webhook?: string
  mediaPersistence?: string
}

export interface ShutdownStats {
  messagesSent: number
  messagesReceived: number
  webhooksDelivered: number
  webhooksFailed: number
  uptime: string
}

export interface ErrorDetails {
  recipient?: string
  reason?: string
  details?: string
  field?: string
  value?: unknown
  limit?: unknown
  messageId?: string
}
