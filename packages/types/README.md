# WhatsApp Cloud API Types

**TypeScript types for the WhatsApp Cloud API**

[![github license](https://img.shields.io/github/license/ericvera/whatsapp-cloudapi.svg?style=flat-square)](https://github.com/ericvera/whatsapp-cloudapi/blob/master/LICENSE)
[![npm version](https://img.shields.io/npm/v/%40whatsapp-cloudapi%2Ftypes.svg?style=flat-square)](https://npmjs.org/package/%40whatsapp-cloudapi%2Ftypes)

## Features

- ✨ Full TypeScript support
- 📝 Comprehensive JSDoc comments
- 🎯 Separate imports for Cloud API, webhook, and simulation types
- 🔒 Strict type checking
- 📦 Zero runtime overhead - types only!

## Installation

```bash
npm install @whatsapp-cloudapi/types
# or
yarn add @whatsapp-cloudapi/types
```

## Quick Start

The types are split into three main categories:

### Cloud API Types

For request/response types when sending messages:

```typescript
import { CloudAPISendTextMessageRequest } from '@whatsapp-cloudapi/types/cloudapi'

// Now you get full type safety when sending messages!
const message: CloudAPISendTextMessageRequest = {
  messaging_product: 'whatsapp',
  recipient_type: 'individual',
  to: '+1234567890',
  type: 'text',
  text: {
    body: 'Hello from TypeScript! 👋',
  },
}
```

### Template Messages

For sending template messages with various parameter types:

```typescript
import { CloudAPISendTemplateMessageRequest } from '@whatsapp-cloudapi/types/cloudapi'

// Example of a template message with location parameter and named parameters
const templateMessage: CloudAPISendTemplateMessageRequest = {
  messaging_product: 'whatsapp',
  to: '+1234567890',
  type: 'template',
  template: {
    name: 'location_template',
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
              name: 'Tech Company HQ',
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
}
```

### Webhook Types

For handling incoming webhooks from WhatsApp:

```typescript
import {
  WebhookPayload,
  WebhookTextMessage,
} from '@whatsapp-cloudapi/types/webhook'

// Your webhook handler gets full type information
function handleWebhook(payload: WebhookPayload) {
  const message = payload.entry[0].changes[0].value.messages?.[0]

  if (message?.type === 'text') {
    // message is automatically typed as WebhookTextMessage
    console.log(message.text.body)
  }
}
```

### Template Parameter Types

The library supports all WhatsApp Cloud API template parameter types:

- `text` - Text parameters for templates
- `currency` - Currency values with code, amount and fallback
- `date_time` - Date and time parameters
- `image` - Image parameters (via ID only)
- `document` - Document parameters (via ID only)
- `video` - Video parameters (via ID only)
- `location` - Location parameters (latitude, longitude, name, address)
- `payload` - Payload for interactive buttons

### Webhook Types

```typescript
interface WebhookPayload {
  object: 'whatsapp_business_account'
  entry: {
    id: string
    changes: {
      value: {
        messages?: WebhookMessage[]
        statuses?: WebhookStatus[]
      }
    }[]
  }[]
}
```

## Requirements

- Node.js >= 22
- TypeScript >= 5.0

## Related Packages

- [@whatsapp-cloudapi/client](https://www.npmjs.com/package/@whatsapp-cloudapi/client) - Type-safe WhatsApp Cloud API client

### Simulation Types

For simulating incoming messages with the emulator:

```typescript
import { SimulateIncomingTextRequest } from '@whatsapp-cloudapi/types/simulation'

// Type-safe simulation request
const simulationRequest: SimulateIncomingTextRequest = {
  from: '1234567890',
  name: 'John Doe',
  message: 'Hello, I need help!',
}
```

## API Reference

### Simulation Types

```typescript
interface SimulateIncomingTextRequest {
  /**
   * Phone number of the sender (with or without + prefix)
   * The + prefix will be stripped to match WhatsApp ID format
   * Example: "+1234567890" or "1234567890"
   */
  from: string

  /**
   * Display name of the sender
   */
  name?: string

  /**
   * Text content of the message
   */
  message: string
}
```

### Cloud API Types

````typescript
interface CloudAPISendTextMessageRequest {
  messaging_product: 'whatsapp'
  recipient_type: 'individual'
  // Recipient's phone number (e.g., "+16505551234")
  to: string
  type: 'text'
  text: {
    body: string // Message text (max 4096 characters)
    preview_url?: boolean
  }
}

interface CloudAPISendInteractiveCTAURLRequest {
  messaging_product: 'whatsapp'
  recipient_type: 'individual'
  // Recipient's phone number (e.g., "+16505551234")
  to: string
  type: 'interactive'
  interactive: {
    type: 'cta_url'
    // Optional header (text or image only)
    header?:
      | {
          type: 'text'
          // Max 60 characters
          text: string
        }
      | {
          type: 'image'
          image: { id: string }
        }
    // Required message body
    body: {
      // Max 1024 characters
      text: string
    }
    // Optional footer
    footer?: {
      // Max 60 characters
      text: string
    }
    // Required action with CTA URL button
    action: {
      name: 'cta_url'
      parameters: {
        // Button text, max 20 characters
        display_text: string
        // Must start with http:// or https://, cannot be IP address
        url: string
      }
    }
  }
  // Optional tracking data
  biz_opaque_callback_data?: string
}

## Interactive CTA URL Messages

Send interactive call-to-action URL messages with text or image headers:

```typescript
import { CloudAPISendInteractiveCTAURLRequest } from '@whatsapp-cloudapi/types/cloudapi'

// CTA with text header
const ctaWithText: CloudAPISendInteractiveCTAURLRequest = {
  messaging_product: 'whatsapp',
  recipient_type: 'individual',
  to: '+1234567890',
  type: 'interactive',
  interactive: {
    type: 'cta_url',
    header: {
      type: 'text',
      text: 'Special Offer!'
    },
    body: {
      text: 'Check out our latest deals and save up to 50% on selected items.'
    },
    action: {
      name: 'cta_url',
      parameters: {
        display_text: 'Shop Now',
        url: 'https://shop.example.com/deals'
      }
    }
  }
}

// CTA with image header
const ctaWithImage: CloudAPISendInteractiveCTAURLRequest = {
  messaging_product: 'whatsapp',
  recipient_type: 'individual',
  to: '+1234567890',
  type: 'interactive',
  interactive: {
    type: 'cta_url',
    header: {
      type: 'image',
      image: {
        id: 'MEDIA_ID_FROM_UPLOAD'
      }
    },
    body: {
      text: 'Browse our complete product catalog with detailed specifications.'
    },
    action: {
      name: 'cta_url',
      parameters: {
        display_text: 'View Catalog',
        url: 'https://catalog.example.com'
      }
    }
  }
}
````

## Phone Number vs Phone Number ID vs WhatsApp ID

The usage of these terms can be confusing when reading through the documentation. As of October 5, 2025, this is a summary of my understanding of the different properties and the usage of these three identifiers.

1. **Phone Number** - Always in E.164 format (continue reading about `+` usage). The documentation suggests that you should always include the `+` at the beginning when specifying a phone number as the receiver to ensure that there is no confusion or ambiguity. On the flip side, I have never seen the `+` included when the API returns a phone number. When you send a message, you can include the `+` prefix in the `to` field, but WhatsApp will strip it internally. All WhatsApp IDs in webhook payloads and API responses never include the `+` prefix.

2. **Phone Number ID** - This is only used to identify Cloud API WhatsApp accounts. It is the ID that you use with the Cloud API to send messages. You will have one per phone number that you interact with, whether to send messages and/or to receive webhook notifications.

3. **WhatsApp ID** - This is an ID that WhatsApp uses to identify a phone account. As I understand it, it is most of the time the same as the customer's phone number. I believe that in some cases, like when someone migrates a phone, they may differ. You can use this to send messages to customers. It is my understanding that this is preferred, and it is also what the webhook receives in the `from` property of a message.

### In a Webhook Event

Here is a sample webhook payload from a text message:

```json
{
  "event": {
    "entry": [
      {
        "changes": [
          {
            "field": "messages",
            "value": {
              "contacts": [
                {
                  "profile": {
                    "name": "Name In WhatsApp"
                  },
                  "wa_id": "15553331111"
                }
              ],
              "messages": [
                {
                  "from": "15553331111",
                  "id": "wamid.H00000000000000000000000000000000000000000000000000000=",
                  "text": {
                    "body": "¡Hola mundo!"
                  },
                  "timestamp": "1111111111",
                  "type": "text"
                }
              ],
              "messaging_product": "whatsapp",
              "metadata": {
                "display_phone_number": "17871231234",
                "phone_number_id": "50000000000001"
              }
            }
          }
        ],
        "id": "222222222222222"
      }
    ],
    "object": "whatsapp_business_account"
  },
  "message": "Handling WhatsApp event"
}
```

According to the [documentation](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/components):

`from` (in the message)

> The customer's WhatsApp ID. A business can respond to a customer using this ID. This ID may not match the customer's phone number, which is returned by the API as input when sending a message to the customer.

So this would be the `to` that you want to respond to (it is always a WhatsApp ID).

`metadata`:

> A metadata object describing the business subscribed to the webhook. Metadata objects have the following properties:

> display_phone_number — String. The phone number that is displayed for a business.

> phone_number_id — String. ID for the phone number. A business can respond to a message using this ID.

So `display_phone_number` is the phone number that the person who sent the message used to message this account. That display number matches internally to the `phone_number_id`, which is what the API uses to interact with Cloud API.

`wa_id` (in contact)

> wa_id — String. The customer's WhatsApp ID. A business can respond to a customer using this ID. This ID may not match the customer's phone number, which is returned by the API as input when sending a message to the customer.

As I understand it, this is the same as `from` always.

NOTE: The user's phone number is not received as part of the webhook explicitly. It may be the same as the WhatsApp ID received, but it may not. The phone number is only received back after you send a message to the `wa_id` and receive the response (more below).

### In an API Response

This is a response to sending a message to the `wa_id` above.

```json
{
  "contacts": [
    {
      "input": "15553331111",
      "wa_id": "15553331111"
    }
  ],
  "message": "Sent WhatsApp response.",
  "messages": [
    {
      "id": "wamid.H0000000000000000000000000000000000000000000111111111"
    }
  ],
  "messaging_product": "whatsapp"
}
```

According to the [messages send API documentation](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages):

> wa_id — String. The customer's WhatsApp ID. A business can respond to a customer using this ID. This ID may not match the customer's phone number, which is returned by the API as input when sending a message to the customer.

So `wa_id` remains the WhatsApp ID, but we now have the phone number that maps to that WhatsApp ID in `input` (no `+`).
