#!/usr/bin/env node

import { WhatsAppEmulator } from '@whatsapp-cloudapi/emulator'
import type { SimulateIncomingTextRequest } from '@whatsapp-cloudapi/types/simulation'
import { Command } from 'commander'
import { getPartialE164PhoneNumber, isValidE164PhoneNumber } from 'e164num'

export interface StartOptions {
  port: string
  host: string
  number: string
}

export interface StatusOptions {
  port: string
  host: string
}

export interface SimulateOptions {
  port: string
  host: string
  from?: string
  name: string
  message: string
}

interface HealthCheckResponse {
  status: string
}

const generateRandomPhoneNumber = (): string => {
  const randomDigits = Math.floor(Math.random() * 10000000)
    .toString()
    .padStart(7, '0')

  return `+1555${randomDigits}`
}

const validatePhoneNumber = (phoneNumber: string): string => {
  try {
    // Convert to E.164 format if needed
    const e164Number = getPartialE164PhoneNumber(phoneNumber)

    if (!isValidE164PhoneNumber(e164Number)) {
      throw new Error(
        `Invalid phone number: ${phoneNumber}. Use E.164 format (e.g., +1234567890)`,
      )
    }

    return e164Number
  } catch {
    throw new Error(
      `Invalid phone number: ${phoneNumber}. Use E.164 format (e.g., +1234567890)`,
    )
  }
}

const checkEmulatorStatus = async (
  host: string,
  port: string,
): Promise<boolean> => {
  try {
    const response = await fetch(`http://${host}:${port}/are-you-ok`)

    if (!response.ok) {
      return false
    }

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
        `✓ Emulator is running at http://${options.host}:${String(options.port)}`,
      )
      process.exit(0)
    } else {
      console.log('✗ Emulator is not running')
      process.exit(1)
    }
  })

program
  .command('simulate')
  .description('Simulate incoming messages to trigger webhooks')
  .argument('<type>', 'Type of message to simulate (currently only "text")')
  .option('-p, --port <number>', 'Port where emulator is running', '4004')
  .option('-h, --host <string>', 'Host where emulator is running', 'localhost')
  .option(
    '-f, --from <phone>',
    'Phone number of sender in E.164 format (auto-generated if not provided)',
  )
  .option('-n, --name <name>', 'Name of sender', 'Test User')
  .option('-m, --message <text>', 'Message text (required)')
  .action(async (type: string, options: SimulateOptions) => {
    if (type !== 'text') {
      console.error('Error: Only "text" is currently supported')
      process.exit(1)
    }

    if (!options.message) {
      console.error('Error: --message is required')
      process.exit(1)
    }

    try {
      // Handle phone number - auto-generate or validate provided
      let from: string

      if (options.from) {
        from = validatePhoneNumber(options.from)
      } else {
        from = generateRandomPhoneNumber()
      }

      const requestBody: SimulateIncomingTextRequest = {
        from,
        name: options.name,
        message: options.message,
      }

      const response = await fetch(
        `http://${options.host}:${options.port}/simulate/incoming/text`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        },
      )

      if (!response.ok) {
        const error = await response.text()

        console.error(
          `Failed to simulate message: ${String(response.status)} ${error}`,
        )
        process.exit(1)
      }

      console.log(
        `✓ Simulated incoming text from ${from} (${options.name}): "${options.message}"`,
      )
    } catch (error) {
      console.error(
        'Error:',
        error instanceof Error ? error.message : 'Unknown error',
      )
      process.exit(1)
    }
  })

program.parse()
