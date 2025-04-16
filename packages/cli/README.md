# WhatsApp Cloud API CLI

**Command-line tools for using the WhatsApp Cloud API emulator.**

[![github license](https://img.shields.io/github/license/ericvera/whatsapp-cloudapi.svg?style=flat-square)](https://github.com/ericvera/whatsapp-cloudapi/blob/master/LICENSE)
[![npm version](https://img.shields.io/npm/v/%40whatsapp-cloudapi%2Fcli.svg?style=flat-square)](https://npmjs.org/package/%40whatsapp-cloudapi%2Fcli)

## Features

- ✨ TypeScript support
- 🛠️ Easy-to-use command-line interface
- 🧪 Start and manage the WhatsApp Cloud API emulator
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

## Requirements

- Node.js >= 22
- TypeScript >= 5.0 (for TypeScript users)

## Related Packages

- [@whatsapp-cloudapi/client](https://www.npmjs.com/package/@whatsapp-cloudapi/client) - Type-safe WhatsApp Cloud API client
- [@whatsapp-cloudapi/types](https://www.npmjs.com/package/@whatsapp-cloudapi/types) - TypeScript types for the WhatsApp Cloud API
- [@whatsapp-cloudapi/emulator](https://www.npmjs.com/package/@whatsapp-cloudapi/emulator) - WhatsApp Cloud API emulator
