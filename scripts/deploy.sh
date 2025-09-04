#!/bin/bash

set -e

echo "🚀 Starting deployment..."

if [ "$1" = "production" ]; then
    echo "📦 Building for production..."
    
    echo "Installing backend dependencies..."
    cd backend && npm ci --only=production
    
    echo "Installing frontend dependencies..."
    cd ../frontend && npm ci
    
    echo "Building frontend..."
    npm run build
    
    echo "Building Docker images..."
    cd .. && docker-compose build
    
    echo "Starting services..."
    docker-compose up -d
    
    echo "Running database migrations..."
    docker-compose exec backend npm run migrate
    
    echo "✅ Production deployment completed!"
    
elif [ "$1" = "development" ]; then
    echo "🔧 Setting up development environment..."
    
    echo "Starting development services..."
    docker-compose -f docker-compose.dev.yml up -d
    
    echo "Installing backend dependencies..."
    cd backend && npm install
    
    echo "Installing frontend dependencies..."
    cd ../frontend && npm install
    
    echo "Creating environment files..."
    if [ ! -f backend/.env ]; then
        cp backend/.env.example backend/.env
        echo "⚠️  Please configure backend/.env with your settings"
    fi
    
    if [ ! -f frontend/.env ]; then
        cp frontend/.env.example frontend/.env
    fi
    
    echo "✅ Development environment ready!"
    echo "Run 'npm run dev' in both backend/ and frontend/ directories"
    
else
    echo "Usage: ./scripts/deploy.sh [production|development]"
    exit 1
fi
