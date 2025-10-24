# JDS Products Lookup Platform

A full-stack web application that allows authenticated users to search and view product information from the JDS API by entering SKU codes.

## Tech Stack

### Backend
- **Node.js** with Express.js
- **PostgreSQL** database with Prisma ORM
- **JWT** authentication
- **bcrypt** for password hashing
- **Axios** for JDS API integration

### Frontend
- **Vue.js 3** (Composition API)
- **Vue Router** for navigation
- **Pinia** for state management
- **Vite** as build tool
- **Axios** for API calls

## Features

- 🔐 User registration and authentication
- 🔍 Product lookup by SKU codes
- 📦 Support for multiple SKU inputs (comma, space, or newline separated)
- 💰 Display pricing tiers (less than case, 1 case, 5+ cases, 10+ cases)
- 📊 Show product availability and local quantity
- 🖼️ Product images and detailed descriptions
- 📱 Responsive design

## Project Structure

```
jds-products/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Database schema
│   ├── routes/
│   │   ├── auth.js                # Authentication routes
│   │   └── products.js            # Product lookup routes
│   ├── middleware/
│   │   └── auth.js                # JWT authentication middleware
│   ├── services/
│   │   └── jdsApiClient.js        # JDS API integration
│   ├── server.js                  # Express server
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── views/
│   │   │   ├── Login.vue          # Login page
│   │   │   ├── Register.vue       # Registration page
│   │   │   └── ProductLookup.vue  # Product search page
│   │   ├── components/
│   │   │   └── ProductCard.vue    # Product display component
│   │   ├── stores/
│   │   │   └── auth.js            # Pinia authentication store
│   │   ├── services/
│   │   │   └── api.js             # API client
│   │   ├── router/
│   │   │   └── index.js           # Vue Router configuration
│   │   ├── App.vue
│   │   └── main.js
│   ├── package.json
│   └── .env.example
│
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- JDS API token

### 1. Clone the Repository

```bash
git clone https://github.com/wattzwebdesign/jds-products.git
cd jds-products
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Edit .env file with your configuration:
# - DATABASE_URL: Your PostgreSQL connection string
# - JWT_SECRET: A random secret key (generate with: openssl rand -base64 32)
# - JDS_API_TOKEN: Your JDS API token
```

Example `.env` configuration:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/jds_products?schema=public"
JWT_SECRET="your-randomly-generated-secret-key"
JDS_API_TOKEN="your-jds-api-token"
JDS_API_BASE_URL="https://api.jdsapp.com"
PORT=3000
NODE_ENV=development
```

```bash
# Generate Prisma client and run migrations
npx prisma generate
npx prisma migrate dev --name init

# Start the backend server
npm run dev
```

The backend will be running at `http://localhost:3000`

### 3. Frontend Setup

Open a new terminal window:

```bash
cd frontend

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Edit .env file if your backend is not running on localhost:3000
```

Example `.env` configuration:

```env
VITE_API_BASE_URL=http://localhost:3000
```

```bash
# Start the development server
npm run dev
```

The frontend will be running at `http://localhost:5173`

## Usage

### 1. Create an Account

- Navigate to `http://localhost:5173`
- You'll be redirected to the login page
- Click "Register here" to create a new account
- Enter your email and password (minimum 6 characters)

### 2. Login

- Enter your email and password
- Click "Sign In"

### 3. Search for Products

- Enter one or more SKU codes in the search box
- SKUs can be separated by:
  - Commas: `LPB004, LWB101`
  - Spaces: `LPB004 LWB101`
  - New lines:
    ```
    LPB004
    LWB101
    ```
- Click "Search Products"
- View product details including pricing, availability, and images

### 4. Logout

- Click the "Logout" button in the header to sign out

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
  - Body: `{ "email": "user@example.com", "password": "password" }`

- `POST /api/auth/login` - Login
  - Body: `{ "email": "user@example.com", "password": "password" }`

### Products (Requires Authentication)

- `POST /api/products/lookup` - Lookup products by SKU
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ "skuInput": "LPB004, LWB101" }` or `{ "skus": ["LPB004", "LWB101"] }`

## Database Schema

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## Environment Variables

### Backend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/jds_products` |
| JWT_SECRET | Secret key for JWT signing | `your-secret-key` |
| JDS_API_TOKEN | Your JDS API token | `your-token` |
| JDS_API_BASE_URL | JDS API base URL | `https://api.jdsapp.com` |
| PORT | Server port | `3000` |
| NODE_ENV | Environment | `development` |

### Frontend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| VITE_API_BASE_URL | Backend API URL | `http://localhost:3000` |

## Deployment Recommendations

### Option 1: Railway (Easiest)
- All-in-one platform for frontend, backend, and PostgreSQL
- Simple GitHub integration
- $5/month after free trial

### Option 2: Render
- Free tier for web services and PostgreSQL
- Separate services for frontend/backend/database
- Auto-deploy from GitHub

### Option 3: Vercel + Railway
- Vercel for frontend (excellent free tier)
- Railway for backend and PostgreSQL

### Option 4: DigitalOcean App Platform
- $5-12/month for basic setup
- Managed PostgreSQL database
- Good for small business apps

## Security Features

- Passwords hashed with bcrypt (10 rounds)
- JWT token-based authentication (7-day expiration)
- Protected API routes with authentication middleware
- JDS API token stored securely on backend (never exposed to frontend)
- CORS enabled for frontend/backend communication
- Input validation and sanitization

## Development

### Backend Development

```bash
cd backend
npm run dev  # Runs with nodemon for hot reload
```

### Frontend Development

```bash
cd frontend
npm run dev  # Runs with Vite hot reload
```

### Database Management

```bash
cd backend

# View database in Prisma Studio
npx prisma studio

# Create a new migration
npx prisma migrate dev --name migration_name

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset
```

## Troubleshooting

### Backend won't start
- Ensure PostgreSQL is running
- Check DATABASE_URL in `.env` is correct
- Run `npx prisma generate` to regenerate Prisma client

### Frontend can't connect to backend
- Check VITE_API_BASE_URL in frontend `.env`
- Ensure backend is running on the correct port
- Check browser console for CORS errors

### JDS API errors
- Verify JDS_API_TOKEN is correct in backend `.env`
- Check JDS API documentation for any changes
- Test the token directly with curl or Postman

## License

ISC

## Support

For issues and questions, please open an issue on the GitHub repository.
