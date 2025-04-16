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
const response = await sendTextMessage(
  'YOUR_ACCESS_TOKEN',
  'YOUR_PHONE_NUMBER_ID',
  'RECIPIENT_PHONE_NUMBER',
  'Hello from WhatsApp Cloud API! 👋',
)

// Send a message with link preview
const responseWithPreview = await sendTextMessage(
  'YOUR_ACCESS_TOKEN',
  'YOUR_PHONE_NUMBER_ID',
  'RECIPIENT_PHONE_NUMBER',
  'Check out this link: https://example.com',
  true, // Enable link preview
)
```

## Template Messages

This client supports all WhatsApp template types, including location-based templates:

```typescript
import { sendTemplateMessage } from '@whatsapp-cloudapi/client'

// Send a location template message
const response = await sendTemplateMessage(
  'YOUR_ACCESS_TOKEN',
  'YOUR_PHONE_NUMBER_ID',
  'RECIPIENT_PHONE_NUMBER',
  {
    name: 'location_update',
    language: {
      code: 'en_US',
    },
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
  },
)
```

## API Reference

### sendTextMessage

Sends a text message to a WhatsApp user.

```typescript
function sendTextMessage(
  accessToken: string,
  from: string,
  to: string,
  text: string,
  previewUrl?: boolean,
): Promise<CloudAPIResponse>
```

#### Parameters

- `accessToken` (string) - Your WhatsApp Cloud API access token
- `from` (string) - Your WhatsApp Phone Number ID
- `to` (string) - Recipient's phone number with country code (e.g., "+16505551234")
- `text` (string) - The message text (max 4096 characters)
- `previewUrl` (boolean, optional) - Enable link preview for URLs in the message

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

- [@whatsapp-cloudapi/types](https://www.npmjs.com/package/@whatsapp-cloudapi/types) - TypeScript types for the WhatsApp Cloud API
