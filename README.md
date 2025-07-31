# VPN Manager

Web-based VPN management system with OAuth 2.0 provider capabilities.

## Features

- **User Management**: Admin and regular user roles
- **VPN Key Management**: Create, list, and delete Outline VPN keys
- **OAuth 2.0 Server**: Act as authentication provider for external apps
- **Web Interface**: Modern React frontend with Material-UI
- **API Documentation**: Swagger/OpenAPI docs available

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 12+
- Git

### 1. Clone and Install

```bash
git clone <repository-url>
cd OutlineVpnTelegramBot

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies  
cd ../frontend
npm install
cd ..
```

### 2. Database Setup

**Option 1: Auto setup (recommended)**
```bash
./setup-db.sh
```

**Option 2: Manual setup**
```bash
# Create PostgreSQL database
createdb vpn_manager

# Set environment variable
export DATABASE_URL="postgresql://username:password@localhost:5432/vpn_manager"

# Run migrations
cd backend
npm run db:migrate
```

### 3. Configuration

**Backend (.env)**
```bash
cd backend
cp .env.example .env
# Edit .env with your settings
```

**Frontend (.env)**
```bash
cd frontend  
cp .env.example .env
# Edit .env if needed
```

### 4. Run Applications

**Backend (Terminal 1)**
```bash
cd backend
npm run dev
```

**Frontend (Terminal 2)**
```bash
cd frontend
npm run dev
```

### 5. Access Applications

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Docs**: http://localhost:3001/api/docs
- **OAuth Discovery**: http://localhost:3001/.well-known/oauth-authorization-server

### Default Login

- **Email**: admin@example.com
- **Password**: admin123

⚠️ **Change the default password immediately!**

## Environment Variables

### Backend (.env)

```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/vpn_manager

# JWT Secrets
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Outline VPN
OUTLINE_API_URL=https://your-outline-server.com/api
OUTLINE_API_FINGERPRINT=your-outline-fingerprint

# Server
PORT=3001
NODE_ENV=development
```

### Frontend (.env)

```bash
VITE_API_BASE_URL=http://localhost:3001/api
```

## API Usage

### Authentication

```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# Use token in subsequent requests
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/vpn/keys
```

### OAuth 2.0 Flow

1. **Register OAuth App** via web interface
2. **Authorization URL**: 
   ```
   GET /api/oauth/authorize?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT&scope=read write
   ```
3. **Exchange Code for Token**:
   ```bash
   curl -X POST http://localhost:3001/api/oauth/token \
     -d "grant_type=authorization_code&code=CODE&client_id=CLIENT_ID&client_secret=CLIENT_SECRET&redirect_uri=REDIRECT_URI"
   ```

## Development

### Database Commands

```bash
cd backend

# Run migrations
npm run db:migrate

# Reset database (re-run migrations)
npm run db:setup
```

### Code Quality

```bash
# Backend
cd backend
npm run lint        # ESLint
npm run typecheck   # TypeScript check
npm run build       # Build for production

# Frontend  
cd frontend
npm run lint        # ESLint
npm run typecheck   # TypeScript check
npm run build       # Build for production
```

## Project Structure

```
├── backend/                 # Express.js API
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Express middleware
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   └── utils/           # Utilities
│   └── swagger/             # API documentation
├── frontend/                # React frontend
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── stores/          # Zustand stores
│   │   └── types/           # TypeScript types
└── src/                     # Legacy Telegram bot
```

## Integrations

### Telegram Bot Integration

The OAuth server allows the legacy Telegram bot (or new bots) to authenticate users:

1. User sends `/login` to bot
2. Bot redirects to OAuth authorization URL  
3. User authorizes via web interface
4. Bot receives access token
5. Bot can now manage user's VPN keys

### Mobile Apps

Mobile applications can use the OAuth 2.0 flow to authenticate users and manage VPN keys.

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
pg_isready

# Check database exists
psql -l | grep vpn_manager

# Manual connection test
psql postgresql://username:password@localhost:5432/vpn_manager
```

### Port Already in Use

```bash
# Kill processes on ports 3000/3001
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

## License

MIT License - see LICENSE file for details.