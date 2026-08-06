/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: ['localhost', '192.168.0.0/16', 'claimed-coverage-perry-college.trycloudflare.com'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
})
