#!/bin/bash

# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migration to create tables
npx prisma migrate deploy

# Start the backend server
npm start
# OR for development with auto-restart:
# npm run dev

# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Build for production
npm run build
