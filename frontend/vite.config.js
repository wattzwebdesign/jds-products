import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    // Use HTTPS in development to match production environment
    // This prevents mixed content issues during development
    https: false, // Set to true with cert/key if needed for local dev
    headers: {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    }
  },
  build: {
    // Ensure relative paths work correctly
    assetsDir: 'assets',
    // Add security headers via meta tags in index.html
    rollupOptions: {
      output: {
        // Ensure deterministic builds
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  }
})
