#!/bin/bash

set -e

echo "🎯 eBay AI Store Manager Setup"
echo "=============================="

echo "Creating directory structure..."
mkdir -p logs backups

echo "Setting up executable permissions..."
chmod +x scripts/*.sh
chmod +x setup.sh

echo "Setting up environment files..."
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo "⚠️  Please configure backend/.env with your settings"
fi

if [ ! -f frontend/.env ]; then
    cp frontend/.env.example frontend/.env
fi

echo "Updating package.json scripts..."
node scripts/update-scripts.js

echo "Installing dependencies..."
echo "📦 Installing backend dependencies..."
cd backend && npm install

echo "📦 Installing frontend dependencies..."
cd ../frontend && npm install

echo "🏗️  Building frontend..."
npm run build

cd ..

echo "✅ Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Configure your environment variables in backend/.env"
echo "2. Set up your eBay Developer credentials"
echo "3. For development: ./scripts/deploy.sh development"
echo "4. For production: ./scripts/deploy.sh production"
echo ""
echo "Development commands:"
echo "- Backend: cd backend && npm run dev"
echo "- Frontend: cd frontend && npm run dev"
echo ""
echo "Production commands:"
echo "- Start: docker-compose up -d"
echo "- Stop: docker-compose down"
echo "- Logs: docker-compose logs -f"
echo "- Backup: ./scripts/backup.sh"
