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

## Call-to-Action (CTA) URL Messages

Interactive call-to-action URL messages allow you to send buttons that direct users to external websites. These messages are ideal when you want users to visit a URL without displaying the full URL in the message text.

### sendCTAURLMessage

Sends an interactive call-to-action URL button message to a WhatsApp user.

```typescript
function sendCTAURLMessage(params: {
  accessToken: string
  from: string
  to: string
  bodyText: string
  buttonText: string
  url: string
  headerText?: string
  headerImage?: { id: string }
  footerText?: string
  bizOpaqueCallbackData?: string
  baseUrl?: string
}): Promise<CloudAPIResponse>
```

#### Parameters

- `accessToken` (string) - Your WhatsApp Cloud API access token
- `from` (string) - Your WhatsApp Phone Number ID
- `to` (string) - Recipient's phone number with country code or phone number ID (e.g., "+16505551234" or "5551234")
- `bodyText` (string) - Main message text. Maximum 1024 characters. URLs are automatically hyperlinked
- `buttonText` (string) - Text displayed on the CTA button. Maximum 20 characters
- `url` (string) - URL to open when button is tapped. Must start with `http://` or `https://` and cannot be an IP address
- `headerText` (string, optional) - Header text. Maximum 60 characters. Cannot be used with headerImage
- `headerImage` (object, optional) - Image header using media ID. Cannot be used with headerText
- `footerText` (string, optional) - Footer text. Maximum 60 characters. URLs are automatically hyperlinked
- `bizOpaqueCallbackData` (string, optional) - An arbitrary string for tracking
- `baseUrl` (string, optional) - Optional base URL for the API (defaults to Facebook Graph API, use http://localhost:4004 for emulator)

#### Returns

Returns a Promise that resolves to a `CloudAPIResponse` object:

```typescript
interface CloudAPIResponse {
  messaging_product: 'whatsapp'
  contacts: {
    // The phone number provided in the request
    input: string
    // The WhatsApp ID for the contact
    wa_id: string
  }[]
  messages: {
    // Unique message identifier
    id: string
  }[]
}
```

#### Examples

##### Simple CTA with Text Header

```typescript
import { sendCTAURLMessage } from '@whatsapp-cloudapi/client'

// Send a CTA message with text header
const response = await sendCTAURLMessage({
  accessToken: 'YOUR_ACCESS_TOKEN',
  from: 'YOUR_PHONE_NUMBER_ID',
  to: '+16505551234',
  headerText: 'Special Offer!',
  bodyText: 'Get 20% off your next purchase. Limited time offer!',
  buttonText: 'Shop Now',
  url: 'https://shop.example.com/sale',
  footerText: 'Valid until end of month',
})

console.log('CTA message sent:', response.messages[0].id)
```

##### CTA with Image Header

```typescript
// Send a CTA message with image header using media ID
const response = await sendCTAURLMessage({
  accessToken: 'YOUR_ACCESS_TOKEN',
  from: 'YOUR_PHONE_NUMBER_ID',
  to: '+16505551234',
  headerImage: { id: 'MEDIA_ID_FROM_UPLOAD' },
  bodyText:
    'Browse our complete product catalog with detailed specifications and pricing.',
  buttonText: 'View Catalog',
  url: 'https://catalog.example.com',
})
```

##### Minimal CTA Message

```typescript
// Send a minimal CTA message with just body and button
const response = await sendCTAURLMessage({
  accessToken: 'YOUR_ACCESS_TOKEN',
  from: 'YOUR_PHONE_NUMBER_ID',
  to: '+16505551234',
  bodyText: 'Visit our website for more information.',
  buttonText: 'Visit Website',
  url: 'https://example.com',
})
```

#### Error Handling

The function throws errors for various validation and API issues:

```typescript
try {
  await sendCTAURLMessage({
    accessToken: 'YOUR_ACCESS_TOKEN',
    from: 'YOUR_PHONE_NUMBER_ID',
    to: '+16505551234',
    bodyText: 'Check this out!',
    buttonText: 'Click Me',
    url: 'https://example.com',
  })
} catch (error) {
  // Possible errors:
  // - Body text too long (>1024 characters)
  // - Button text too long (>20 characters)
  // - Footer text too long (>60 characters)
  // - Header text too long (>60 characters)
  // - Invalid URL format
  // - URL hostname is an IP address
  // - Multiple header types specified
  // - API authentication errors
  // - Network/connectivity issues
  console.error('Failed to send CTA message:', error.message)
}
```

#### Important Notes

- **No Webhook Response**: Unlike reply buttons, CTA URL clicks do not generate webhook responses. Users navigate directly to the external URL.
- **URL Requirements**: URLs must start with `http://` or `https://` and include a hostname (IP addresses are not supported).
- **Header Types**: Only one header type can be used per message (headerText or headerImage).
- **Character Limits**: Strictly enforced - messages will fail if limits are exceeded.
- **Media Headers**: When using headerImage, ensure the media is uploaded first using the `uploadMedia()` function to obtain a media ID.

## Requirements
