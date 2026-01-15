#!/bin/bash

# Hire Me For - Development Environment Setup Script
# This script sets up and runs the development environment

set -e

echo "=========================================="
echo "  HIRE ME FOR - Development Setup"
echo "=========================================="

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed. Please install Node.js 18+ first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'.' -f1 | cut -d'v' -f2)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "ERROR: Node.js 18+ is required. Current version: $(node -v)"
    exit 1
fi
echo "Node.js version: $(node -v)"

# Check for MySQL
if ! command -v mysql &> /dev/null; then
    echo "WARNING: MySQL client not found in PATH."
    echo "Make sure MySQL 8.0+ is installed and running."
fi

# Project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Backend setup
echo ""
echo "Setting up Backend..."
echo "--------------------"

if [ ! -d "$PROJECT_ROOT/backend" ]; then
    echo "Creating backend directory structure..."
    mkdir -p "$PROJECT_ROOT/backend"
fi

cd "$PROJECT_ROOT/backend"

if [ ! -f "package.json" ]; then
    echo "Initializing backend package.json..."
    cat > package.json << 'EOF'
{
  "name": "hire-me-for-backend",
  "version": "1.0.0",
  "description": "Backend API for Hire Me For marketplace platform",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "db:migrate": "node src/db/migrate.js",
    "db:seed": "node src/db/seed.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mysql2": "^3.6.5",
    "bcrypt": "^5.1.1",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "uuid": "^9.0.1",
    "multer": "^1.4.5-lts.1",
    "sharp": "^0.33.2",
    "axios": "^1.6.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
EOF
fi

if [ ! -f ".env" ]; then
    echo "Creating backend .env file template..."
    cat > .env << 'EOF'
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=hire_me_for

# Server Configuration
PORT=3001

# BulkSMS API Configuration
BULKSMS_TOKEN_ID=your_token_id_here
BULKSMS_TOKEN_SECRET=your_token_secret_here
BULKSMS_SENDER_ID=HireMeFor

# Session Configuration
SESSION_SECRET=your_session_secret_here_change_in_production

# Admin Credentials (for initial setup)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
EOF
    echo "NOTE: Please update backend/.env with your actual credentials"
fi

if [ -f "package.json" ] && [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
fi

# Frontend setup
echo ""
echo "Setting up Frontend..."
echo "----------------------"

cd "$PROJECT_ROOT"

if [ ! -d "$PROJECT_ROOT/frontend" ]; then
    echo "Creating frontend directory structure..."
    mkdir -p "$PROJECT_ROOT/frontend"
fi

cd "$PROJECT_ROOT/frontend"

if [ ! -f "package.json" ]; then
    echo "Initializing frontend package.json..."
    cat > package.json << 'EOF'
{
  "name": "hire-me-for-frontend",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.1",
    "react-scripts": "5.0.1",
    "axios": "^1.6.5"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
EOF
fi

if [ -f "package.json" ] && [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# Summary
echo ""
echo "=========================================="
echo "  Setup Complete!"
echo "=========================================="
echo ""
echo "Project Structure:"
echo "  /backend   - Node.js Express API (port 3001)"
echo "  /frontend  - React application (port 3000)"
echo ""
echo "To start the development servers:"
echo ""
echo "  1. Start the backend:"
echo "     cd backend && npm run dev"
echo ""
echo "  2. In another terminal, start the frontend:"
echo "     cd frontend && npm start"
echo ""
echo "  3. Or run both (requires concurrently):"
echo "     npm run dev"
echo ""
echo "Database Setup:"
echo "  1. Create MySQL database: CREATE DATABASE hire_me_for;"
echo "  2. Update backend/.env with your MySQL credentials"
echo "  3. Run migrations: cd backend && npm run db:migrate"
echo "  4. Run seeds: cd backend && npm run db:seed"
echo ""
echo "Access the application:"
echo "  - Public site: http://localhost:3000"
echo "  - Worker portal: http://localhost:3000/worker"
echo "  - Admin panel: http://localhost:3000/admin"
echo "  - API: http://localhost:3001/api"
echo ""
