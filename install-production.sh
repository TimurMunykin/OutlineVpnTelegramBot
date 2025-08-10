#!/bin/bash

# Production installation script for VPN Manager
set -e

echo "🚀 Installing VPN Manager for production..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ This script must be run as root (use sudo)"
    exit 1
fi

# Update system packages
echo "📦 Updating system packages..."
apt-get update && apt-get upgrade -y

# Install required packages
echo "📥 Installing required packages..."
apt-get install -y curl git docker.io docker-compose-plugin ufw fail2ban logrotate

# Start and enable Docker
systemctl start docker
systemctl enable docker

# Add current user to docker group (if not root)
if [ "$SUDO_USER" ]; then
    usermod -aG docker $SUDO_USER
    echo "✅ Added $SUDO_USER to docker group"
fi

# Configure firewall
echo "🔥 Configuring firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3001/tcp  # Backend API (can be removed if only using nginx proxy)
ufw --force enable

# Configure fail2ban
echo "🛡️ Configuring fail2ban for additional security..."
cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 5

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
maxretry = 10
EOF

systemctl enable fail2ban
systemctl start fail2ban

# Create application directory
APP_DIR="/opt/vpn-manager"
echo "📁 Creating application directory at $APP_DIR..."
mkdir -p $APP_DIR
cd $APP_DIR

# Clone or copy application (adjust as needed)
if [ ! -d ".git" ]; then
    echo "📥 Please copy your application files to $APP_DIR"
    echo "Or clone from your repository:"
    echo "git clone <your-repo-url> ."
fi

# Set up log rotation
echo "📝 Setting up log rotation..."
cat > /etc/logrotate.d/vpn-manager << EOF
$APP_DIR/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 root root
    postrotate
        docker-compose -f $APP_DIR/docker-compose.prod.yml restart app > /dev/null 2>&1 || true
    endscript
}
EOF

# Install systemd service
echo "⚙️ Installing systemd service..."
cp vpn-manager.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable vpn-manager

# Set proper permissions
chown -R $SUDO_USER:$SUDO_USER $APP_DIR 2>/dev/null || true
chmod +x $APP_DIR/deploy.sh

echo ""
echo "✅ Installation completed!"
echo ""
echo "📋 Next steps:"
echo "1. Copy your application files to $APP_DIR (if not done already)"
echo "2. Copy .env.production to .env and configure your settings:"
echo "   cp .env.production .env"
echo "   nano .env"
echo "3. Run the deployment script:"
echo "   ./deploy.sh"
echo "4. Start the service:"
echo "   sudo systemctl start vpn-manager"
echo ""
echo "🔧 Useful commands:"
echo "   sudo systemctl status vpn-manager  # Check service status"
echo "   sudo systemctl logs vpn-manager    # View service logs"
echo "   sudo journalctl -u vpn-manager -f  # Follow service logs"
echo "   sudo systemctl restart vpn-manager # Restart service"
echo ""
echo "🔒 Security notes:"
echo "   - Firewall (UFW) is enabled with minimal required ports"
echo "   - Fail2ban is configured for SSH and Nginx protection"
echo "   - Change default SSH port for additional security"
echo "   - Consider setting up SSL certificates for HTTPS"