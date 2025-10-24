# Quick Start Guide

Get your JDS Products Lookup Platform up and running in 5 minutes!

## Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js installed (v18+): `node --version`
- ✅ PostgreSQL installed and running
- ✅ Your JDS API token

## Step 1: Backend Setup (2 minutes)

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create your .env file
cp .env.example .env

# Edit .env and add your credentials:
# - DATABASE_URL (PostgreSQL connection)
# - JWT_SECRET (run: openssl rand -base64 32)
# - JDS_API_TOKEN (your JDS API token)

# Setup database
npx prisma generate
npx prisma migrate dev --name init

# Start backend
npm run dev
```

✅ Backend running at `http://localhost:3000`

## Step 2: Frontend Setup (1 minute)

Open a new terminal:

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start frontend
npm run dev
```

✅ Frontend running at `http://localhost:5173`

## Step 3: Use the App (30 seconds)

1. Open `http://localhost:5173` in your browser
2. Click "Register here" and create an account
3. Login with your credentials
4. Enter SKU codes (e.g., `LPB004, LWB101`)
5. Click "Search Products" to see results!

## Quick Test SKUs

Try these SKUs from the JDS API:
- `LPB004` - Polar Camel 18 oz. Small Teal Pet Bowl
- `LWB101` - Polar Camel 20 oz. Stainless Steel Water Bottle

## Need Help?

- **Backend won't start?** Check your DATABASE_URL in `backend/.env`
- **Frontend can't connect?** Make sure backend is running on port 3000
- **Database errors?** Run `npx prisma migrate reset` in the backend folder

For detailed instructions, see [README.md](./README.md)
