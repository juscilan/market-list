# 🛒 Market List

A modern, dark-themed **Progressive Web App** (PWA) for managing your supermarket shopping list. Built with **Svelte 5** and **Vite**, it stores all data locally in your browser via `localStorage` — no account or server required, and it works fully offline once installed.

![Purple dark mode](https://img.shields.io/badge/mode-dark%20---purple-8b5cf6) ![Svelte](https://img.shields.io/badge/Svelte-5-ff3e00) ![Vite](https://img.shields.io/badge/Vite-5-646cff) ![PWA](https://img.shields.io/badge/PWA-ready-5f6368) ![Tests](https://img.shields.io/badge/tests-33%20passing-22c55e)

---

## ✨ Features

- **Add items** with name, quantity, and unit (`un`, `kg`, `g`, `L`, `mL`, `pct`, `cx`, `pt`)
- **Add quickly** — press `Enter` in the name field or tap the `+` button
- **Toggle checked** — tap the checkmark to mark an item as bought
- **Inline edit** — rename items, change quantity/unit (`Enter` to save, `Esc` to cancel)
- **Remove items** individually, or bulk-clear checked items / the whole list
- **Filters** — view all, pending, or already-bought items
- **Live stats** — pending and bought counts in the header
- **Automatic persistence** — everything is saved to `localStorage` on every change
- **Offline-ready PWA** — installable on mobile & desktop, works without a connection

## 🌑 Design

- Pure **dark mode** interface with a purple/violet accent palette
- **Mobile-first**, responsive layout (optimized for phone-sized screens)
- Touch-friendly tap targets and feedback, adaptive to `safe-area-inset` for notched devices
- Gradients, rounded pill-shaped UI, and a glassy sticky header

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 20
- npm (bundled with Node)

### Install

```bash
npm install
```

### Run in development

```bash
npm run dev
```

Open the displayed URL (usually `http://localhost:5173`). Use the network URL to test on your phone while on the same Wi-Fi.

### Build for production

```bash
npm run build
```

Output goes to the `dist/` folder (includes the PWA service worker and manifest).

### Preview the production build

```bash
npm run preview
```

## 📱 Install as an App (PWA)

The service worker is generated at build time via `vite-plugin-pwa`.

- **Android / Chrome** — open the site, then use the browser menu → “Add to Home screen”
- **iOS / Safari** — tap the **Share** button → “Add to Home Screen”
- **Desktop** — use the install icon in the address bar

Once installed, it launches fullscreen like a native app and can be used offline.

## 🧪 Running Tests

The project uses **Vitest** with **@testing-library/svelte** and **jsdom**.

```bash
# Run once
npm run test:run

# Watch mode
npm test
```

There are **33 unit tests** covering rendering, adding/editing/removing items, toggling, filtering, bulk actions, stats, and localStorage persistence.

> **Note:** Test dependencies are pinned to versions compatible with Node 20 (`vitest@2`, `jsdom@21`, `@testing-library/jest-dom@6`). The latest releases require Node 22+.

## 🗂️ Project Structure

```
market-list/
├── public/               # Static assets (favicon, PWA icons, robots.txt)
├── src/
│   ├── App.svelte        # Main application component (all logic + UI)
│   ├── App.test.js       # Unit tests
│   ├── app.css           # Global styles / theme
│   ├── main.js           # Svelte entry point
│   └── test-setup.js     # Jest-dom matchers for vitest
├── index.html            # HTML entry (PWA meta tags)
├── vite.config.js        # Vite + PWA plugin config
├── vitest.config.js      # Test config
└── package.json
```

## 🔧 Scripts

| Script            | Description                            |
| ----------------- | -------------------------------------- |
| `npm run dev`     | Start the dev server with HMR          |
| `npm run build`   | Build a production bundle + PWA        |
| `npm run preview` | Preview the production build locally   |
| `npm test`        | Run tests in watch mode                |
| `npm run test:run`| Run tests once                         |

## 🛠️ Tech Stack

- **[Svelte 5](https://svelte.dev/)** — reactive UI framework (uses the new runes API: `$state`, `$derived`, `$effect`)
- **[Vite 5](https://vite.dev/)** — build tool & dev server
- **[vite-plugin-pwa](https://vite-pwa-org.netlify.app/)** — service worker + web app manifest
- **[Vitest](https://vitest.dev/)** + **[@testing-library/svelte](https://testing-library.com/docs/svelte-testing-library/intro/)** — unit testing

## 📄 License

Copyright © 2026 [Juscilan Moreto](https://www.juscilan.com). All rights reserved.