# Spec Driven Development — Market List

> Single-source-of-truth for the **Market List** PWA.
> Every feature, edge case, and acceptance criterion lives here.
> Code must satisfy these specs; tests must prove it.

---

## 1. Project Overview

| Field              | Value                                                        |
| ------------------ | ------------------------------------------------------------ |
| **Name**           | Market List                                                  |
| **Version**        | 1.0.2                                                        |
| **Type**           | Progressive Web App (PWA) — offline-first                   |
| **Purpose**        | Manage a supermarket shopping list entirely client-side      |
| **Data layer**     | `localStorage` (key: `marketListData`)                       |
| **Server required**| No                                                           |
| **Framework**      | Svelte 5 (runes API: `$state`, `$derived`, `$effect`)       |
| **Bundler**        | Vite 5                                                       |
| **PWA plugin**     | `vite-plugin-pwa` (autoUpdate)                               |
| **Test framework** | Vitest 2 + @testing-library/svelte + jsdom 21                |
| **Min Node**       | ≥ 20                                                         |
| **Author**         | Juscilan Moreto                                              |
| **License**        | All rights reserved                                          |

---

## 2. Tech Stack & Dependencies

### Runtime
- Svelte 5.1+ (`svelte`)
- `workbox-window` 7.4+ (PWA service worker runtime)

### Dev / Build
- Vite 5.4+ (`vite`)
- `@sveltejs/vite-plugin-svelte` 4.0+
- `vite-plugin-pwa` 1.3+

### Testing
- Vitest 2.1+
- `@testing-library/svelte` 5.4+
- `@testing-library/jest-dom` 6.9+
- `jsdom` 21.1+

> **Note:** Test deps are pinned to Node 20-compatible versions.

---

## 3. Project Structure

```
market-list/
├── index.html                 # HTML entry — PWA meta tags, mounts #app
├── package.json
├── vite.config.js             # Vite + Svelte + VitePWA plugin + security headers plugin
├── vitest.config.js           # Vitest config (jsdom environment)
├── svelte.config.js
├── public/
│   ├── _headers               # Security headers for static hosting (e.g. Netlify)
│   ├── favicon.svg
│   ├── apple-touch-icon.png
│   ├── pwa-192x192.png
│   ├── pwa-512x512.png
│   ├── pwa-512x512-maskable.png
│   └── robots.txt
├── src/
│   ├── main.js                # Svelte entry — mounts App into #app
│   ├── App.svelte             # Single-file component (all logic + UI)
│   ├── App.test.js            # Unit tests (33 specs)
│   ├── app.css                # Global styles / dark theme
│   ├── test-setup.js          # jest-dom matchers for vitest
│   └── vite-env.d.ts          # Vite client types
└── dist/                      # Production build output
```

**Key architectural decision:** All application logic, state, and UI live inside a single component (`App.svelte`). There are no child components, stores, or utility modules.

---

## 4. Data Model

### Item

```ts
interface Item {
  id: number;         // Date.now() + collision guard
  name: string;       // trimmed, non-empty
  qty: number;        // ≥ 1, defaults to 1
  unit: Unit;         // one of the allowed values
  checked: boolean;   // false by default
  createdAt: string;  // ISO 8601 timestamp
}
```

### Unit

```ts
type Unit = 'un' | 'kg' | 'g' | 'L' | 'mL' | 'pct' | 'cx' | 'pt';
```

### Storage Shape

```ts
// localStorage key: "marketListData"
{
  items: Item[]
}
```

### Legacy Handling
On load, any `category` field present on items is stripped (migration from an earlier schema). Tests confirm this.

---

## 5. Feature Specifications

### 5.1 Add Item

| #   | Behavior                                                   | Acceptance                              |
| --- | ---------------------------------------------------------- | --------------------------------------- |
| 1.1 | Name field accepts text, Qty defaults to 1, Unit defaults to `un` | Button shows `+`                       |
| 1.2 | Empty / whitespace-only names are rejected                 | Button is `disabled`, no item created   |
| 1.3 | Whitespace is trimmed from the name                        | Stored name has no leading/trailing ws  |
| 1.4 | After adding, name field resets to empty, qty to 1, unit to `un` | Input is empty post-add                |
| 1.5 | Pressing `Enter` in the name field triggers add            | Same as clicking `+`                    |
| 1.6 | `Enter` in qty/unit fields also triggers add               | Consistent behavior                     |
| 1.7 | ID uniqueness guaranteed via `Date.now()` + increment loop | No duplicate IDs                        |
| 1.8 | New item is appended to end of list                        | Appears at bottom                       |
| 1.9 | Persistence: every add writes to `localStorage` immediately| Data survives refresh                   |

