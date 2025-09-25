import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { betterAuthPlugin } from './vite-auth-plugin.js'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), betterAuthPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})