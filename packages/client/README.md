# WhatsApp Cloud API Client

**A powerful and type-safe WhatsApp Cloud API client for Node.js.**

[![github license](https://img.shields.io/github/license/ericvera/whatsapp-cloudapi.svg?style=flat-square)](https://github.com/ericvera/whatsapp-cloudapi/blob/master/LICENSE)
[![npm version](https://img.shields.io/npm/v/%40whatsapp-cloudapi%2Fclient.svg?style=flat-square)](https://npmjs.org/package/%x40whatsapp-cloudapi%2Fclient)

## Features

- ✨ TypeScript support
- 🔒 Type-safe request and response handling
- 📝 Well-documented API methods
- 🎯 Zero dependencies (except for types)
- 🔄 Modern ESM package
- ⚡ Lightweight and efficient

## Installation

```bash
npm install @whatsapp-cloudapi/client
# or
yarn add @whatsapp-cloudapi/client
```

## Quick Start

```typescript
import { sendTextMessage } from '@whatsapp-cloudapi/client'

// Send a simple text message
const response = await sendTextMessage({
  accessToken: 'YOUR_ACCESS_TOKEN',
  from: 'YOUR_PHONE_NUMBER_ID',
  to: 'RECIPIENT_PHONE_NUMBER',
  text: 'Hello from WhatsApp Cloud API! 👋',
})

// Send a message with link preview
const responseWithPreview = await sendTextMessage({
  accessToken: 'YOUR_ACCESS_TOKEN',
  from: 'YOUR_PHONE_NUMBER_ID',
  to: 'RECIPIENT_PHONE_NUMBER',
  text: 'Check out this link: https://example.com',
  previewUrl: true, // Enable link preview
})
```

## Template Messages

This client supports all WhatsApp template types, including location-based templates:

```typescript
import { sendTemplateMessage } from '@whatsapp-cloudapi/client'

// Send a location template message
const response = await sendTemplateMessage({
  accessToken: 'YOUR_ACCESS_TOKEN',
  from: 'YOUR_PHONE_NUMBER_ID',
  to: 'RECIPIENT_PHONE_NUMBER',
  templateName: 'location_update',
  languageCode: 'en_US',
  components: [
    {
      type: 'header',
      parameters: [
        {
          type: 'location',
          location: {
            latitude: '37.483307',
            longitude: '122.148981',
            name: 'Company HQ',
            address: '1 Hacker Way, Menlo Park, CA 94025',
          },
        },
      ],
    },
    {
      type: 'body',
      parameters: [
        {
          type: 'text',
          text: 'John',
          parameter_name: 'customer_name',
        },
        {
          type: 'text',
          text: '9128312831',
          parameter_name: 'order_id',
        },
      ],
    },
  ],
})
```

## Emulator Support

This client supports the [@whatsapp-cloudapi/emulator](https://www.npmjs.com/package/@whatsapp-cloudapi/emulator) for testing and development. Simply specify the emulator's base URL:

```typescript
import { sendTextMessage } from '@whatsapp-cloudapi/client'
import { WhatsAppEmulator } from '@whatsapp-cloudapi/emulator'

// Start the emulator
const emulator = new WhatsAppEmulator({
  businessPhoneNumberId: 'YOUR_PHONE_NUMBER_ID',
  port: 4004,
})
await emulator.start()

// Send messages to the emulator instead of the live API
const response = await sendTextMessage({
  accessToken: 'fake-token', // Any string works with emulator
  from: 'YOUR_PHONE_NUMBER_ID',
  to: '+1234567890',
  text: 'Hello from emulator!',
  baseUrl: 'http://localhost:4004', // Point to emulator
})

// Clean up
await emulator.stop()
```

## API Reference

### sendTextMessage

Sends a text message to a WhatsApp user.

```typescript
function sendTextMessage(params: {
  accessToken: string
  from: string
  to: string
  text: string
  previewUrl?: boolean
  bizOpaqueCallbackData?: string
  baseUrl?: string
}): Promise<CloudAPIResponse>
```

#### Parameters

- `accessToken` (string) - Your WhatsApp Cloud API access token
- `from` (string) - Your WhatsApp Phone Number ID
- `to` (string) - Recipient's phone number with country code (e.g., "+16505551234")
- `text` (string) - The message text (max 4096 characters)
- `previewUrl` (boolean, optional) - Enable link preview for URLs in the message
- `bizOpaqueCallbackData` (string, optional) - An arbitrary string for tracking
- `baseUrl` (string, optional) - Custom API base URL (defaults to Facebook Graph API, use `http://localhost:4004` for emulator)

#### Returns

Returns a Promise that resolves to a `CloudAPIResponse` object:

```typescript
interface CloudAPIResponse {
  messaging_product: 'whatsapp'
  contacts: {
    input: string // The phone number provided in the request
    wa_id: string // The WhatsApp ID for the contact
  }[]
  messages: {
    id: string // Unique message identifier
  }[]
}
```

#### Error Handling

The client throws an error if the API request fails. The error will contain the detailed error message from the WhatsApp API.

```typescript
try {
  await sendTextMessage(/* ... */)
} catch (error) {
  console.error('Failed to send message:', error.message)
}
```

## Requirements

- Node.js >= 22
- TypeScript >= 5.0 (for TypeScript users)

## Related Packages

- [@whatsapp-cloudapi/emulator](https://www.npmjs.com/package/@whatsapp-cloudapi/emulator) - WhatsApp Cloud API emulator for testing
- [@whatsapp-cloudapi/types](https://www.npmjs.com/package/@whatsapp-cloudapi/types) - TypeScript types for the WhatsApp Cloud API
