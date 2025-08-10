# VPN Manager - Production Deployment Guide

## 🚀 Quick Start

1. **Prepare your server** (Ubuntu 20.04+ recommended):
   ```bash
   sudo ./install-production.sh
   ```

2. **Configure environment**:
   ```bash
   cp .env.production .env
   nano .env  # Fill in your values
   ```

3. **Deploy application**:
   ```bash
   ./deploy.sh
   ```

4. **Access your application**:
   - Frontend: `http://your-server-ip`
   - API: `http://your-server-ip:3001`
   - API Docs: `http://your-server-ip:3001/api/docs`

## 📋 Prerequisites

### Server Requirements
- **OS**: Ubuntu 20.04+ (or similar Linux distribution)
- **RAM**: Minimum 2GB, recommended 4GB+
- **Storage**: Minimum 20GB SSD
- **Network**: Public IP address with ports 80, 443, 22 accessible

### Dependencies (automatically installed)
- Docker & Docker Compose
- UFW Firewall
- Fail2ban
- Nginx (via Docker)
- PostgreSQL (via Docker)

## ⚙️ Configuration

### Environment Variables (.env)

```bash
# Database (generate strong password)
DB_PASSWORD=your_super_secure_database_password_here

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your_jwt_secret_key_here

# Outline VPN Server Configuration
OUTLINE_API_URL=https://your-outline-server:port/your-api-prefix
OUTLINE_API_FINGERPRINT=your_outline_server_fingerprint

# Application Settings
NODE_ENV=production
PORT=3001
```

### Getting Outline VPN Credentials

1. **Install Outline Manager** on your desktop
2. **Set up your Outline Server** following the official guide
3. **Get API credentials**:
   - In Outline Manager, go to Settings → Advanced
   - Copy the API URL and Certificate Fingerprint

## 🔒 Security Features

### Automatic Security Setup
- **Firewall (UFW)**: Only essential ports (22, 80, 443) are open
- **Fail2ban**: Protects against brute force attacks on SSH and web services
- **Rate Limiting**: API endpoints are rate-limited to prevent abuse
- **Security Headers**: HTTPS headers, XSS protection, content security policy

### Additional Security Recommendations

1. **Change SSH port** (optional but recommended):
   ```bash
   sudo nano /etc/ssh/sshd_config
   # Change Port 22 to Port 2222
   sudo systemctl restart ssh
   sudo ufw allow 2222/tcp
   sudo ufw delete allow ssh
   ```

2. **Set up SSL/HTTPS** (recommended for production):
   ```bash
   # Install certbot
   sudo apt install certbot python3-certbot-nginx
   
   # Get SSL certificate
   sudo certbot --nginx -d your-domain.com
   
   # Update docker-compose.prod.yml to use SSL
   # Uncomment HTTPS server block in nginx.conf
   ```

3. **Set up monitoring** (optional):
   - Configure log monitoring with services like Grafana/Prometheus
   - Set up uptime monitoring
   - Configure email alerts for service failures

## 🗄️ Database Management

### Automatic Backups
- Database is automatically backed up daily at midnight
- Backups are stored in `./backups/` directory
- Old backups (>7 days) are automatically cleaned up

### Manual Database Operations

```bash
# Create manual backup
docker-compose -f docker-compose.prod.yml exec db pg_dump -U vpnuser vpnmanager > backup_manual.sql

# Restore from backup
docker-compose -f docker-compose.prod.yml exec -T db psql -U vpnuser -d vpnmanager < backup_file.sql

# Access database directly
docker-compose -f docker-compose.prod.yml exec db psql -U vpnuser -d vpnmanager

# View database logs
docker-compose -f docker-compose.prod.yml logs db
```

## 📊 Monitoring & Maintenance

### Service Management

```bash
# Check service status
sudo systemctl status vpn-manager

# View service logs
sudo journalctl -u vpn-manager -f

# Restart service
sudo systemctl restart vpn-manager

# Stop service
sudo systemctl stop vpn-manager
```

### Application Logs

```bash
# View all logs
docker-compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker-compose -f docker-compose.prod.yml logs -f app
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f db

# Check disk usage
du -sh logs/ backups/
```

### Health Checks

```bash
# Check backend health
curl http://localhost:3001/health

# Check frontend health  
curl http://localhost/health

# Check all services
docker-compose -f docker-compose.prod.yml ps
```

## 🔄 Updates & Maintenance

### Updating the Application

```bash
# Pull latest changes (if using git)
git pull origin main

# Rebuild and restart services
./deploy.sh
```

### Database Migrations

```bash
# Run pending migrations
docker-compose -f docker-compose.prod.yml exec app npx prisma migrate deploy

# Reset database (⚠️ DANGER: This will delete all data)
docker-compose -f docker-compose.prod.yml exec app npx prisma migrate reset
```

### Log Rotation
- Logs are automatically rotated daily
- Old logs are compressed and kept for 30 days
- Configuration in `/etc/logrotate.d/vpn-manager`

## 🚨 Troubleshooting

### Common Issues

1. **Service won't start**:
   ```bash
   # Check Docker status
   sudo systemctl status docker
   
   # Check environment configuration
   cat .env | grep -v "^#" | grep -v "^$"
   
   # View detailed logs
   docker-compose -f docker-compose.prod.yml logs
   ```

2. **Database connection issues**:
   ```bash
   # Check database container
   docker-compose -f docker-compose.prod.yml exec db pg_isready -U vpnuser
   
   # Reset database password
   docker-compose -f docker-compose.prod.yml down
   docker volume rm vpnmanager_postgres_data
   ./deploy.sh
   ```

3. **High memory usage**:
   ```bash
   # Check container resource usage
   docker stats
   
   # Restart services to free memory
   docker-compose -f docker-compose.prod.yml restart
   ```

### Log Locations
- Application logs: `./logs/`
- Nginx logs: `docker logs $(docker ps -q --filter="name=frontend")`
- Database logs: `docker logs $(docker ps -q --filter="name=db")`
- System logs: `/var/log/syslog`

## 📞 Support

### Getting Help
1. Check the logs first: `docker-compose -f docker-compose.prod.yml logs -f`
2. Verify environment configuration: `cat .env`
3. Check service status: `sudo systemctl status vpn-manager`
4. Test connectivity: `curl http://localhost:3001/health`

### Performance Tuning
- Adjust Docker resource limits in `docker-compose.prod.yml`
- Configure nginx worker processes based on CPU cores
- Monitor database performance with `docker-compose -f docker-compose.prod.yml exec db psql -U vpnuser -c "SELECT * FROM pg_stat_activity;"`
- Set up database connection pooling for high-traffic scenarios

## 🎯 Production Checklist

Before going live, ensure:

- [ ] Environment variables are properly configured
- [ ] Database backups are working
- [ ] SSL certificates are installed (for HTTPS)
- [ ] Firewall is properly configured
- [ ] Log rotation is working
- [ ] Health checks are passing
- [ ] Admin user is created and can log in
- [ ] Outline VPN server connection is working
- [ ] Billing system is configured (if using paid subscriptions)
- [ ] Rate limiting is appropriate for your use case
- [ ] Monitoring is set up (optional but recommended)