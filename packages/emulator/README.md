# WhatsApp Cloud API Emulator

**A powerful and type-safe WhatsApp Cloud API emulator for testing and development.**

[![github license](https://img.shields.io/github/license/ericvera/whatsapp-cloudapi.svg?style=flat-square)](https://github.com/ericvera/whatsapp-cloudapi/blob/master/LICENSE)
[![npm version](https://img.shields.io/npm/v/%40whatsapp-cloudapi%2Femulator.svg?style=flat-square)](https://npmjs.org/package/%40whatsapp-cloudapi%2Femulator)

## Features

- ✨ TypeScript support
- 🔒 Type-safe request and response handling
- 🛠️ Mock server implementation
- 🧪 Perfect for testing and development
- 🔄 Modern ESM package
- ⚡ Lightweight and efficient

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
  port: 3000,
  phoneNumber: '15550123456', // The phone number to emulate
})

// Start the emulator
await emulator.start()

// The emulator is now running and ready to accept requests
// Use it in your tests or development environment

// When done, stop the emulator
await emulator.stop()
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
  port: number
  phoneNumber: string
  host?: string // defaults to localhost
  delay?: number // simulate network delay in ms
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

## Requirements

- Node.js >= 22
- TypeScript >= 5.0 (for TypeScript users)

## Related Packages

- [@whatsapp-cloudapi/client](https://www.npmjs.com/package/@whatsapp-cloudapi/client) - WhatsApp Cloud API client
- [@whatsapp-cloudapi/types](https://www.npmjs.com/package/@whatsapp-cloudapi/types) - TypeScript types for the WhatsApp Cloud API
