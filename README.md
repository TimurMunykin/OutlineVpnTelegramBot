# VPN Manager

A comprehensive web-based VPN management application with billing system, user management, and Outline VPN integration.

## 🚀 Quick Start (Production)

### 1. Server Setup
```bash
# Run on Ubuntu 20.04+ server
sudo ./install-production.sh
```

### 2. Configuration
```bash
# Copy and edit environment file
cp .env.production .env
nano .env

# Required settings:
# - DB_PASSWORD: Strong database password
# - JWT_SECRET: Generate with: openssl rand -base64 32
# - OUTLINE_API_URL: Your Outline server API URL
# - OUTLINE_API_FINGERPRINT: Your Outline server fingerprint
```

### 3. Deploy
```bash
# Deploy application
./deploy.sh

# Application will be available at:
# - Frontend: http://your-server-ip
# - API: http://your-server-ip:3001
# - API Docs: http://your-server-ip:3001/api/docs
```

### 4. First Login
- Default admin credentials are created during setup
- Check the deployment logs for login details
- Change default password immediately after first login

## 📋 Features

- **🔐 User Management**: JWT authentication, role-based access control
- **🌐 VPN Key Management**: Create, monitor, and manage Outline VPN keys
- **💳 Billing System**: Subscription management, automated billing, balance tracking
- **📊 Traffic Monitoring**: Real-time traffic usage and limits
- **⚙️ Admin Dashboard**: User management, system settings, billing control
- **🔒 Security**: Rate limiting, firewall, automated backups
- **📱 Responsive UI**: Modern React interface with Material-UI

## 🛠️ Development

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Database
```bash
# Run migrations
npx prisma migrate dev

# Seed database
npx prisma db seed

# Open database studio
npx prisma studio
```

## 📚 Documentation

- **[Production Deployment Guide](PRODUCTION.md)** - Complete production setup guide
- **[Development Guide](CLAUDE.md)** - Architecture and development information
- **[API Documentation](http://localhost:3001/api/docs)** - Swagger API docs (when running)

## 🔧 Architecture

### Backend
- **Express.js** with TypeScript
- **Prisma ORM** with PostgreSQL
- **JWT Authentication** 
- **Automated Billing System**
- **Outline VPN Integration**

### Frontend
- **React** with TypeScript
- **Material-UI** components
- **React Router** for navigation
- **Zustand** state management

### Production
- **Docker Compose** orchestration
- **Nginx** reverse proxy
- **PostgreSQL** database
- **Automated backups**
- **SSL/HTTPS ready**

## 🚨 System Management

### Service Control
```bash
# Check status
sudo systemctl status vpn-manager

# View logs
sudo journalctl -u vpn-manager -f

# Restart service
sudo systemctl restart vpn-manager
```

### Application Logs
```bash
# View all services
docker-compose -f docker-compose.prod.yml logs -f

# View specific service
docker-compose -f docker-compose.prod.yml logs -f app
```

### Database Backup
```bash
# Manual backup
docker-compose -f docker-compose.prod.yml exec db pg_dump -U vpnuser vpnmanager > backup.sql

# Automatic daily backups are stored in ./backups/
```

## 🔒 Security

- **Firewall (UFW)**: Only ports 22, 80, 443 open
- **Fail2ban**: Brute force protection
- **Rate Limiting**: API and login protection
- **Security Headers**: XSS, CSRF, CSP protection
- **SSL/HTTPS Ready**: Let's Encrypt integration

## 📞 Support

- **Health Checks**: `curl http://localhost:3001/health`
- **Logs**: Check `./logs/` directory and Docker logs
- **Database**: Access via `docker-compose -f docker-compose.prod.yml exec db psql -U vpnuser vpnmanager`

## 📄 License

[Add your license here]

---

**Need help?** Check [PRODUCTION.md](PRODUCTION.md) for detailed instructions and troubleshooting.