### 5.2 Toggle Check (Mark as Bought)

| #   | Behavior                                                   | Acceptance                              |
| --- | ---------------------------------------------------------- | --------------------------------------- |
| 2.1 | Clicking the checkbox icon toggles `checked`               | ☐ → ☑, ☑ → ☐                           |
| 2.2 | Checked items receive `line-through` CSS class             | Visual strikethrough                    |
| 2.3 | Checked items get `opacity: 0.45`                          | Dimmed appearance                       |
| 2.4 | Stats update immediately on toggle                         | Counts reflect change                   |
| 2.5 | State persisted to `localStorage` on every toggle          | Survives refresh                        |

### 5.3 Inline Edit

| #   | Behavior                                                   | Acceptance                              |
| --- | ---------------------------------------------------------- | --------------------------------------- |
| 3.1 | Clicking edit button (✎) enters edit mode                 | Shows edit-form: name, qty, unit, ✓, ✕  |
| 3.2 | `Enter` in edit name field saves changes                   | Name updated, edit mode exits           |
| 3.3 | Clicking ✓ saves changes                                   | Same as Enter                           |
| 3.4 | `Escape` cancels edit without saving                       | Original values preserved               |
| 3.5 | Clicking ✕ cancels edit                                    | Same as Escape                          |
| 3.6 | Empty name on save is rejected                             | Edit remains open, no change            |
| 3.7 | Qty and Unit can be changed independently                  | Both fields editable in edit mode       |
| 3.8 | Changes persisted to `localStorage`                        | Survives refresh                        |

### 5.4 Remove Item

| #   | Behavior                                                   | Acceptance                              |
| --- | ---------------------------------------------------------- | --------------------------------------- |
| 4.1 | Clicking remove button (✕) deletes the item               | Item removed from list                  |
| 4.2 | Only the targeted item is removed                          | Other items unaffected                  |
| 4.3 | If list becomes empty, empty state is shown                | "Lista vazia!" message appears          |
| 4.4 | Stats update on remove                                     | Counts accurate                         |

### 5.5 Filters

| #   | Behavior                                                   | Acceptance                              |
| --- | ---------------------------------------------------------- | --------------------------------------- |
| 5.1 | Three filter buttons: Todos, Pendentes, Comprados          | Always visible                          |
| 5.2 | Default filter is "Todos" (all items shown)                | No items hidden                         |
| 5.3 | "Pendentes" shows only unchecked items                     | Checked items hidden                    |
| 5.4 | "Comprados" shows only checked items                       | Unchecked items hidden                  |
| 5.5 | Active filter button has `active` class                    | Visual highlight (purple bg)            |
| 5.6 | Empty filter result shows no empty-state message           | Just an empty section                   |

### 5.6 Bulk Actions

| #   | Behavior                                                   | Acceptance                              |
| --- | ---------------------------------------------------------- | --------------------------------------- |
| 6.1 | "Remover Comprados (N)" button appears when N > 0         | Button hidden when no checked items     |
| 6.2 | Clicking it removes only checked items                     | Unchecked items preserved               |
| 6.3 | "Limpar Tudo" button always visible when list non-empty    | Always shown with items present         |
| 6.4 | "Limpar Tudo" requires `confirm()` — clears on OK         | `window.confirm` dialog shown           |
| 6.5 | Cancelling confirm preserves the list                      | No items removed                        |
| 6.6 | Both buttons are disabled / hidden when list is empty      | No actions on empty list                |

### 5.7 Stats

| #   | Behavior                                                   | Acceptance                              |
| --- | ---------------------------------------------------------- | --------------------------------------- |
| 7.1 | Header shows pending count + bought count                  | Always visible                          |
| 7.2 | Singular/plural: "1 pendente" vs "2 pendentes"             | Grammar correct for PT-BR               |
| 7.3 | Counts update on every mutation                            | Real-time accuracy                      |
| 7.4 | Initial state (empty): "0 pendentes", "0 comprados"        | Zero state displayed                    |

### 5.8 Persistence (localStorage)

| #   | Behavior                                                   | Acceptance                              |
| --- | ---------------------------------------------------------- | --------------------------------------- |
| 8.1 | On mount, data is loaded from `localStorage`              | Pre-existing items restored             |
| 8.2 | On every mutation, full `items` array is serialized        | Auto-save on add/edit/toggle/remove     |
| 8.3 | Storage key is `marketListData`                            | Consistent across reads/writes          |
| 8.4 | Schema: `{ items: Item[] }`                                | Wrapping object always present          |
| 8.5 | Legacy `category` field stripped on load                   | Backward compatibility                  |
| 8.6 | No server calls — fully offline                            | Zero network dependency                 |

