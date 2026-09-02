import { defineConfig } from 'vitest/config'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    setupFiles: ['src/test-setup.js'],
    css: false,
  },
  resolve: {
    conditions: ['browser'],
  },
  plugins: [svelte()],
})