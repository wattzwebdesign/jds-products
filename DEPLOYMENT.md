# xCloud Deployment Guide

## Prerequisites

Before deploying, make sure you have:
- Node.js installed on your xCloud server
- MySQL database created
- Git repository connected

## Environment Variables

Create a `backend/.env` file on your server with:

```env
DATABASE_URL="mysql://u167650_billowin:n3RUeNO5Ykw9DmLE@localhost:3306/s167650_billowin"
JWT_SECRET="gK8xN2pQ9rT5vW7yZ1aC4bF6hJ8mL0nP3sU5wX7zA9"
JDS_API_TOKEN="gCikdACqonotqlCctchCnhgpDEgCflg"
JDS_API_BASE_URL="https://api.jdsapp.com"
PORT=3000
NODE_ENV=production
```

Create a `frontend/.env` file on your server with:

```env
VITE_API_BASE_URL=https://billowing-sands-167650.1wp.site
```

## Deployment Steps

### Option 1: Automatic via xCloud Git Deploy

1. In xCloud, go to **Git Settings**
2. Paste the deploy script from `.xcloud-deploy.sh`
3. Enable "Run this script after every site deployment"
4. Enable "Pull and deploy now"
5. Click **Save Changes**

### Option 2: Manual Deployment

SSH into your server and run:

```bash
# Navigate to your site directory
cd /path/to/your/site

# Pull latest changes
git pull origin main

# Run the deployment script
bash .xcloud-deploy.sh
```

## File Structure After Deployment

```
your-site/
├── backend/              # Node.js backend
│   ├── routes/
│   ├── services/
│   ├── prisma/
│   ├── server.js
│   └── .env
├── frontend/             # Vue.js source
│   └── dist/            # Built files
├── index.html           # Frontend (copied from dist)
├── assets/              # Frontend assets (copied from dist)
├── .htaccess            # Apache configuration
└── ecosystem.config.js  # PM2 configuration
```

## Web Server Configuration

The `.htaccess` file handles:
- Proxying `/api/*` requests to `localhost:3000` (backend)
- Vue.js routing (all other requests go to `index.html`)
- CORS headers
- Security headers

## Process Management

The backend runs via PM2:

```bash
# View backend status
pm2 status

# View logs
pm2 logs jds-products-backend

# Restart backend
pm2 restart jds-products-backend

# Stop backend
pm2 stop jds-products-backend
```

## Troubleshooting

### Backend not starting
- Check PM2 logs: `pm2 logs jds-products-backend`
- Verify `.env` file exists in `backend/` directory
- Check database connection

### Frontend not loading
- Verify `index.html` exists in root directory
- Check `.htaccess` is present
- Clear browser cache

### Database connection failed
- Verify `DATABASE_URL` in `backend/.env`
- Check MySQL is running: `systemctl status mysql`
- Test connection: `mysql -u u167650_billowin -p s167650_billowin`

### API requests failing
- Check backend is running: `pm2 status`
- Verify `VITE_API_BASE_URL` in frontend build
- Check `.htaccess` proxy rules
- Test API directly: `curl http://localhost:3000/health`

## Database Migrations

If you update the Prisma schema:

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
pm2 restart jds-products-backend
```

## Useful Commands

```bash
# Check backend status
pm2 status

# View real-time logs
pm2 logs jds-products-backend --lines 100

# Monitor backend
pm2 monit

# Rebuild frontend
cd frontend
npm run build
cd ..
cp -r frontend/dist/* ./

# Restart everything
pm2 restart all
```

## Automatic Product Sync Feature

### What Was Added

An automatic product synchronization system that downloads and imports products from the JDS master data URL.

**Features:**
- **Automatic Weekly Sync**: Runs every Sunday at midnight (server time)
- **Manual Sync**: "Sync from JDS Now" button in Admin panel
- **Background Processing**: Sync runs asynchronously to prevent timeouts
- **Real-time Status**: Shows sync progress and results
- **65k+ Products**: Handles large CSV imports efficiently

### After Deploying Auto-Sync

1. **Verify Scheduler Started**:
   ```bash
   pm2 logs jds-products-backend --lines 100 | grep Scheduler
   ```
   Look for: `[Scheduler] Scheduled: Product import every Sunday at midnight`

2. **Test Manual Sync**:
   - Login to admin panel: `https://your-site.1wp.site/#/admin`
   - Click "Sync from JDS Now" button
   - Should see "Import started in background" immediately
   - Status updates every 2 seconds showing progress

3. **Monitor First Sync**:
   ```bash
   pm2 logs jds-products-backend --lines 100
   ```
   Look for messages like:
   - `[Auto-Import] Starting at...`
   - `[Auto-Import] Downloading CSV from JDS...`
   - `[Auto-Import] Parsed X products from CSV`
   - `[Import] Progress: X/Y products processed`
   - `[Auto-Import] Completed: Successfully processed...`

### Configuration

**Change Sync Schedule**:

Edit `backend/services/scheduler.js`:
```javascript
// Current: Every Sunday at midnight
const schedule = '0 0 * * 0';

// Examples:
// Every day at 2am: '0 2 * * *'
// Every Monday at 3am: '0 3 * * 1'
```

Then restart: `pm2 restart jds-products-backend`

**Change Timezone**:

Edit the timezone in `backend/services/scheduler.js`:
```javascript
timezone: 'America/New_York' // Change this
```

### Troubleshooting Auto-Sync

**Sync fails or times out:**
```bash
# Check for errors
pm2 logs jds-products-backend --err --lines 100

# Restart backend
pm2 restart jds-products-backend
```

**Scheduler not running:**
```bash
# Verify node-cron is installed
cd backend
npm list node-cron csv-parser axios

# If missing, install
npm install
pm2 restart jds-products-backend
```

**Check last sync:**
- Visit Admin Panel
- Look at "Last Sync" field
- Check sync status badges

### How Auto-Sync Works

1. **Scheduler** runs cron job every Sunday at midnight
2. **Auto-Import Service** downloads CSV from JDS URL
3. Parses 65k+ products from CSV
4. Batch imports/updates in database (1000 at a time)
5. Returns statistics (new products, updated, errors)
6. Admin panel shows real-time progress

**Note**: First sync takes 5-10 minutes for 65k products. Subsequent syncs are faster as they update existing records.

## Support

For issues, check:
1. PM2 logs: `pm2 logs`
2. Backend logs: `backend/logs/`
3. Apache error log: `/var/log/apache2/error.log` (or xCloud's log location)
