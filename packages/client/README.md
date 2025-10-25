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

## WhatsApp Flow Messages

Interactive flow messages allow you to create structured, guided experiences within WhatsApp. Flows are ideal for collecting information, generating leads, or creating multi-step interactions.

### sendFlowMessage

Sends a WhatsApp Flow message to guide users through interactive forms and experiences.

```typescript
function sendFlowMessage(params: {
  accessToken: string
  from: string
  to: string
  bodyText: string
  flowToken: string
  flowId: string
  flowCta: string
  flowAction: 'navigate' | 'data_exchange'
  screen?: string
  data?: Record<string, unknown>
  headerText?: string
  headerImage?: { id?: string; link?: string }
  headerVideo?: { id?: string; link?: string }
  headerDocument?: { id?: string; link?: string; filename?: string }
  footerText?: string
  bizOpaqueCallbackData?: string
  baseUrl?: string
}): Promise<CloudAPIResponse>
```

#### Parameters

- `accessToken` (string) - Your WhatsApp Cloud API access token
- `from` (string) - Your WhatsApp Phone Number ID
- `to` (string) - Recipient's phone number with country code (e.g., "+16505551234")
- `bodyText` (string) - Main message text. Maximum 1024 characters
- `flowToken` (string) - Session token for the flow
- `flowId` (string) - Unique ID of the flow
- `flowCta` (string) - Call-to-action text on the button
- `flowAction` (string) - Type of flow action: 'navigate' or 'data_exchange'
- `screen` (string, optional) - Screen to navigate to (required for 'navigate' action)
- `data` (object, optional) - Additional data to pass to the flow
- `headerText` (string, optional) - Header text. Maximum 60 characters. Cannot be used with other header types
- `headerImage` (object, optional) - Image header using media ID or link. Cannot be used with other header types
- `headerVideo` (object, optional) - Video header using media ID or link. Cannot be used with other header types
- `headerDocument` (object, optional) - Document header using media ID or link. Cannot be used with other header types
- `footerText` (string, optional) - Footer text. Maximum 60 characters
- `bizOpaqueCallbackData` (string, optional) - An arbitrary string for tracking
- `baseUrl` (string, optional) - Optional base URL for the API (defaults to Facebook Graph API)

#### Examples

##### Navigate Flow with Text Header

```typescript
import { sendFlowMessage } from '@whatsapp-cloudapi/client'

// Send a flow message that navigates to a specific screen
const response = await sendFlowMessage({
  accessToken: 'YOUR_ACCESS_TOKEN',
  from: 'YOUR_PHONE_NUMBER_ID',
  to: '+16505551234',
  bodyText: 'Complete your loan application form to get started.',
  flowToken: 'FLOW_SESSION_TOKEN_123',
  flowId: 'FLOW_ID_456',
  flowCta: 'Start Application',
  flowAction: 'navigate',
  screen: 'welcome_screen',
  headerText: 'Loan Application',
  footerText: 'Secure and fast process',
})

console.log('Flow message sent:', response.messages[0].id)
```

##### Data Exchange Flow with Image Header

```typescript
// Send a flow message for data exchange with image header
const response = await sendFlowMessage({
  accessToken: 'YOUR_ACCESS_TOKEN',
  from: 'YOUR_PHONE_NUMBER_ID',
  to: '+16505551234',
  bodyText: 'Update your preferences with our interactive form.',
  flowToken: 'FLOW_TOKEN_789',
  flowId: 'PREFERENCES_FLOW_101',
  flowCta: 'Update Preferences',
  flowAction: 'data_exchange',
  data: { userId: '12345', currentPlan: 'premium' },
  headerImage: { id: 'MEDIA_ID_FROM_UPLOAD' },
})
```

##### Flow with Video Header

```typescript
// Send a flow message with video header
const response = await sendFlowMessage({
  accessToken: 'YOUR_ACCESS_TOKEN',
  from: 'YOUR_PHONE_NUMBER_ID',
  to: '+16505551234',
  bodyText: 'Watch our tutorial and complete the setup process.',
  flowToken: 'SETUP_TOKEN_456',
  flowId: 'SETUP_FLOW_789',
  flowCta: 'Start Setup',
  flowAction: 'navigate',
  screen: 'tutorial_screen',
  headerVideo: { link: 'https://example.com/tutorial.mp4' },
})
```

