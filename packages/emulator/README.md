# WhatsApp Cloud API Emulator

**A powerful and type-safe WhatsApp Cloud API emulator for testing and development.**

[![github license](https://img.shields.io/github/license/ericvera/whatsapp-cloudapi.svg?style=flat-square)](https://github.com/ericvera/whatsapp-cloudapi/blob/master/LICENSE)
[![npm version](https://img.shields.io/npm/v/%40whatsapp-cloudapi%2Femulator.svg?style=flat-square)](https://npmjs.org/package/%40whatsapp-cloudapi%2Femulator)

## Features

- ✨ TypeScript support
- 🔒 Type-safe request and response handling
- 🛠️ Mock server implementation
- 🧪 Perfect for testing and development
- 📲 Simulation endpoints for incoming messages
- 💾 Media persistence across emulator restarts
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
  persistence: {
    importPath: './emulator-data', // Optional: Import media metadata on startup
    exportOnExit: './emulator-data', // Optional: Export media metadata on shutdown
    shouldExport: true, // Required when exportOnExit is specified
  },
})

// Start the emulator
await emulator.start()

// The emulator is now running and ready to accept requests
// Use it in your tests or development environment

// When done, stop the emulator
await emulator.stop()
```

## Media Persistence

The emulator supports persisting media metadata across restarts using export/import functionality. This is useful for long-term testing scenarios where you want to maintain media state between development sessions.

### Features

- **Metadata-only storage**: Only media metadata is persisted (filename, size, MIME type, expiration), not actual files
- **Automatic cleanup**: Expired media entries are automatically removed during import and export
- **Flexible paths**: Import from one location, export to another

### Configuration

```typescript
const emulator = new WhatsAppEmulator({
  businessPhoneNumberId: '15550123456',
  persistence: {
    // Import media metadata on startup
    importPath: './test-data',
    // Export media metadata on shutdown
    exportOnExit: './backup-data',
    // Must be true to enable export
    shouldExport: true,
  },
})
```

### CLI Usage

```bash
# Import only (no export)
wa-emulator start --number 15550123456 --import ./emulator-data

# Import and export to same location
wa-emulator start --number 15550123456 --import ./emulator-data --export-on-exit

# Import and export to different locations
wa-emulator start --number 15550123456 --import ./old-data --export-on-exit ./new-data

# Export only
wa-emulator start --number 15550123456 --export-on-exit ./emulator-data
```

### Data Format

Media metadata is stored in `media-manifest.json`:

```json
{
  "version": "1.0",
  "exportedAt": "2024-01-15T10:30:00.000Z",
  "media": [
    {
      "id": "abc123",
      "filename": "image.jpg",
      "mimeType": "image/jpeg",
      "size": 2048576,
      "uploadedAt": "2024-01-15T10:15:00.000Z",
      "expiresAt": "2024-02-14T10:15:00.000Z"
    }
  ]
}
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
  /** Media persistence configuration */
  persistence?: {
    /** Directory to import media metadata from */
    importPath?: string
    /** Directory to export media metadata to (defaults to importPath if not specified) */
    exportOnExit?: string
    /** Whether export was explicitly requested */
    shouldExport: boolean
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

## Simulation Endpoints

The emulator provides REST endpoints for simulating incoming messages, enabling comprehensive testing of your webhook handling logic.

### POST `/simulate/incoming/text`

Simulates an incoming text message from a user to your business phone number.

**Endpoint:** `POST http://localhost:4004/simulate/incoming/text`

**Request Body:**

```typescript
{
  // Phone number in E.164 format (e.g., "+1234567890")
  from: string
  // Sender's display name (e.g., "John Doe")
  name: string
  // Text message content
  message: string
}
```

**Response:**

```typescript
{
  success: true,
  messageSimulated: true
}
```

**Example:**

```bash
curl -X POST http://localhost:4004/simulate/incoming/text \
  -H "Content-Type: application/json" \
  -d '{
    "from": "+1234567890",
    "name": "John Doe",
    "message": "Hello, I need help with my order!"
  }'
```

**Generated Webhook:**

When you simulate an incoming message, the emulator will send a webhook to your configured webhook URL with the following structure:

```typescript
{
  object: 'whatsapp_business_account',
  entry: [
    {
      id: 'your_business_phone_number_id',
      changes: [
        {
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: 'your_business_phone_number_id',
              phone_number_id: 'your_business_phone_number_id',
            },
            contacts: [
              {
                wa_id: '+1234567890',
                profile: {
                  name: 'John Doe',
                },
              },
            ],
            messages: [
              {
                id: 'mock_incoming_1234567890_abc123',
                from: '+1234567890',
                timestamp: '1734567890',
                type: 'text',
                text: {
                  body: 'Hello, I need help with my order!',
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

**Error Responses:**

- `400 Bad Request` - When webhook is not configured or required fields are missing
- `400 Bad Request` - When `from` or `message` fields are invalid

**Note:** The simulation endpoint requires webhook configuration when starting the emulator. Without webhook configuration, the endpoint will return an error.

## Troubleshooting and Debugging

### Request Logging

The emulator provides comprehensive logging for troubleshooting:

- **📤 Outgoing Messages** - Logs when API calls are made to send messages
- **📲 Incoming Messages** - Logs when simulation endpoint receives messages
- **🔗 Webhook Events** - Logs successful webhook deliveries and failures
- **❌ Unhandled Requests** - Logs any requests to unsupported endpoints

#### Unhandled Request Logging

If you make a request to an endpoint that isn't supported by the emulator, it will:

1. Log the full request details to the console for troubleshooting
2. Return a helpful error response with available routes

**Example log output:**

```
❌ Unhandled request: POST /v15.0/1234567890/media
   Headers: {
     "content-type": "application/json",
     "authorization": "Bearer your-token"
   }
   Body: {
     "messaging_product": "whatsapp",
     "media": {...}
   }
```

**Example error response:**

```json
{
  "error": "Route not found",
  "message": "The endpoint POST /v15.0/1234567890/media is not supported by the WhatsApp Cloud API emulator",
  "availableRoutes": [
    "GET /are-you-ok",
    "POST /v{version}/1234567890/messages",
    "POST /simulate/incoming/text"
  ],
  "documentation": "See the emulator documentation for supported endpoints"
}
```

This helps identify what functionality might be missing from the emulator or if there are typos in your API calls.

## Requirements

- Node.js >= 22
- TypeScript >= 5.0 (for TypeScript users)

## Related Packages

- [@whatsapp-cloudapi/client](https://www.npmjs.com/package/@whatsapp-cloudapi/client) - WhatsApp Cloud API client
- [@whatsapp-cloudapi/types](https://www.npmjs.com/package/@whatsapp-cloudapi/types) - TypeScript types for the WhatsApp Cloud API
