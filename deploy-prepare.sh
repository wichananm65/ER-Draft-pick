#!/bin/bash

# Production Deployment Script for ER Draft Pick
# This script helps prepare and deploy the application

set -e  # Exit on error

echo "🚀 ER Draft Pick - Production Deployment"
echo "========================================"
echo ""

# Check if we're in the right directory
if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    echo "❌ Error: Must run this script from the project root directory"
    exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

if ! command_exists git; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

echo "✅ All prerequisites met"
echo ""

# Check for uncommitted changes
echo "📝 Checking Git status..."
if [[ -n $(git status -s) ]]; then
    echo "⚠️  Warning: You have uncommitted changes"
    read -p "Do you want to continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check environment files
echo "🔧 Checking environment configuration..."

if [ ! -f "frontend/.env.example" ]; then
    echo "❌ frontend/.env.example not found"
    exit 1
fi

if [ ! -f "backend/.env.example" ]; then
    echo "❌ backend/.env.example not found"
    exit 1
fi

echo "✅ Environment files found"
echo ""

# Build frontend
echo "🏗️  Building frontend..."
cd frontend
npm install
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful"
else
    echo "❌ Frontend build failed"
    exit 1
fi
cd ..
echo ""

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
if [ $? -eq 0 ]; then
    echo "✅ Backend dependencies installed"
else
    echo "❌ Backend dependency installation failed"
    exit 1
fi
cd ..
echo ""

# Check for render.yaml
if [ ! -f "render.yaml" ]; then
    echo "⚠️  Warning: render.yaml not found"
    echo "   You may need to create this file for Render.com deployment"
fi

# Summary
echo ""
echo "✅ Pre-deployment checks complete!"
echo ""
echo "📋 Deployment Checklist:"
echo "   1. ✅ Frontend built successfully"
echo "   2. ✅ Backend dependencies installed"
echo "   3. Push code to GitHub: git push origin master"
echo "   4. Configure environment variables in Render dashboard:"
echo ""
echo "   Backend:"
echo "      - NODE_ENV=production"
echo "      - PORT=10000"
echo "      - ALLOWED_ORIGINS=https://your-frontend-url.onrender.com"
echo ""
echo "   Frontend:"
echo "      - NODE_ENV=production"
echo "      - NEXT_PUBLIC_WS_URL=wss://your-backend-url.onrender.com/ws"
echo "      - NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com"
echo ""
echo "   5. Deploy via Render Dashboard or Blueprint"
echo ""
echo "📖 For detailed instructions, see: DEPLOYMENT.md"
echo ""
