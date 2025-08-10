#!/bin/bash

# Script to get Let's Encrypt SSL certificates for the VPN Manager application
# Usage: ./get-ssl-cert.sh your-domain.com your-email@example.com

set -e

# Check if domain and email are provided
if [ $# -lt 2 ]; then
    echo "Usage: $0 <domain> <email>"
    echo "Example: $0 vpn.example.com admin@example.com"
    exit 1
fi

DOMAIN=$1
EMAIL=$2

echo "🔐 Getting SSL certificate for domain: $DOMAIN"
echo "📧 Email: $EMAIL"

# Create necessary directories
echo "📁 Creating SSL directories..."
mkdir -p ./nginx/ssl/live/$DOMAIN
mkdir -p ./nginx/ssl/archive/$DOMAIN
mkdir -p ./certbot/www/.well-known/acme-challenge

# Update nginx configuration with the actual domain
echo "⚙️  Updating nginx configuration..."
sed -i "s/your-domain.com/$DOMAIN/g" ./nginx/nginx.conf

# Create temporary docker-compose for initial certificate
cat > docker-compose.cert.yml << EOF
version: '3.8'

services:
  nginx-cert:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx-cert.conf:/etc/nginx/nginx.conf:ro
      - ./certbot/www:/var/www/certbot:ro
    command: nginx -g 'daemon off;'

  certbot:
    image: certbot/certbot
    volumes:
      - ./nginx/ssl:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    command: certonly --webroot --webroot-path=/var/www/certbot --email $EMAIL --agree-tos --no-eff-email -d $DOMAIN
EOF

# Create temporary nginx config for certificate validation
cat > ./nginx/nginx-cert.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    server {
        listen 80;
        server_name _;
        
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }
        
        location / {
            return 200 "Certificate validation server running\n";
            add_header Content-Type text/plain;
        }
    }
}
EOF

# Stop any running containers
echo "🛑 Stopping any running containers..."
docker-compose -f docker-compose.prod.yml down || true

# Start temporary nginx for certificate validation
echo "🚀 Starting temporary nginx for certificate validation..."
docker-compose -f docker-compose.cert.yml up -d nginx-cert

# Wait a moment for nginx to start
sleep 3

# Test if the validation endpoint is accessible
echo "🔍 Testing validation endpoint..."
if curl -f http://localhost/.well-known/acme-challenge/ >/dev/null 2>&1; then
    echo "✅ Validation endpoint is accessible"
else
    echo "⚠️  Warning: Validation endpoint might not be accessible"
fi

# Get the certificate
echo "📜 Requesting SSL certificate from Let's Encrypt..."
docker-compose -f docker-compose.cert.yml run --rm certbot

# Check if certificate was created
if [ -f "./nginx/ssl/live/$DOMAIN/fullchain.pem" ]; then
    echo "✅ Certificate successfully obtained!"
    
    # Set proper permissions
    echo "🔒 Setting proper permissions..."
    sudo chown -R $USER:$USER ./nginx/ssl
    chmod -R 755 ./nginx/ssl
    
    # Stop temporary containers
    echo "🛑 Stopping temporary containers..."
    docker-compose -f docker-compose.cert.yml down
    
    # Clean up temporary files
    rm -f docker-compose.cert.yml
    rm -f ./nginx/nginx-cert.conf
    
    echo ""
    echo "🎉 SSL Certificate successfully obtained!"
    echo "📋 Certificate info:"
    openssl x509 -in ./nginx/ssl/live/$DOMAIN/fullchain.pem -noout -text | grep -A2 "Validity"
    
    echo ""
    echo "🚀 You can now start your application with HTTPS:"
    echo "   docker-compose -f docker-compose.prod.yml up -d"
    echo ""
    echo "🔄 To renew certificates (run every 60 days):"
    echo "   ./renew-ssl-cert.sh"
    
else
    echo "❌ Failed to obtain certificate"
    echo "🛑 Stopping temporary containers..."
    docker-compose -f docker-compose.cert.yml down
    rm -f docker-compose.cert.yml
    rm -f ./nginx/nginx-cert.conf
    exit 1
fi