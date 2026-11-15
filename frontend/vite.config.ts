import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Forward /api calls to the Express backend, so the browser stays on one
    // origin (no CORS setup and no API URL to configure).
    proxy: { '/api': 'http://localhost:3000' },
  },
})
