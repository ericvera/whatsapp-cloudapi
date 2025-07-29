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
  from: '+1234567890',
  name: 'John Doe',
  message: 'Hello, I need help!',
}
```

## API Reference

### Simulation Types

```typescript
interface SimulateIncomingTextRequest {
  /**
   * Phone number of the sender in E.164 format
   */
  from: string

  /**
   * Display name of the sender
   */
  name: string

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
