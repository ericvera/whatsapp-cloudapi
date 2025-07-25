# WhatsApp Cloud API CLI

**Command-line tools for using the WhatsApp Cloud API emulator.**

[![github license](https://img.shields.io/github/license/ericvera/whatsapp-cloudapi.svg?style=flat-square)](https://github.com/ericvera/whatsapp-cloudapi/blob/master/LICENSE)
[![npm version](https://img.shields.io/npm/v/%40whatsapp-cloudapi%2Fcli.svg?style=flat-square)](https://npmjs.org/package/%40whatsapp-cloudapi%2Fcli)

## Features

- ✨ TypeScript support
- 🛠️ Easy-to-use command-line interface
- 🧪 Start and manage the WhatsApp Cloud API emulator
- 📲 Simulate incoming messages to trigger webhooks
- 🔄 Modern ESM package
- ⚡ Lightweight and efficient

## Installation

```bash
npm install -g @whatsapp-cloudapi/cli
# or
yarn global add @whatsapp-cloudapi/cli
```

## Quick Start

```bash
# Start the emulator with a business phone number
wa-emulator start --number 15550123456

# Check if the emulator is running
wa-emulator status

# Simulate an incoming message
wa-emulator simulate text --message "Hello, I need help!"
```

## Commands

### Start Emulator

Start the WhatsApp Cloud API emulator:

```bash
wa-emulator start [options]
```

Options:

- `-p, --port <number>` - Port to run the emulator on (default: 4004)
- `-h, --host <string>` - Host to bind to (default: localhost)
- `-n, --number <string>` - Business phone number ID (required)

Example:

```bash
wa-emulator start --port 3000 --host 0.0.0.0 --number 15550123456
```

### Check Status

Check if the WhatsApp Cloud API emulator is running:

```bash
wa-emulator status [options]
```

Options:

- `-p, --port <number>` - Port to check (default: 4004)
- `-h, --host <string>` - Host to check (default: localhost)

Example:

```bash
wa-emulator status --port 3000
```

### Simulate Incoming Messages

Simulate incoming text messages to trigger webhooks:

```bash
wa-emulator simulate text [options]
```

Options:

- `-p, --port <number>` - Port where emulator is running (default: 4004)
- `-h, --host <string>` - Host where emulator is running (default: localhost)
- `-f, --from <phone>` - Phone number of sender in E.164 format (auto-generated if not provided)
- `-n, --name <name>` - Name of sender (default: "Test User")
- `-m, --message <text>` - Message text (required)

Examples:

```bash
# Basic usage - auto-generates phone number
wa-emulator simulate text --message "Hello, I need help!"

# With custom sender info
wa-emulator simulate text --from +1234567890 --name "John Doe" --message "My order is late"

# Test different scenarios
wa-emulator simulate text --from +1555987654 --name "Jane Smith" --message "What are your hours?"
```

**Note:** Phone numbers are auto-generated in the format `+1555xxxxxxx` if not provided. The emulator validates phone numbers using E.164 format.

## Requirements

- Node.js >= 22
- TypeScript >= 5.0 (for TypeScript users)

## Related Packages

- [@whatsapp-cloudapi/client](https://www.npmjs.com/package/@whatsapp-cloudapi/client) - Type-safe WhatsApp Cloud API client
- [@whatsapp-cloudapi/types](https://www.npmjs.com/package/@whatsapp-cloudapi/types) - TypeScript types for the WhatsApp Cloud API
- [@whatsapp-cloudapi/emulator](https://www.npmjs.com/package/@whatsapp-cloudapi/emulator) - WhatsApp Cloud API emulator
