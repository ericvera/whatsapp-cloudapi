# WhatsApp Cloud API Types

**TypeScript types for the WhatsApp Cloud API**

[![github license](https://img.shields.io/github/license/ericvera/whatsapp-cloudapi.svg?style=flat-square)](https://github.com/ericvera/whatsapp-cloudapi/blob/master/LICENSE)
[![npm version](https://img.shields.io/npm/v/%40whatsapp-cloudapi%2Ftypes.svg?style=flat-square)](https://npmjs.org/package/%40whatsapp-cloudapi%2Ftypes)

## Features

- ✨ Full TypeScript support
- 📝 Comprehensive JSDoc comments
- 🎯 Separate imports for Cloud API and webhook types
- 🔒 Strict type checking
- 📦 Zero runtime overhead - types only!

## Installation

```bash
npm install @whatsapp-cloudapi/types
# or
yarn add @whatsapp-cloudapi/types
```

## Quick Start

The types are split into two main categories:

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

## API Reference

### Cloud API Types

```typescript
interface CloudAPISendTextMessageRequest {
  messaging_product: 'whatsapp'
  recipient_type: 'individual'
  to: string // Recipient's phone number (e.g., "+16505551234")
  type: 'text'
  text: {
    body: string // Message text (max 4096 characters)
    preview_url?: boolean
  }
}
```

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
