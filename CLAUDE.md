# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Telegram bot that integrates with Outline VPN to manage VPN access keys. The bot allows users to create, list, remove, and get information about VPN keys through Telegram commands.

## Architecture

The project follows a simple modular structure:

- **src/index.ts**: Main entry point that sets up the Telegram bot and handles commands (`/addkey`, `/listkeys`, `/removekey <keyId>`, `/keyinfo <keyId>`)
- **src/vpnManager.ts**: Handles all VPN operations using the Outline VPN API (create, list, remove, get key info)
- **src/telegram.ts**: Contains duplicate/legacy Telegram bot setup (appears to be unused in favor of index.ts)

## Environment Variables Required

The application requires these environment variables in a `.env` file:
- `TELEGRAM_BOT_TOKEN`: Telegram bot API token
- `OUTLINE_API_URL`: Outline VPN server API URL
- `OUTLINE_API_FINGERPRINT`: Outline VPN server fingerprint for authentication

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build TypeScript to JavaScript
npm run build
```

## Docker Development

```bash
# Build and run with Docker Compose
docker-compose up --build

# Run standalone Docker container
docker build -t telegram-vpn-bot .
docker run --env-file .env telegram-vpn-bot
```

## Key Dependencies

- **node-telegram-bot-api**: Telegram Bot API wrapper
- **outlinevpn-api**: Outline VPN management API client
- **dotenv**: Environment variable management
- **axios**: HTTP client for API requests

## Code Structure Notes

- Error handling is implemented for all VPN operations with user-friendly Telegram messages
- The bot uses polling mode to receive Telegram updates
- All VPN operations are asynchronous and properly awaited
- TypeScript is configured with strict mode and ES2020 target