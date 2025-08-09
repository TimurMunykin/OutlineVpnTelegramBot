#!/bin/bash

# Lokale Entwicklungsumgebung

case "$1" in
  "build")
    echo "🔨 Building for local development..."
    docker-compose build
    ;;
  "up")
    echo "🚀 Starting local development..."
    docker-compose up -d
    docker-compose logs -f
    ;;
  "logs")
    echo "📋 Showing logs..."
    docker-compose logs -f ${2:-}
    ;;
  "stop")
    echo "🛑 Stopping local development..."
    docker-compose down
    ;;
  "clean")
    echo "🧹 Cleaning up local development..."
    docker-compose down -v
    docker system prune -f
    ;;
  "seed")
    echo "🌱 Seeding database..."
    docker-compose exec app npx prisma db seed
    ;;
  "dev")
    echo "🚀 Starting development environment..."
    echo "Starting backend, database and frontend dev server in Docker..."
    docker-compose up -d app db frontend-dev
    echo "✅ Development environment ready!"
    echo "Frontend dev server: http://localhost:3000"
    echo "Backend API: http://localhost:3001/api"
    echo "Database: localhost:5433"
    echo ""
    echo "Showing frontend dev server logs (Ctrl+C to stop watching logs):"
    docker-compose logs -f frontend-dev
    ;;
  "test")
    echo "🧪 Testing locally before push to registry..."
    ./dev.sh build
    ./dev.sh up &
    sleep 10
    echo "✅ Local test running at http://localhost:8080"
    echo "Backend API at http://localhost:3001"
    echo "Press Ctrl+C to stop"
    wait
    ;;
  "deploy")
    echo "🚀 Building and pushing to registry..."
    docker-compose -f docker-compose.registry.yml build
    docker-compose -f docker-compose.registry.yml push
    echo "✅ Deployed to registry"
    ;;
  *)
    echo "Usage: ./dev.sh {dev|build|up|logs|stop|clean|seed|test|deploy}"
    echo ""
    echo "Commands:"
    echo "  dev    - Start development environment (backend in Docker, frontend dev server)"
    echo "  build  - Build images locally"
    echo "  up     - Start local development environment"
    echo "  logs   - Show logs (optionally specify service: ./dev.sh logs app)"
    echo "  stop   - Stop local environment"
    echo "  clean  - Clean up all local data"
    echo "  seed   - Seed database with test users"
    echo "  test   - Test locally before deploying"
    echo "  deploy - Build and push to production registry"
    ;;
esac