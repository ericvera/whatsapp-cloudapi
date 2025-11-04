#!/usr/bin/env node

import type {
  EmulatorOptions,
  MediaExpireResponse,
  MediaListResponse,
} from '@whatsapp-cloudapi/emulator'
import { WhatsAppEmulator } from '@whatsapp-cloudapi/emulator'
import type { SimulateIncomingTextRequest } from '@whatsapp-cloudapi/types/simulation'
import { Command } from 'commander'
import { getPartialE164PhoneNumber, isValidE164PhoneNumber } from 'e164num'

export interface StartOptions {
  port: string
  host: string
  number: string
  webhookUrl?: string
  webhookSecret?: string
  webhookTimeout?: string
  import?: string
  exportOnExit?: string | boolean
}

export interface StatusOptions {
  port: string
  host: string
}

export interface SimulateOptions {
  port: string
  host: string
  from?: string
  name?: string
  message: string
  areaCodes?: string
}

interface HealthCheckResponse {
  status: string
}

const generateRandomPhoneNumber = (areaCodes?: string[]): string => {
  // Puerto Rico + one US area code
  const defaultAreaCodes = ['787', '939', '610']
  const availableAreaCodes = areaCodes ?? defaultAreaCodes

  const randomIndex = Math.floor(Math.random() * availableAreaCodes.length)
  const areaCode = availableAreaCodes[randomIndex] ?? '787'

  // Generate valid exchange (avoid 555 and other reserved ranges)
  let exchange: string
  do {
    exchange = (Math.floor(Math.random() * 900) + 100).toString()
  } while (
    exchange === '555' ||
    exchange.startsWith('0') ||
    exchange.startsWith('1')
  )

  const line = (Math.floor(Math.random() * 9000) + 1000).toString()
  return `+1${areaCode}${exchange}${line}`
}

const generateRandomName = (): string => {
  const normalNames = [
    // Name only
    'Ty',
    'Andre S.',
    'Marcus',
    'L.J.',

    // First + Last
    'James Kim',
    'Maria J. Santos',

    // Two last names
    'Maria Santos Lopez',
    'David Johnson-Smith',
    'Antonio J. Rodriguez Garcia',

    // Single last name
    'Vera',
  ]

  const invalidNames = [
    // Too short, no vowel
    'X',
    // Just emojis/characters, no letters
    '🦄✨',
    // 3+ letters but no vowel
    'Qwx',
  ]

  const allNames = [...normalNames, ...invalidNames]
  const randomIndex = Math.floor(Math.random() * allNames.length)
  return allNames[randomIndex] ?? 'Test User'
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
    const response = await fetch(`http://${host}:${port}/debug/health`)

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
  .option('--webhook-url <url>', 'URL to send webhook events to')
  .option('--webhook-secret <secret>', 'Secret token for webhook verification')
  .option(
    '--webhook-timeout <ms>',
    'Timeout in milliseconds for webhook requests',
    '5000',
  )
  .option('--import <path>', 'Directory to import media metadata from')
  .option(
    '--export-on-exit [path]',
    'Export media metadata on shutdown (uses import path if no path provided)',
  )
  .action(async (options: StartOptions) => {
    if (!options.number) {
      console.error('Error: Business phone number ID is required (--number)')
      process.exit(1)
    }

    const emulatorConfig: EmulatorOptions = {
      businessPhoneNumberId: options.number,
      port: parseInt(options.port, 10),
      host: options.host,
    }

    // Add webhook configuration if provided
    if (options.webhookUrl && options.webhookSecret) {
      emulatorConfig.webhook = {
        url: options.webhookUrl,
        secret: options.webhookSecret,
        timeout: parseInt(options.webhookTimeout ?? '5000', 10),
      }
    } else if (options.webhookUrl || options.webhookSecret) {
      console.error(
        'Error: Both --webhook-url and --webhook-secret are required for webhook configuration',
      )
      process.exit(1)
    }

    // Add persistence configuration if provided
    if (options.import || options.exportOnExit !== undefined) {
      if (
        options.exportOnExit !== undefined &&
        !options.exportOnExit &&
        !options.import
      ) {
        console.error(
          'Error: --export-on-exit requires a path or --import to be specified',
        )
        process.exit(1)
      }

      emulatorConfig.persistence = {
        ...(options.import && { importPath: options.import }),
        ...(typeof options.exportOnExit === 'string' && {
          exportOnExit: options.exportOnExit,
          shouldExport: true,
        }),
        ...(typeof options.exportOnExit === 'boolean' &&
          options.import && { exportOnExit: options.import }),
        shouldExport: options.exportOnExit !== undefined,
      }
    }

    const emulator = new WhatsAppEmulator(emulatorConfig)

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

const simulateCommand = program
  .command('simulate')
  .description('Simulate incoming messages to trigger webhooks')

simulateCommand
  .command('text')
  .description('Simulate an incoming text message')
  .option('-p, --port <number>', 'Port where emulator is running', '4004')
  .option('-h, --host <string>', 'Host where emulator is running', 'localhost')
  .option(
    '-f, --from <phone>',
    'Phone number of sender in E.164 format (auto-generated if not provided)',
  )
  .option(
    '-n, --name [name]',
    'Name of sender (auto-generated if not provided)',
  )
  .option('-m, --message <text>', 'Message text (required)')
  .option(
    '--area-codes <codes>',
    'Comma-separated area codes for random phone generation (default: "787,939,610")',
  )
  .action(async (options: SimulateOptions) => {
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
        const areaCodes = options.areaCodes
          ?.split(',')
          .map((code) => code.trim())
        from = generateRandomPhoneNumber(areaCodes)
      }

      // Handle name - use provided or generate random
      const name = options.name ?? generateRandomName()

      const requestBody: SimulateIncomingTextRequest = {
        from,
        name,
        message: options.message,
      }

      const response = await fetch(
        `http://${options.host}:${options.port}/debug/messages/send-text`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        },
      )

      if (!response.ok) {
        const error = await response.text()

        console.error(
          `Failed to simulate message: ${response.status.toString()} ${error}`,
        )
        process.exit(1)
      }

      console.log(
        `✓ Simulated incoming text from ${from} (${name}): "${options.message}"`,
      )
    } catch (error) {
      console.error(
        'Error:',
        error instanceof Error ? error.message : 'Unknown error',
      )
      process.exit(1)
    }
  })

