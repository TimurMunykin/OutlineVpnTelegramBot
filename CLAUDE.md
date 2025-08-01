# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a web-based VPN management application that integrates with Outline VPN servers. The application provides a comprehensive web interface for managing VPN access keys, users, billing system, and server administration.

## Architecture

The project is a full-stack web application with the following structure:

### Backend (`/backend`)
- **Express.js** REST API with TypeScript
- **Prisma ORM** with PostgreSQL database
- **JWT Authentication** with role-based access control
- **OAuth 2.0** provider for third-party integrations
- **Billing System** with subscription management and automated billing
- **Cron Jobs** for scheduled tasks (daily billing)

### Frontend (`/frontend`)
- **React** with TypeScript and Vite
- **Material-UI (MUI)** for consistent design system
- **React Router** for client-side routing
- **Zustand** for state management

### Key Components

#### Backend Services
- **VPN Service**: Manages Outline VPN server integration
- **Billing Service**: Handles subscriptions, balance management, traffic limiting
- **Cron Service**: Automated daily billing and maintenance tasks
- **User Management**: Authentication, authorization, user limits

#### Frontend Pages
- **Dashboard**: Overview and quick actions
- **VPN Keys**: Create, manage, and monitor VPN access keys
- **Billing**: Subscription management (user view) and admin billing tools
- **Users**: User management (admin only)
- **Settings**: Global application configuration (admin only)

## Environment Variables Required

The application requires these environment variables in a `.env` file:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT token signing
- `OUTLINE_API_URL`: Outline VPN server API URL
- `OUTLINE_API_FINGERPRINT`: Outline VPN server fingerprint for authentication

## Development Commands

```bash
# Backend development
cd backend
npm install
npm run dev

# Frontend development  
cd frontend
npm install
npm run dev

# Database operations
npx prisma migrate dev
npx prisma db seed
npx prisma studio
```

## Production Deployment

```bash
# Copy and configure environment
cp .env.production .env
# Edit .env with your settings

# Deploy with Docker Compose
./deploy.sh

# Or manual deployment
docker-compose -f docker-compose.prod.yml up -d
```

## Key Dependencies

### Backend
- **express**: Web application framework
- **prisma**: Database ORM and query builder
- **jsonwebtoken**: JWT authentication
- **node-cron**: Scheduled task execution
- **outlinevpn-api**: Outline VPN management API client

### Frontend
- **react**: UI library
- **@mui/material**: Material Design components
- **react-router-dom**: Client-side routing
- **zustand**: State management
- **axios**: HTTP client

## Code Structure Notes

- **Type Safety**: Full TypeScript coverage across backend and frontend
- **Authentication**: JWT-based with role-based access control (USER/ADMIN)
- **Database**: Prisma ORM with PostgreSQL, migrations and seeding
- **API Design**: RESTful endpoints with Swagger documentation
- **Security**: Rate limiting, CORS, helmet security headers
- **Billing**: Automated subscription management with traffic limiting
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Production Ready**: Docker containers, nginx proxy, automatic backups