#### Error Handling

The function validates parameters and throws errors for various issues:

```typescript
try {
  await sendFlowMessage({
    accessToken: 'YOUR_ACCESS_TOKEN',
    from: 'YOUR_PHONE_NUMBER_ID',
    to: '+16505551234',
    bodyText: 'Complete our survey.',
    flowToken: 'FLOW_TOKEN_123',
    flowId: 'SURVEY_FLOW_456',
    flowCta: 'Start Survey',
    flowAction: 'navigate', // Missing required 'screen' parameter
  })
} catch (error) {
  // Possible errors:
  // - Screen parameter required for navigate action
  // - Body text too long (>1024 characters)
  // - Header text too long (>60 characters)
  // - Footer text too long (>60 characters)
  // - Multiple header types specified
  // - API authentication errors
  console.error('Failed to send flow message:', error.message)
}
```

#### Flow Actions

- **navigate**: Directs users to a specific screen within the flow. Requires the `screen` parameter.
- **data_exchange**: Initiates data collection or exchange. Can include optional `data` parameter with initial values.

#### Important Notes

- **Flow Version**: Currently only flow message version 3 is supported.
- **Header Types**: Only one header type can be used per message (text, image, video, or document).
- **Screen Parameter**: Required when using 'navigate' flow action.
- **Character Limits**: Strictly enforced for all text fields.
- **Media Headers**: When using media headers, ensure media is uploaded first or use valid external links.

## Interactive Reply Buttons

Interactive reply button messages allow you to send up to 3 quick reply buttons that users can tap to respond. When a user taps a button, you receive a webhook notification with the button ID and title.

### sendButtonsMessage

Sends an interactive message with reply buttons to a WhatsApp user.

```typescript
function sendButtonsMessage(params: {
  accessToken: string
  from: string
  to: string
  bodyText: string
  buttons: { id: string; title: string }[]
  headerText?: string
  headerImage?: { id?: string; link?: string }
  headerVideo?: { id?: string; link?: string }
  headerDocument?: { id?: string; link?: string; filename?: string }
  footerText?: string
  bizOpaqueCallbackData?: string
  baseUrl?: string
}): Promise<CloudAPIResponse>
```

#### Parameters

- `accessToken` (string) - Your WhatsApp Cloud API access token
- `from` (string) - Your WhatsApp Phone Number ID
- `to` (string) - Recipient's phone number with country code (e.g., "+16505551234")
- `bodyText` (string) - Main message text. Maximum 1024 characters
- `buttons` (array) - Array of 1-3 button objects, each with:
  - `id` (string) - Unique button identifier. Maximum 256 characters
  - `title` (string) - Text displayed on the button. Maximum 20 characters
- `headerText` (string, optional) - Header text. Maximum 60 characters. Cannot be used with other header types
- `headerImage` (object, optional) - Image header using media ID or link. Cannot be used with other header types
- `headerVideo` (object, optional) - Video header using media ID or link. Cannot be used with other header types
- `headerDocument` (object, optional) - Document header using media ID or link. Cannot be used with other header types
- `footerText` (string, optional) - Footer text. Maximum 60 characters
- `bizOpaqueCallbackData` (string, optional) - An arbitrary string for tracking
- `baseUrl` (string, optional) - Optional base URL for the API (defaults to Facebook Graph API)

#### Examples

##### Simple Yes/No Buttons

```typescript
import { sendButtonsMessage } from '@whatsapp-cloudapi/client'

// Send a message with two buttons
const response = await sendButtonsMessage({
  accessToken: 'YOUR_ACCESS_TOKEN',
  from: 'YOUR_PHONE_NUMBER_ID',
  to: '+16505551234',
  bodyText: 'Would you like to receive our newsletter?',
  buttons: [
    { id: 'yes', title: 'Yes' },
    { id: 'no', title: 'No' },
  ],
})

console.log('Button message sent:', response.messages[0].id)
```