simulateCommand
  .command('button-reply')
  .description('Simulate a button click response')
  .option('-p, --port <number>', 'Port where emulator is running', '4004')
  .option('-h, --host <string>', 'Host where emulator is running', 'localhost')
  .requiredOption(
    '-f, --from <phone>',
    'Phone number of sender in E.164 format',
  )
  .requiredOption('--id <id>', 'Button ID that was clicked')
  .option('--title <title>', 'Button title text (defaults to ID)')
  .option('-n, --name <name>', 'Name of sender (defaults to "Test User")')
  .action(
    async (options: {
      port: string
      host: string
      from: string
      id: string
      title?: string
      name?: string
    }) => {
      try {
        const from = validatePhoneNumber(options.from)
        const buttonId = options.id
        const buttonTitle = options.title ?? options.id
        const name = options.name ?? 'Test User'

        const requestBody = {
          from,
          name,
          interactive_type: 'button_reply',
          button_id: buttonId,
          button_title: buttonTitle,
        }

        const response = await fetch(
          `http://${options.host}:${options.port}/debug/messages/send-interactive`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
          },
        )

        if (!response.ok) {
          const error = await response.text()
          console.error(
            `Failed to simulate button reply: ${response.status.toString()} ${error}`,
          )
          process.exit(1)
        }

        console.log(
          `✓ Simulated button reply from ${from} (${name}): id="${buttonId}", title="${buttonTitle}"`,
        )
      } catch (error) {
        console.error(
          'Error:',
          error instanceof Error ? error.message : 'Unknown error',
        )
        process.exit(1)
      }
    },
  )

simulateCommand
  .command('list-reply')
  .description('Simulate a list item selection')
  .option('-p, --port <number>', 'Port where emulator is running', '4004')
  .option('-h, --host <string>', 'Host where emulator is running', 'localhost')
  .requiredOption(
    '-f, --from <phone>',
    'Phone number of sender in E.164 format',
  )
  .requiredOption('--id <id>', 'List item ID that was selected')
  .option('--title <title>', 'List item title text (defaults to ID)')
  .option('--description <description>', 'List item description')
  .option('-n, --name <name>', 'Name of sender (defaults to "Test User")')
  .action(
    async (options: {
      port: string
      host: string
      from: string
      id: string
      title?: string
      description?: string
      name?: string
    }) => {
      try {
        const from = validatePhoneNumber(options.from)
        const listItemId = options.id
        const listItemTitle = options.title ?? options.id
        const listItemDescription = options.description ?? ''
        const name = options.name ?? 'Test User'

        const requestBody = {
          from,
          name,
          interactive_type: 'list_reply',
          list_item_id: listItemId,
          list_item_title: listItemTitle,
          list_item_description: listItemDescription,
        }

        const response = await fetch(
          `http://${options.host}:${options.port}/debug/messages/send-interactive`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
          },
        )

        if (!response.ok) {
          const error = await response.text()
          console.error(
            `Failed to simulate list reply: ${response.status.toString()} ${error}`,
          )
          process.exit(1)
        }

        console.log(
          `✓ Simulated list reply from ${from} (${name}): id="${listItemId}", title="${listItemTitle}"`,
        )
      } catch (error) {
        console.error(
          'Error:',
          error instanceof Error ? error.message : 'Unknown error',
        )
        process.exit(1)
      }
    },
  )

