@echo off
REM Production Deployment Script for ER Draft Pick (Windows)
REM This script helps prepare and deploy the application

setlocal enabledelayedexpansion

echo 🚀 ER Draft Pick - Production Deployment
echo ========================================
echo.

REM Check if we're in the right directory
if not exist "frontend" (
    echo ❌ Error: frontend directory not found
    exit /b 1
)
if not exist "backend" (
    echo ❌ Error: backend directory not found
    exit /b 1
)

echo 📋 Checking prerequisites...

REM Check for Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    exit /b 1
)

REM Check for npm
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm is not installed. Please install npm first.
    exit /b 1
)

REM Check for git
where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Git is not installed. Please install Git first.
    exit /b 1
)

echo ✅ All prerequisites met
echo.

REM Check environment files
echo 🔧 Checking environment configuration...

if not exist "frontend\.env.example" (
    echo ❌ frontend\.env.example not found
    exit /b 1
)

if not exist "backend\.env.example" (
    echo ❌ backend\.env.example not found
    exit /b 1
)

echo ✅ Environment files found
echo.

REM Build frontend
echo 🏗️  Building frontend...
cd frontend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Frontend dependency installation failed
    exit /b 1
)

call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Frontend build failed
    exit /b 1
)
echo ✅ Frontend build successful
cd ..
echo.

REM Install backend dependencies
echo 📦 Installing backend dependencies...
cd backend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Backend dependency installation failed
    exit /b 1
)
echo ✅ Backend dependencies installed
cd ..
echo.

REM Check for render.yaml
if not exist "render.yaml" (
    echo ⚠️  Warning: render.yaml not found
    echo    You may need to create this file for Render.com deployment
)

REM Summary
echo.
echo ✅ Pre-deployment checks complete!
echo.
echo 📋 Deployment Checklist:
echo    1. ✅ Frontend built successfully
echo    2. ✅ Backend dependencies installed
echo    3. Push code to GitHub: git push origin master
echo    4. Configure environment variables in Render dashboard:
echo.
echo    Backend:
echo       - NODE_ENV=production
echo       - PORT=10000
echo       - ALLOWED_ORIGINS=https://your-frontend-url.onrender.com
echo.
echo    Frontend:
echo       - NODE_ENV=production
echo       - NEXT_PUBLIC_WS_URL=wss://your-backend-url.onrender.com/ws
echo       - NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
echo.
echo    5. Deploy via Render Dashboard or Blueprint
echo.
echo 📖 For detailed instructions, see: DEPLOYMENT.md
echo.

pause