##### Three Options with Header and Footer

```typescript
// Send a message with three buttons, header, and footer
const response = await sendButtonsMessage({
  accessToken: 'YOUR_ACCESS_TOKEN',
  from: 'YOUR_PHONE_NUMBER_ID',
  to: '+16505551234',
  headerText: 'Delivery Options',
  bodyText: 'When would you like your order delivered?',
  buttons: [
    { id: 'morning', title: 'Morning' },
    { id: 'afternoon', title: 'Afternoon' },
    { id: 'evening', title: 'Evening' },
  ],
  footerText: 'Select your preferred time',
})
```

##### Buttons with Image Header

```typescript
// Send a message with image header
const response = await sendButtonsMessage({
  accessToken: 'YOUR_ACCESS_TOKEN',
  from: 'YOUR_PHONE_NUMBER_ID',
  to: '+16505551234',
  bodyText: 'Choose your subscription plan:',
  buttons: [
    { id: 'basic', title: 'Basic' },
    { id: 'premium', title: 'Premium' },
    { id: 'enterprise', title: 'Enterprise' },
  ],
  headerImage: { id: 'MEDIA_ID_FROM_UPLOAD' },
})
```

#### Handling Button Responses

When a user taps a button, you'll receive a webhook notification with the button ID and title. You can use the webhook types from `@whatsapp-cloudapi/types` to handle responses:

```typescript
import type { WebhookInteractiveMessage } from '@whatsapp-cloudapi/types/webhook'

// In your webhook handler
function handleWebhook(message: WebhookInteractiveMessage) {
  if (message.interactive.type === 'button_reply') {
    const buttonId = message.interactive.button_reply.id
    const buttonTitle = message.interactive.button_reply.title

    console.log(`User clicked: ${buttonTitle} (${buttonId})`)

    // Handle the button response based on the ID
    if (buttonId === 'yes') {
      // User confirmed
    } else if (buttonId === 'no') {
      // User declined
    }
  }
}
```

#### Error Handling

The function validates all parameters and throws errors for various issues:

```typescript
try {
  await sendButtonsMessage({
    accessToken: 'YOUR_ACCESS_TOKEN',
    from: 'YOUR_PHONE_NUMBER_ID',
    to: '+16505551234',
    bodyText: 'Choose an option:',
    buttons: [
      { id: 'option1', title: 'Option 1' },
      { id: 'option1', title: 'Option 2' }, // Duplicate ID!
    ],
  })
} catch (error) {
  // Possible errors:
  // - Duplicate button ID found
  // - Invalid button count (must be 1-3)
  // - Button ID too long (>256 characters)
  // - Button title too long (>20 characters)
  // - Body text too long (>1024 characters)
  // - Header text too long (>60 characters)
  // - Footer text too long (>60 characters)
  // - Multiple header types specified
  // - API authentication errors
  console.error('Failed to send button message:', error.message)
}
```

#### Important Notes

- **Button Count**: Minimum 1 button, maximum 3 buttons per message.
- **Unique IDs**: All button IDs must be unique within the same message.
- **Webhook Response**: Unlike CTA URLs, button taps generate webhook notifications that you can process.
- **Header Types**: Only one header type can be used per message (text, image, video, or document).
- **Character Limits**: Strictly enforced for all text fields and button properties.
- **Media Headers**: When using media headers, ensure media is uploaded first or use valid external links.

## Interactive List Messages

Interactive list messages allow you to send structured menus with up to 10 items organized into sections. Users tap a button to view the list and select an item, triggering a webhook notification with the selected item's ID and title.

### sendListMessage

Sends an interactive message with a list of options to a WhatsApp user.

```typescript
function sendListMessage(params: {
  accessToken: string
  from: string
  to: string
  bodyText: string
  buttonText: string
  sections: {
    title?: string
    rows: {
      id: string
      title: string
      description?: string
    }[]
  }[]
  headerText?: string
  footerText?: string
  bizOpaqueCallbackData?: string
  baseUrl?: string
}): Promise<CloudAPIResponse>
```

