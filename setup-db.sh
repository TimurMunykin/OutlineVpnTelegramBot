#!/bin/bash

# Database setup script for VPN Manager with Prisma
echo "🔧 Setting up VPN Manager database with Prisma..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install it first:"
    echo "   macOS: brew install postgresql"
    echo "   Ubuntu: sudo apt-get install postgresql postgresql-contrib"
    echo "   CentOS: sudo yum install postgresql postgresql-server"
    exit 1
fi

# Default database settings
DB_NAME="${DB_NAME:-vpn_manager}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_PASSWORD="${DB_PASSWORD:-}"

echo "📊 Database settings:"
echo "   Host: $DB_HOST:$DB_PORT"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"

# Build DATABASE_URL
if [ -n "$DB_PASSWORD" ]; then
    DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
else
    DATABASE_URL="postgresql://$DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"
fi

# Create database if it doesn't exist
echo "🔄 Creating database if it doesn't exist..."
createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME 2>/dev/null || echo "Database $DB_NAME already exists or creation failed"

# Set up environment variables for Prisma
export DATABASE_URL="$DATABASE_URL"

echo "🗄️ Database URL: $DATABASE_URL"

# Navigate to backend directory
cd backend

# Install dependencies if not already installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Generate Prisma client
echo "🔄 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🔄 Running database migrations..."
npx prisma migrate dev --name init

# Seed the database
echo "🌱 Seeding database with initial data..."
npm run db:seed

if [ $? -eq 0 ]; then
    echo "✅ Database setup completed successfully!"
    echo ""
    echo "🔑 Default login credentials:"
    echo "   Admin: admin@example.com / admin123"
    echo "   User:  user@example.com / user123"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Copy .env.example to .env and configure your settings"
    echo "   2. Start the backend: npm run dev"
    echo "   3. Start the frontend: cd ../frontend && npm run dev"
    echo ""
    echo "🎯 Useful commands:"
    echo "   npm run db:studio  - Open Prisma Studio (database GUI)"
    echo "   npm run db:reset   - Reset database and re-run migrations"
    echo "   npm run db:migrate - Run new migrations"
else
    echo "❌ Database setup failed!"
    exit 1
fi