import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { VitePWA } from 'vite-plugin-pwa'
import pkg from './package.json'

const securityHeaders = (dev) => ({
  'Content-Security-Policy': [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    `connect-src 'self'${dev ? ' ws:' : ''}`,
    "manifest-src 'self'",
    "worker-src 'self'",
    "font-src 'self'",
  ].join('; '),
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy':
    'camera=(), display-capture=(), fullscreen=(), geolocation=(), microphone=(), payment=(), usb=()',
})

function securityHeadersPlugin() {
  const apply = (server) => {
    server.middlewares.use((_req, res, next) => {
      for (const [name, value] of Object.entries(securityHeaders(process.env.NODE_ENV === 'development'))) {
        res.setHeader(name, value)
      }
      next()
    })
  }
  return {
    name: 'security-headers',
    configureServer: apply,
    configurePreviewServer: apply,
  }
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    securityHeadersPlugin(),
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'robots.txt',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'pwa-512x512-maskable.png',
        'apple-touch-icon.png'
      ],
      manifest: {
        name: 'Market List',
        short_name: 'MarketList',
        description: 'A modern supermarket shopping list',
        theme_color: '#0c0a14',
        background_color: '#0c0a14',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    })
  ]
})