#### Parameters

- `accessToken` (string) - Your WhatsApp Cloud API access token
- `from` (string) - Your WhatsApp Phone Number ID
- `to` (string) - Recipient's phone number with country code (e.g., "+16505551234")
- `bodyText` (string) - Main message text. Maximum 1024 characters
- `buttonText` (string) - Text for the button that opens the list. Maximum 20 characters
- `sections` (array) - Array of sections containing list items. Maximum 10 rows total across all sections, each with:
  - `title` (string, optional) - Section title. Maximum 24 characters
  - `rows` (array) - Array of row objects, each with:
    - `id` (string) - Unique row identifier. Maximum 200 characters
    - `title` (string) - Row title. Maximum 24 characters
    - `description` (string, optional) - Row description. Maximum 72 characters
- `headerText` (string, optional) - Header text. Maximum 60 characters
- `footerText` (string, optional) - Footer text. Maximum 60 characters
- `bizOpaqueCallbackData` (string, optional) - An arbitrary string for tracking
- `baseUrl` (string, optional) - Optional base URL for the API (defaults to Facebook Graph API)

#### Examples

##### Product Categories

```typescript
import { sendListMessage } from '@whatsapp-cloudapi/client'

// Send a list with multiple sections
const response = await sendListMessage({
  accessToken: 'YOUR_ACCESS_TOKEN',
  from: 'YOUR_PHONE_NUMBER_ID',
  to: '+16505551234',
  headerText: 'Product Catalog',
  bodyText: 'Browse our products by category. Tap to view options.',
  buttonText: 'View Products',
  sections: [
    {
      title: 'Electronics',
      rows: [
        {
          id: 'phones',
          title: 'Smartphones',
          description: 'Latest models from top brands',
        },
        {
          id: 'laptops',
          title: 'Laptops',
          description: 'High-performance computing',
        },
      ],
    },
    {
      title: 'Accessories',
      rows: [
        { id: 'cases', title: 'Cases & Covers' },
        { id: 'chargers', title: 'Chargers' },
      ],
    },
  ],
  footerText: 'Free shipping on orders over $50',
})

console.log('List message sent:', response.messages[0].id)
```

##### Simple Menu

```typescript
// Send a simple list without sections
const response = await sendListMessage({
  accessToken: 'YOUR_ACCESS_TOKEN',
  from: 'YOUR_PHONE_NUMBER_ID',
  to: '+16505551234',
  bodyText: 'Please select your preferred support option:',
  buttonText: 'Select Option',
  sections: [
    {
      rows: [
        {
          id: 'tech',
          title: 'Technical Support',
          description: 'Help with technical issues',
        },
        {
          id: 'billing',
          title: 'Billing Support',
          description: 'Questions about your bill',
        },
        {
          id: 'general',
          title: 'General Inquiries',
          description: 'Other questions',
        },
      ],
    },
  ],
})
```

#### Handling List Responses

When a user selects an item from the list, you'll receive a webhook notification with the item details. You can use the webhook types from `@whatsapp-cloudapi/types` to handle responses:

```typescript
import type { WebhookInteractiveMessage } from '@whatsapp-cloudapi/types/webhook'

// In your webhook handler
function handleWebhook(message: WebhookInteractiveMessage) {
  if (message.interactive.type === 'list_reply') {
    const listReply = message.interactive.list_reply
    const selectedId = listReply.id
    const selectedTitle = listReply.title
    const selectedDescription = listReply.description

    console.log(`User selected: ${selectedTitle} (${selectedId})`)

    // Handle the selection based on the ID
    if (selectedId === 'phones') {
      // Show smartphone catalog
    } else if (selectedId === 'laptops') {
      // Show laptop catalog
    }
  }
}
```

#### Error Handling

The function validates all parameters and throws errors for various issues:

