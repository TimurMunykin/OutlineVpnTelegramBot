#!/bin/bash

# Script to renew Let's Encrypt SSL certificates
# Should be run every 60 days or set up as a cron job

set -e

echo "🔄 Renewing SSL certificates..."

# Check if SSL directory exists
if [ ! -d "./nginx/ssl/live" ]; then
    echo "❌ No SSL certificates found. Run ./get-ssl-cert.sh first"
    exit 1
fi

# Find domain from existing certificates
DOMAIN=$(ls ./nginx/ssl/live/ | head -n 1)

if [ -z "$DOMAIN" ]; then
    echo "❌ No domain found in SSL directory"
    exit 1
fi

echo "🔐 Renewing certificate for domain: $DOMAIN"

# Create temporary docker-compose for certificate renewal
cat > docker-compose.renew.yml << EOF
version: '3.8'

services:
  nginx-renew:
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
    command: renew --webroot --webroot-path=/var/www/certbot
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
            return 200 "Certificate renewal server running\n";
            add_header Content-Type text/plain;
        }
    }
}
EOF

# Stop main application
echo "🛑 Stopping main application..."
docker-compose -f docker-compose.prod.yml down

# Start temporary nginx for certificate renewal
echo "🚀 Starting temporary nginx for certificate renewal..."
docker-compose -f docker-compose.renew.yml up -d nginx-renew

# Wait a moment for nginx to start
sleep 3

# Renew the certificate
echo "📜 Renewing SSL certificate..."
docker-compose -f docker-compose.renew.yml run --rm certbot

# Check if renewal was successful
if [ $? -eq 0 ]; then
    echo "✅ Certificate renewal completed!"
    
    # Stop temporary containers
    echo "🛑 Stopping temporary containers..."
    docker-compose -f docker-compose.renew.yml down
    
    # Clean up temporary files
    rm -f docker-compose.renew.yml
    rm -f ./nginx/nginx-cert.conf
    
    # Restart main application
    echo "🚀 Restarting main application..."
    docker-compose -f docker-compose.prod.yml up -d
    
    echo ""
    echo "🎉 SSL Certificate successfully renewed!"
    echo "📋 New certificate info:"
    openssl x509 -in ./nginx/ssl/live/$DOMAIN/fullchain.pem -noout -text | grep -A2 "Validity"
    
else
    echo "❌ Certificate renewal failed"
    echo "🛑 Stopping temporary containers..."
    docker-compose -f docker-compose.renew.yml down
    rm -f docker-compose.renew.yml
    rm -f ./nginx/nginx-cert.conf
    
    # Try to restart main application anyway
    echo "🚀 Attempting to restart main application..."
    docker-compose -f docker-compose.prod.yml up -d
    exit 1
fi