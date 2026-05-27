# WhatsApp Cloud API Toolkit

All-in-one toolkit for WhatsApp Cloud API with types, client library, CLI tools, and local emulation.

## Packages

This monorepo contains the following packages:

- [@whatsapp-cloudapi/client](./packages/client) - Type-safe WhatsApp Cloud API client for Node.js
- [@whatsapp-cloudapi/types](./packages/types) - TypeScript types for the WhatsApp Cloud API
- [@whatsapp-cloudapi/emulator](./packages/emulator) - WhatsApp Cloud API emulator for testing and development
- [@whatsapp-cloudapi/cli](./packages/cli) - Command-line tools for using the WhatsApp Cloud API emulator

## Features

- 🔒 Comprehensive type definitions for the WhatsApp Cloud API
- 📱 Support for text, template, media, interactive, flow, and location-based messages
- 🧪 Local emulation for development and testing
- 📲 Simulation of incoming messages to trigger webhooks
- 💻 CLI tools for managing the emulator and simulating messages
- 📦 Modern ESM packages
- ✅ Full compatibility with WhatsApp Business Platform

## Upgrading

v5.0.0 brings the types in line with the current WhatsApp Cloud API, including
the **business-scoped user ID (BSUID)** / WhatsApp usernames rollout. This
includes breaking changes (some identifiers are now optional and `WebhookChange`
is a discriminated union). See the
[types package upgrade guide](./packages/types#upgrading-to-v500-business-scoped-user-ids)
for details and Meta migration links.

## Requirements

- Node.js >= 24
- TypeScript >= 6.0 (for TypeScript users)
