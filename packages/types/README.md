# @whatsapp-cloudapi/types

🎯 TypeScript types for the WhatsApp Cloud API.

## What's this?

This package provides TypeScript definitions for working with the WhatsApp Cloud API. Whether you're sending messages or handling webhooks, we've got you covered with comprehensive and well-documented types.

## Installation

```bash
npm install @whatsapp-cloudapi/types
# or
yarn add @whatsapp-cloudapi/types
```

## Usage

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

## Features

- ✨ Full TypeScript support
- 📝 Comprehensive JSDoc comments
- 🎯 Separate imports for Cloud API and webhook types
- 🔒 Strict type checking
- 📦 Zero runtime overhead - types only!

## Requirements

- Node.js >= 22
- TypeScript >= 5.0

## License

MIT