### 5.9 PWA

| #   | Behavior                                                   | Acceptance                              |
| --- | ---------------------------------------------------------- | --------------------------------------- |
| 9.1 | Service worker registered via `vite-plugin-pwa` (autoUpdate) | SW updates in background              |
| 9.2 | Web app manifest with name, icons, theme_color             | Installable on mobile & desktop         |
| 9.3 | `display: standalone`                                       | Fullscreen native-like experience       |
| 9.4 | Icons: 192x192, 512x512, 512x512 maskable                  | All platforms covered                   |
| 9.5 | `apple-touch-icon` for iOS                                  | iOS home screen icon                    |
| 9.6 | Offline functionality after first load                      | Works without connection                |
| 9.7 | `theme_color` and `background_color` = `#0c0a14`           | Matches dark UI                         |

### 5.10 Security Headers

Sent on every response by the `security-headers` Vite plugin (dev + preview) and via `public/_headers` for static hosting.

| #    | Response Header          | Value / Policy                                                         | Acceptance                                    |
| ---- | ------------------------ | ---------------------------------------------------------------------- | --------------------------------------------- |
| 10.1 | `Content-Security-Policy`| `default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; manifest-src 'self'; worker-src 'self'; font-src 'self'` | No XSS / injection from third-party sources    |
| 10.2 | CSP `frame-ancestors`    | `'none'`                                                               | Blocks clickjacking                            |
| 10.3 | `X-Frame-Options`        | `DENY`                                                                 | Blocks framing entirely                        |
| 10.4 | `X-Content-Type-Options` | `nosniff`                                                              | Prevents MIME-sniffing                         |
| 10.5 | `Referrer-Policy`        | `no-referrer`                                                          | No referrer leakage                           |
| 10.6 | `Permissions-Policy`     | `camera=(), display-capture=(), fullscreen=(), geolocation=(), microphone=(), payment=(), usb=()` | Disables all non-essential browser APIs        |
| 10.7 | Dev-only CSP exception   | `connect-src` appends `ws:` when `NODE_ENV=development`                | HMR WebSocket works, prod stays strict         |
| 10.8 | Static hosting fallback  | `_headers` file in `public/` gets copied to `dist/`                    | Headers apply on hosts that support `_headers` |
| 10.9 | Build integrity          | Headers must not break PWA (SW, manifest) or the data-URI SVG chevron  | `img-src` allows `data:`, `worker-src`/`manifest-src` allow `'self'` |

> **Note:** `style-src 'unsafe-inline'` is required for Svelte/Vite injecting styles at runtime (app has no external stylesheets). Deployments that don't read `_headers` (GitHub Pages, S3, CDNs) need the same headers configured on the hosting server.

### 5.11 Footer — Version & Copyright

The version is injected at build time via Vite `define` (`__APP_VERSION__` from `package.json`), so it can never drift from the released version.

| #    | Behavior                                                        | Acceptance                                          |
| ---- | --------------------------------------------------------------- | --------------------------------------------------- |
| 11.1 | Footer shown on every screen, at bottom of the app              | Sticky to layout end, always visible                |
| 11.2 | Version label `v{version}` rendered from `package.json`         | Uses `__APP_VERSION__`, defined in `vite.config.js` from `pkg.version` |
| 11.3 | Copyright `© {currentYear} Juscilan Moreto`                     | Year computed via `new Date().getFullYear()`        |
| 11.4 | Same version available in `vitest.config.js` for test assertions | Tests read `package.json` directly and assert the rendered label |
| 11.5 | Version must not be hard-coded in component code                | Source of truth is `package.json`                   |

---

## 6. UI / Design Specs

### Theme
- **Mode:** Dark only (no light mode toggle)
- **Palette:** Purple/violet accent (`--primary: #a855f7`, `--accent: #e879f9`)
- **Background:** Near-black (`--bg: #0c0a14`)
- **Cards:** `--bg-card: #161224`
- **Text:** Light lavender (`--text: #f3e8ff`)

### Layout
- **Mobile-first**, max-width `480px`, centered
- Sticky glass-effect header with `backdrop-filter: blur(20px)`
- `safe-area-inset` support for notched devices
- Flexbox-based, no grid
- `overscroll-behavior-y: contain` (prevents pull-to-refresh)

