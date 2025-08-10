#!/bin/bash

# Production deployment script for VPN Manager
set -e

echo "🚀 Starting production deployment..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please copy .env.production to .env and configure your settings"
    exit 1
fi

# Check required environment variables
required_vars=("DB_PASSWORD" "JWT_SECRET" "OUTLINE_API_URL" "OUTLINE_API_FINGERPRINT")
for var in "${required_vars[@]}"; do
    if ! grep -q "^$var=" .env || grep -q "^$var=your_" .env; then
        echo "❌ Error: $var is not properly configured in .env"
        exit 1
    fi
done

echo "✅ Environment configuration verified"

# Create necessary directories
mkdir -p logs backups nginx/ssl

# Ensure nginx config exists
if [ ! -f nginx/nginx.conf ]; then
    echo "❌ Error: nginx/nginx.conf not found!"
    echo "Please ensure the nginx configuration file exists"
    exit 1
fi

echo "📁 Created required directories"

# Build and start services
echo "🔨 Building and starting services..."
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Run database migrations
echo "🔄 Running database migrations..."
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy

# Seed initial data if needed
echo "🌱 Seeding initial data..."
docker compose -f docker-compose.prod.yml exec app npx prisma db seed || echo "Seed already exists or failed - continuing..."

# Check service health
echo "🏥 Checking service health..."
sleep 5

# Check backend health
if curl -f http://localhost:3001/health >/dev/null 2>&1; then
    echo "✅ Backend service is healthy"
else
    echo "❌ Backend service health check failed"
    docker compose -f docker-compose.prod.yml logs app
    exit 1
fi

# Check frontend health
if curl -f http://localhost/health >/dev/null 2>&1; then
    echo "✅ Frontend service is healthy"
else
    echo "❌ Frontend service health check failed"
    docker compose -f docker-compose.prod.yml logs frontend
    exit 1
fi

echo "🎉 Deployment completed successfully!"
echo ""
echo "📱 Application is running at:"
echo "   Frontend: http://localhost"
echo "   Backend API: http://localhost:3001"
echo "   API Docs: http://localhost:3001/api/docs"
echo ""
echo "📊 To monitor logs:"
echo "   docker compose -f docker-compose.prod.yml logs -f"
echo ""
echo "🛑 To stop services:"
echo "   docker compose -f docker-compose.prod.yml down"
echo ""
echo "💾 Database backups are automatically created daily in ./backups/"