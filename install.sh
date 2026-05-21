#!/bin/bash

# SubTrack Pro - Installation Script
# This script installs all dependencies and sets up the project

set -e

echo "🚀 SubTrack Pro Installation"
echo "============================"
echo ""

# Check Node.js version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Error: Node.js 20+ is required"
    echo "Please install Node.js 20 or higher from https://nodejs.org"
    exit 1
fi
echo "✅ Node.js version OK"

# Install pnpm if not present
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi

# Install turbo if not present
if ! command -v turbo &> /dev/null; then
    echo "📦 Installing turbo..."
    npm install -g turbo
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
pnpm install

# Setup environment files
echo ""
echo "📝 Setting up environment files..."

if [ ! -f "apps/api/.env" ]; then
    cp .env.example apps/api/.env
    echo "✅ Created apps/api/.env"
    echo "⚠️  Please edit apps/api/.env with your credentials"
fi

if [ ! -f "apps/web/.env.local" ]; then
    cp .env.example apps/web/.env.local
    echo "✅ Created apps/web/.env.local"
    echo "⚠️  Please edit apps/web/.env.local with your credentials"
fi

# Generate Prisma client
echo ""
echo "🔧 Generating Prisma client..."
cd apps/api
npx prisma generate
cd ../..

echo ""
echo "✅ Installation complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit environment files with your credentials:"
echo "   - apps/api/.env"
echo "   - apps/web/.env.local"
echo ""
echo "2. Setup database:"
echo "   cd apps/api"
echo "   npx prisma migrate dev"
echo ""
echo "3. Start development servers:"
echo "   Terminal 1: cd apps/api && npm run start:dev"
echo "   Terminal 2: cd apps/web && npm run dev"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "📡 Backend: http://localhost:4000"
echo "📚 API Docs: http://localhost:4000/api/docs"
echo ""
echo "Happy coding! 🎉"