### Interactions
- Touch-friendly targets (min 36px tap area)
- `:active` scale transforms for press feedback
- Transition animations on borders, colors, transforms
- Hidden scrollbars (`scrollbar-width: none`)

### Responsive Breakpoint
- `@media (max-width: 420px)`: add form wraps inputs vertically, button enlarges

---

## 7. Test Coverage Matrix

| Feature Area      | # Tests | What's Covered                                |
| ----------------- | ------- | --------------------------------------------- |
| Rendering         | 5       | Header, empty state, stats, filters, form, footer (version + copyright) |
| Add Item          | 6       | Default values, trim, empty rejection, reset, Enter, persistence |
| Toggle Check      | 3       | Check, uncheck, line-through class            |
| Remove Item       | 2       | Single remove, targeted remove                |
| Edit Item         | 5       | Enter edit, save name, save qty, cancel (Esc), cancel button |
| Filter            | 4       | All, checked, pending, back to all            |
| Clear Actions     | 3       | Clear checked, clear all (confirmed), clear all (cancelled) |
| Stats             | 2       | Mixed state counts, singular wording          |
| localStorage      | 4       | Load on mount, strip category, persist check, persist edit |
| **Total**         | **34**  |                                               |

### Test Conventions
- Tests live in `src/App.test.js`
- `localStorage` is mocked per `beforeEach` via `Object.defineProperty`
- `window.confirm` is mocked via `vi.spyOn`
- Helper: `seedStorage()` pre-populates storage
- Helper: `addItems()` bulk-adds items via fireEvent
- `cleanup()` called in `afterEach`

---

## 8. Build & Dev Commands

| Command            | Description                                |
| ------------------ | ------------------------------------------ |
| `npm run dev`      | Vite dev server with HMR (port 5173), security headers on all responses |
| `npm run build`    | Production build to `dist/` + SW generation + `_headers` copy |
| `npm run preview`  | Serve production build locally, security headers on all responses |
| `npm test`         | Vitest in watch mode                       |
| `npm run test:run` | Single test run                            |

---

## 9. Acceptance Criteria for New Features

Before merging any new feature:

1. **Spec first** — Add the feature spec to section 5 with behavior table
2. **Implement** — Write code in `App.svelte` following existing conventions (single-file, runes API, no external deps)
3. **Test** — Add corresponding tests to `App.test.js` following existing patterns
4. **Verify** — Run `npm run test:run` — all tests must pass
5. **Build** — Run `npm run build` — no errors
6. **Persistence** — Confirm new data is saved to / loaded from `localStorage`
7. **Offline** — Feature works after service worker caches the build

---

## 10. Coding Conventions

- **Single-file architecture:** All logic in `App.svelte` (no splitting unless complexity demands it)
- **Svelte 5 runes:** Use `$state`, `$derived`, `$effect` — no `$:` reactive declarations
- **No external runtime dependencies** — zero imports beyond Svelte
- **Immutability:** State updates via spread/reassign (`items = [...items, newItem]`)
- **ID generation:** `Date.now()` + uniqueness loop
- **Language:** UI text in Portuguese (PT-BR), code/comments in English
- **CSS:** Global styles in `app.css`, no CSS-in-JS, no CSS framework, no preprocessor
- **Formatting:** 2-space indent, no trailing commas enforced, semicolons optional

---

## 11. Known Technical Debt

| Item                                                        | Status   |
| ----------------------------------------------------------- | -------- |
| `category` field migration (stripped on load)               | Handled  |
| No undo for remove/clear actions                            | Open     |
| No item reordering / drag-and-drop                          | Open     |
| No categories / grouping                                    | Open     |
| No search / filter by name                                  | Open     |
| No export / import of lists                                 | Open     |
| No multi-language support (PT-BR only)                      | Open     |
| Single component (App.svelte) — no decomposition yet        | Accepted |
| `Date.now()` IDs — collision possible under extreme rapid adds | Low risk |

---

## 12. Version History

| Version | Changes                                    |
| ------- | ------------------------------------------ |
| 1.0.3   | Add security headers (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) via Vite plugin + `public/_headers`; show version (from `package.json`) and copyright in a footer; 34 tests |
| 1.0.2   | Disable plus button when box is empty       |
| 1.0.1   | Fix missing PNG app icon                    |
| 1.0.0   | Initial release — full feature set, PWA, 33 tests |

---

*This file is the source of truth. When specs and code diverge, update the code to match the spec — or update the spec explicitly via version bump.*
