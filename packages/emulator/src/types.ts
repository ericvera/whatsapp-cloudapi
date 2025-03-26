export interface EmulatorOptions {
  /** Business phone number ID to emulate */
  businessPhoneNumberId: string
  /** Port to run the emulator server on */
  port?: number
  /** Host to bind to (defaults to localhost) */
  host?: string
  /** Simulate network delay in milliseconds */
  delay?: number
}
