# Hire Me For

A marketplace platform connecting skilled workers (plumbers, taxi drivers, etc.) with members of the public who need their services.

## Overview

Hire Me For allows skilled workers to:
- Register using phone verification via SMS (BulkSMS.com)
- Create detailed profiles showcasing their skills and experience
- Manage their reputation through a rating moderation system

The public can:
- Search for workers by skill and area without registration
- View worker profiles with ratings and contact information
- Submit ratings for workers they've hired

## Technology Stack

- **Frontend**: React 18 with React Router
- **Backend**: Node.js with Express
- **Database**: MySQL 8.0+
- **SMS Integration**: BulkSMS.com API

## Project Structure

```
hire-me-for/
├── backend/
│   ├── src/
│   │   ├── routes/       # API route handlers
│   │   ├── middleware/   # Auth middleware
│   │   ├── services/     # BulkSMS integration
│   │   └── db/           # Database connection & migrations
│   ├── uploads/          # Profile photo storage
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/        # React page components
│   │   ├── services/     # API client
│   │   └── components/   # Shared components
│   ├── public/
│   └── package.json
├── init.sh               # Development setup script
└── README.md
```

## Prerequisites

- Node.js 18+
- MySQL 8.0+
- BulkSMS.com API credentials

## Quick Start

### 1. Clone and Setup

```bash
# Run the setup script
chmod +x init.sh
./init.sh
```

### 2. Configure Environment

Copy the example environment file and update with your credentials:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=hire_me_for

BULKSMS_TOKEN_ID=your_token_id
BULKSMS_TOKEN_SECRET=your_token_secret
```

### 3. Setup Database

```bash
# Create database and tables
cd backend
npm run db:migrate

# Seed initial data (skills, areas, admin user)
npm run db:seed
```

### 4. Start Development Servers

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm start
```

### 5. Access the Application

- **Public Site**: http://localhost:3000
- **Worker Portal**: http://localhost:3000/worker
- **Admin Panel**: http://localhost:3000/admin
- **API**: http://localhost:3001/api

## Default Admin Credentials

After running `npm run db:seed`:
- Username: `admin`
- Password: `admin123`

**Change these in production!**

## API Endpoints

### Authentication
- `POST /api/auth/request-otp` - Request OTP for registration
- `POST /api/auth/verify-otp` - Verify OTP code
- `POST /api/auth/create-pin` - Create 4-digit PIN
- `POST /api/auth/login` - Login with phone + PIN
- `POST /api/auth/logout` - End session
- `POST /api/auth/reset-pin-request` - Request PIN reset
- `POST /api/auth/reset-pin` - Complete PIN reset

### Worker Profile
- `GET /api/worker/profile` - Get own profile
- `PUT /api/worker/profile` - Update profile
- `POST /api/worker/profile/photo` - Upload photo
- `DELETE /api/worker/profile` - Delete account
- `GET /api/worker/skills` - Get own skills
- `POST /api/worker/skills` - Add skills
- `GET /api/worker/ratings` - Get all ratings
- `PUT /api/worker/ratings/:id/accept` - Accept rating
- `DELETE /api/worker/ratings/:id` - Reject rating

### Public Search
- `GET /api/search/workers` - Search with filters
- `GET /api/search/:id` - Get public profile
- `POST /api/search/:id/rate` - Submit rating

### Admin
- `POST /api/admin/login` - Admin login
- `GET /api/admin/dashboard` - Statistics
- `GET /api/admin/workers` - List workers
- `DELETE /api/admin/workers/:id` - Remove worker
- `GET/POST/PUT/DELETE /api/admin/skills` - Manage skills
- `GET/POST/PUT/DELETE /api/admin/areas` - Manage areas

## Features

- [x] Phone-based worker registration with OTP
- [x] Profile management with photo upload
- [x] Multi-skill selection with experience years
- [x] Public search by skill and area
- [x] Star rating system with moderation
- [x] Admin panel for skills/areas/workers management
- [x] Responsive design for mobile and desktop

## Development Progress

This project is being built incrementally. Check `claude-progress.txt` for the latest status.

## License

Proprietary - All rights reserved
