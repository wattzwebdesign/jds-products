#!/bin/bash

echo "🚀 Starting deployment..."

# Navigate to backend directory
echo "📦 Installing backend dependencies..."
cd backend
npm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run database migration to create tables
echo "🗄️  Running database migrations..."
npx prisma migrate deploy

# Navigate back to root
cd ..

# Navigate to frontend directory
echo "📦 Installing frontend dependencies..."
cd frontend
npm install

# Build for production
echo "🏗️  Building frontend for production..."
npm run build

# Copy frontend build to public directory
echo "📋 Copying frontend build to root..."
cd ..
cp -r frontend/dist/* ./

# Install PM2 globally if not installed (for process management)
if ! command -v pm2 &> /dev/null
then
    echo "📦 Installing PM2..."
    npm install -g pm2
fi

# Stop any existing PM2 processes
echo "🛑 Stopping existing processes..."
pm2 stop jds-products-backend 2>/dev/null || true
pm2 delete jds-products-backend 2>/dev/null || true

# Start backend with PM2
echo "🚀 Starting backend server with PM2..."
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

echo "✅ Deployment complete!"
echo "Backend running on port 3000"
echo "Frontend served from root directory"