```typescript
try {
  await sendListMessage({
    accessToken: 'YOUR_ACCESS_TOKEN',
    from: 'YOUR_PHONE_NUMBER_ID',
    to: '+16505551234',
    bodyText: 'Select an option:',
    buttonText: 'Choose',
    sections: [
      {
        rows: Array.from({ length: 11 }, (_, i) => ({
          id: `item_${i}`,
          title: `Item ${i}`,
        })),
      },
    ],
  })
} catch (error) {
  // Possible errors:
  // - Total rows exceed 10
  // - Duplicate row IDs
  // - No sections provided
  // - Section has no rows
  // - Row ID too long (>200 characters)
  // - Row title too long (>24 characters)
  // - Row description too long (>72 characters)
  // - Section title too long (>24 characters)
  // - Body text too long (>1024 characters)
  // - Button text too long (>20 characters)
  // - Header text too long (>60 characters)
  // - Footer text too long (>60 characters)
  // - API authentication errors
  console.error('Failed to send list message:', error.message)
}
```

#### Important Notes

- **Row Limit**: Maximum 10 rows total across all sections.
- **Unique IDs**: All row IDs must be unique within the same message.
- **Webhook Response**: List item selections generate webhook notifications with the selected item's ID, title, and description.
- **Header Support**: Only text headers are supported for list messages (no image/video/document headers).
- **Character Limits**: Strictly enforced for all text fields and list item properties.

## Mark Message as Read

Mark incoming messages as read to update their status in the WhatsApp conversation.

### markMessageRead

Marks a WhatsApp message as read.

```typescript
function markMessageRead(params: {
  accessToken: string
  from: string
  messageId: string
  baseUrl?: string
}): Promise<CloudAPIMarkReadResponse>
```

#### Parameters

- `accessToken` (string) - Your WhatsApp Cloud API access token
- `from` (string) - Your WhatsApp Phone Number ID
- `messageId` (string) - The message ID to mark as read (from webhook notifications)
- `baseUrl` (string, optional) - Optional base URL for the API (defaults to Facebook Graph API, use http://localhost:4004 for emulator)

#### Returns

Returns a Promise that resolves to a `CloudAPIMarkReadResponse` object:

```typescript
interface CloudAPIMarkReadResponse {
  success: boolean
}
```

#### Example

```typescript
import { markMessageRead } from '@whatsapp-cloudapi/client'

// Mark a message as read
const response = await markMessageRead({
  accessToken: 'YOUR_ACCESS_TOKEN',
  from: 'YOUR_PHONE_NUMBER_ID',
  messageId: 'wamid.HBgLMTY1MDU1NTEyMzQVAgARGBI5QTNDQTVCM0Q0Q0ZCQTRCOTkA',
})

console.log('Message marked as read:', response.success) // true
```

#### Using with Webhooks

Typically, you'll use this function in response to incoming message webhooks:

```typescript
import type { WebhookTextMessage } from '@whatsapp-cloudapi/types/webhook'
import { markMessageRead } from '@whatsapp-cloudapi/client'

// In your webhook handler
async function handleIncomingMessage(message: WebhookTextMessage) {
  // Process the message
  console.log(`Received message: ${message.text.body}`)

  // Mark the message as read
  await markMessageRead({
    accessToken: 'YOUR_ACCESS_TOKEN',
    from: 'YOUR_PHONE_NUMBER_ID',
    messageId: message.id,
  })

  // Send a response or perform other actions...
}
```

#### Error Handling

The function throws errors for various issues:

```typescript
try {
  await markMessageRead({
    accessToken: 'YOUR_ACCESS_TOKEN',
    from: 'YOUR_PHONE_NUMBER_ID',
    messageId: 'wamid.invalid123',
  })
} catch (error) {
  // Possible errors:
  // - Invalid message ID
  // - API authentication errors
  // - Network/connectivity issues
  console.error('Failed to mark message as read:', error.message)
}
```

#### Important Notes

- **Message IDs**: Use the message ID from incoming webhook notifications
- **No Visual Confirmation**: The API returns success, but there's no visual confirmation in the WhatsApp UI for read receipts on business messages
- **Idempotent**: Marking the same message as read multiple times is safe and won't cause errors
