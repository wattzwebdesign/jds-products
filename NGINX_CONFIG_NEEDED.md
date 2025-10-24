# Nginx Configuration Needed for xCloud

Since this server runs nginx (not Apache), we need nginx configuration changes that xCloud support will need to implement.

## Required Configuration

Add this to the nginx server block configuration:

```nginx
# Vue.js SPA routing - serve index.html for all non-file routes
location / {
    try_files $uri $uri/ /index.html;
}

# API proxy to Node.js backend on port 3000
location /api/ {
    proxy_pass http://localhost:3000/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

## Why This Is Needed

1. **Vue Router**: The app uses Vue Router for client-side routing (`/login`, `/register`, `/products`)
2. **404 on Refresh**: Without the `try_files` directive, refreshing on `/login` returns 404
3. **API Routing**: Currently using PHP proxy workaround, but native nginx proxy would be better

## Current Workaround

We're using:
- `api.php` as a PHP-based proxy for API calls
- But we don't have a workaround for Vue Router 404s on refresh

## Contact xCloud Support

Please contact xCloud support and request they add the nginx configuration above to your server block.
