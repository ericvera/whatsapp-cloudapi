#!/usr/bin/env node

import { WhatsAppEmulator } from '@whatsapp-cloudapi/emulator'
import { Command } from 'commander'

export interface StartOptions {
  port: string
  host: string
  number: string
}

export interface StatusOptions {
  port: string
  host: string
}

interface HealthCheckResponse {
  status: string
}

async function checkEmulatorStatus(
  host: string,
  port: string,
): Promise<boolean> {
  try {
    const response = await fetch(`http://${host}:${port}/are-you-ok`)
    if (!response.ok) return false
    const data = (await response.json()) as HealthCheckResponse
    return data.status === 'ok'
  } catch {
    return false
  }
}

const program = new Command()

program
  .name('wa-emulator')
  .description('WhatsApp Cloud API Emulator CLI')
  .version('0.8.2')

program
  .command('start')
  .description('Start the WhatsApp Cloud API emulator')
  .option('-p, --port <number>', 'Port to run the emulator on', '4004')
  .option('-h, --host <string>', 'Host to bind to', 'localhost')
  .option('-n, --number <string>', 'Business phone number ID')
  .action(async (options: StartOptions) => {
    const emulator = new WhatsAppEmulator({
      businessPhoneNumberId: options.number,
      port: parseInt(options.port, 10),
      host: options.host,
    })

    try {
      await emulator.start()

      // Handle graceful shutdown
      process.on('SIGINT', () => {
        console.log('\nShutting down emulator...')
        void emulator.stop().then(() => process.exit(0))
      })

      process.on('SIGTERM', () => {
        console.log('\nShutting down emulator...')
        void emulator.stop().then(() => process.exit(0))
      })
    } catch (error) {
      console.error(
        'Failed to start emulator:',
        error instanceof Error ? error.message : 'Unknown error',
      )
      process.exit(1)
    }
  })

program
  .command('status')
  .description('Check if the WhatsApp Cloud API emulator is running')
  .option('-p, --port <number>', 'Port to check', '4004')
  .option('-h, --host <string>', 'Host to check', 'localhost')
  .action(async (options: StatusOptions) => {
    const isRunning = await checkEmulatorStatus(options.host, options.port)
    if (isRunning) {
      console.log(
        `✓ Emulator is running at http://${options.host}:${options.port}`,
      )
      process.exit(0)
    } else {
      console.log('✗ Emulator is not running')
      process.exit(1)
    }
  })

program.parse()
