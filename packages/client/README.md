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

## Image Media Messages

This client supports uploading and sending image media through WhatsApp Cloud API.

### uploadMedia

Uploads an image to the WhatsApp Cloud API media endpoint.

```typescript
function uploadMedia(params: {
  accessToken: string
  from: string
  file: Blob
  baseUrl?: string
}): Promise<CloudAPIMediaUploadResponse>
```

#### Parameters

- `accessToken` (string) - Your WhatsApp Cloud API access token
- `from` (string) - Your WhatsApp Phone Number ID
- `file` (Blob) - The image file to upload as a Blob
- `baseUrl` (string, optional) - Custom API base URL (defaults to Facebook Graph API, use `http://localhost:4004` for emulator)

#### Supported Image Formats

- **JPEG** (.jpg, .jpeg) - `image/jpeg`
- **PNG** (.png) - `image/png`
- **Maximum size**: 5MB
- **Requirements**: Images must be 8-bit, RGB or RGBA

#### Returns

Returns a Promise that resolves to a `CloudAPIMediaUploadResponse` object:

```typescript
interface CloudAPIMediaUploadResponse {
  id: string // Media ID to use when sending the image
}
```

#### Example

```typescript
import { uploadMedia } from '@whatsapp-cloudapi/client'

// Create a Blob from file data (example using fetch)
const response = await fetch('/path/to/image.jpg')
const imageBlob = await response.blob()

// Or create from buffer/array
const imageData = new Uint8Array([
  /* your image data */
])
const imageBlob = new Blob([imageData], { type: 'image/jpeg' })

// Upload the Blob
const mediaResponse = await uploadMedia({
  accessToken: 'YOUR_ACCESS_TOKEN',
  from: 'YOUR_PHONE_NUMBER_ID',
  file: imageBlob,
})

// Use this ID to send the image
console.log('Media ID:', mediaResponse.id)
```

### sendImageMessage

Sends an image message using a media ID obtained from the media upload endpoint.

```typescript
function sendImageMessage(params: {
  accessToken: string
  from: string
  to: string
  mediaId: string
  caption?: string
  bizOpaqueCallbackData?: string
  baseUrl?: string
}): Promise<CloudAPIResponse>
```

#### Parameters

- `accessToken` (string) - Your WhatsApp Cloud API access token
- `from` (string) - Your WhatsApp Phone Number ID
- `to` (string) - Recipient's phone number with country code (e.g., "+16505551234")
- `mediaId` (string) - The media ID obtained from `uploadMedia()`
- `caption` (string, optional) - Optional caption for the image (max 1024 characters)
- `bizOpaqueCallbackData` (string, optional) - An arbitrary string for tracking
- `baseUrl` (string, optional) - Custom API base URL (defaults to Facebook Graph API, use `http://localhost:4004` for emulator)

#### Example

```typescript
import { uploadMedia, sendImageMessage } from '@whatsapp-cloudapi/client'

// Step 1: Create Blob from image data
const response = await fetch('/path/to/image.jpg')
const imageBlob = await response.blob()

// Step 2: Upload the image
const mediaResponse = await uploadMedia({
  accessToken: 'YOUR_ACCESS_TOKEN',
  from: 'YOUR_PHONE_NUMBER_ID',
  file: imageBlob,
})

// Step 3: Send the image message
const messageResponse = await sendImageMessage({
  accessToken: 'YOUR_ACCESS_TOKEN',
  from: 'YOUR_PHONE_NUMBER_ID',
  to: '+1234567890',
  mediaId: mediaResponse.id,
  caption: 'Check out this image!',
})

console.log('Message sent:', messageResponse.messages[0].id)
```

#### Error Handling

Both functions throw errors for common issues:

```typescript
try {
  // Upload validation errors
  await uploadMedia({
    /* ... */
  })
} catch (error) {
  // Possible errors:
  // - Unsupported MIME type (not JPEG/PNG)
  // - File size too large (>5MB)
  // - API authentication errors
  console.error('Upload failed:', error.message)
}

try {
  // Send validation errors
  await sendImageMessage({
    /* ... */
  })
} catch (error) {
  // Possible errors:
  // - Caption too long (>1024 characters)
  // - Invalid media ID
  // - API authentication errors
  console.error('Send failed:', error.message)
}
```

## Requirements

- Node.js >= 22
- TypeScript >= 5.0 (for TypeScript users)

## Related Packages

- [@whatsapp-cloudapi/emulator](https://www.npmjs.com/package/@whatsapp-cloudapi/emulator) - WhatsApp Cloud API emulator for testing
- [@whatsapp-cloudapi/types](https://www.npmjs.com/package/@whatsapp-cloudapi/types) - TypeScript types for the WhatsApp Cloud API
