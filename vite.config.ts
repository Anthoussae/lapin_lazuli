import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { cloudflare } from "@cloudflare/vite-plugin";

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), cloudflare()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
  },
})