const mediaCommand = program
  .command('media')
  .description('Media management commands')

mediaCommand
  .command('list')
  .description('List uploaded media in the emulator')
  .option('-p, --port <number>', 'Port where emulator is running', '4004')
  .option('-h, --host <string>', 'Host where emulator is running', 'localhost')
  .action(async (options: StatusOptions) => {
    try {
      // Check if emulator is running first
      const isRunning = await checkEmulatorStatus(options.host, options.port)

      if (!isRunning) {
        console.error('✗ Emulator is not running')
        process.exit(1)
      }

      // Fetch media list from the emulator debug endpoint
      const response = await fetch(
        `http://${options.host}:${options.port}/debug/media/list`,
      )

      if (!response.ok) {
        console.error(
          `Failed to fetch media list: ${response.status.toString()}`,
        )
        process.exit(1)
      }

      const mediaData = (await response.json()) as MediaListResponse

      console.log('\n📁 Uploaded Media (Emulator):')
      console.log(`Total: ${mediaData.media.length.toString()} media file(s)`)
      console.log('')

      if (mediaData.media.length === 0) {
        console.log('No media files uploaded yet.')
      } else {
        console.log(
          'Media ID'.padEnd(25) +
            'Filename'.padEnd(20) +
            'Size'.padEnd(10) +
            'Type'.padEnd(15) +
            'Uploaded',
        )
        console.log('─'.repeat(80))

        for (const media of mediaData.media) {
          const uploadedTime = new Date(media.uploadedAt).toLocaleString()
          const sizeKB = Math.round(media.size / 1024)

          console.log(
            media.id.padEnd(25) +
              media.filename.padEnd(20) +
              `${sizeKB.toString()}KB`.padEnd(10) +
              media.mimeType.padEnd(15) +
              uploadedTime,
          )
        }
      }

      console.log('')
      console.log('Note: ' + mediaData.note)
    } catch (error) {
      console.error(
        'Error:',
        error instanceof Error ? error.message : 'Unknown error',
      )
      process.exit(1)
    }
  })

mediaCommand
  .command('expire')
  .description('Expire media files')
  .option('--id <mediaId>', 'Expire specific media ID')
  .option('--all', 'Expire all media files')
  .option('-p, --port <number>', 'Port where emulator is running', '4004')
  .option('-h, --host <string>', 'Host where emulator is running', 'localhost')
  .action(async (options: StatusOptions & { id?: string; all?: boolean }) => {
    try {
      // Validate options
      if (!options.id && !options.all) {
        console.error('✗ Either --id <mediaId> or --all is required')
        process.exit(1)
      }

      if (options.id && options.all) {
        console.error('✗ Cannot use both --id and --all options together')
        process.exit(1)
      }

      // Check if emulator is running first
      const isRunning = await checkEmulatorStatus(options.host, options.port)

      if (!isRunning) {
        console.error('✗ Emulator is not running')
        process.exit(1)
      }

      let endpoint: string
      if (options.id) {
        endpoint = `http://${options.host}:${options.port}/debug/media/expire/${options.id}`
      } else {
        endpoint = `http://${options.host}:${options.port}/debug/media/expire/all`
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('✗ Failed to expire media:', error)
        process.exit(1)
      }

      const result = (await response.json()) as MediaExpireResponse

      if (options.id) {
        console.log('✓ Media expired successfully!')
        console.log(`📁 Media ID: ${options.id}`)
        console.log(`⏰ Expired at: ${result.expired_at}`)
      } else {
        console.log('✓ All media expired successfully!')
        console.log(
          `📁 Expired media count: ${result.expired_media_ids?.length.toString() ?? '0'}`,
        )
        console.log(`⏰ Expired at: ${result.expired_at}`)

        if (result.expired_media_ids && result.expired_media_ids.length > 0) {
          console.log(
            `📋 Expired media IDs: [${result.expired_media_ids.join(', ')}]`,
          )
        }
      }
    } catch (error) {
      console.error(
        'Error:',
        error instanceof Error ? error.message : 'Unknown error',
      )
      process.exit(1)
    }
  })

program.parse()
