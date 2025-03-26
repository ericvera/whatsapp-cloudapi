# WhatsApp Cloud API Emulator

**A powerful and type-safe WhatsApp Cloud API emulator for testing and development.**

[![github license](https://img.shields.io/github/license/ericvera/whatsapp-cloudapi.svg?style=flat-square)](https://github.com/ericvera/whatsapp-cloudapi/blob/master/LICENSE)
[![npm version](https://img.shields.io/npm/v/%40whatsapp-cloudapi%2Femulator.svg?style=flat-square)](https://npmjs.org/package/%40whatsapp-cloudapi%2Femulator)

## Features

- ✨ TypeScript support
- 🔒 Type-safe request and response handling
- 🛠️ Mock server implementation
- 🧪 Perfect for testing and development
- 🔄 Modern ESM package
- ⚡ Lightweight and efficient
- 🔔 Webhook support for status updates

## Installation

```bash
npm install @whatsapp-cloudapi/emulator
# or
yarn add @whatsapp-cloudapi/emulator
```

## Quick Start

```typescript
import { WhatsAppEmulator } from '@whatsapp-cloudapi/emulator'

// Create a new emulator instance
const emulator = new WhatsAppEmulator({
  businessPhoneNumberId: '15550123456', // The phone number ID to emulate
  port: 3000, // Optional, defaults to 4004
  webhook: {
    url: 'https://your-webhook-endpoint.com/webhook', // URL to receive webhook events
    secret: 'your-webhook-secret', // Required secret for webhook verification
    timeout: 5000, // Optional timeout in milliseconds (defaults to 5000)
  },
})

// Start the emulator
await emulator.start()

// The emulator is now running and ready to accept requests
// Use it in your tests or development environment

// When done, stop the emulator
await emulator.stop()
```

## API Reference

### WhatsAppEmulator

Creates a new instance of the WhatsApp Cloud API emulator.

```typescript
class WhatsAppEmulator {
  constructor(options: EmulatorOptions)
  start(): Promise<void>
  stop(): Promise<void>
}

interface EmulatorOptions {
  /** Business phone number ID to emulate */
  businessPhoneNumberId: string
  /** Port to run the emulator server on (defaults to 4004) */
  port?: number
  /** Host to bind to (defaults to localhost) */
  host?: string
  /** Simulate network delay in milliseconds */
  delay?: number
  /** Webhook configuration */
  webhook?: {
    /** URL to send webhook events to */
    url: string
    /** Required secret token for webhook verification */
    secret: string
    /** Optional timeout in milliseconds for webhook requests (defaults to 5000) */
    timeout?: number
  }
}
```

#### Methods

- `start()` - Starts the emulator server
- `stop()` - Stops the emulator server

#### Error Handling

The emulator throws errors in the following cases:

- Port is already in use
- Invalid configuration
- Server failed to start

```typescript
try {
  await emulator.start()
} catch (error) {
  console.error('Failed to start emulator:', error.message)
}
```

#### Webhook Events

When webhook support is enabled, the emulator will send webhook events to the configured URL for message status updates. The webhook payload follows the official WhatsApp Cloud API webhook format. The webhook request will include the configured secret in the `X-Hub-Signature-256` header for verification.

Example webhook payload:

```typescript
{
  object: 'whatsapp_business_account',
  entry: [
    {
      id: '15550123456',
      changes: [
        {
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '15550123456',
              phone_number_id: '15550123456',
            },
            statuses: [
              {
                id: 'message_id',
                recipient_id: 'recipient_phone_number',
                status: 'sent',
                timestamp: '1234567890',
                conversation: {
                  id: 'conversation_id',
                  origin: {
                    type: 'utility',
                  },
                },
              },
            ],
          },
          field: 'messages',
        },
      ],
    },
  ],
}
```

## Requirements

- Node.js >= 22
- TypeScript >= 5.0 (for TypeScript users)

## Related Packages

- [@whatsapp-cloudapi/client](https://www.npmjs.com/package/@whatsapp-cloudapi/client) - WhatsApp Cloud API client
- [@whatsapp-cloudapi/types](https://www.npmjs.com/package/@whatsapp-cloudapi/types) - TypeScript types for the WhatsApp Cloud API
