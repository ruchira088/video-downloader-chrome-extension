# video-downloader-chrome-extension

A Chrome extension to schedule video downloads from web pages via a self-hosted [video-downloader](https://github.com/ruchira088) backend.

## Features

- **Context-menu downloads** — right-click any page or link to schedule a download (`Download Page Video` / `Download Video in Link`).
- **Popup action page** — a React-based UI for managing downloads, accessible from the toolbar.
- **Production + fallback servers** — automatically falls back to a secondary server if the primary is offline.
- **Cookie-based auth** — reuses your existing authentication cookies; no separate sign-in flow inside the extension.
- **Manifest V3** — uses a service worker for background tasks.

## How it works

The extension is composed of three parts:

| Component | Entry | Role |
| --- | --- | --- |
| Service worker | `src/worker/ServiceWorker.ts` | Registers context menus, syncs API configurations from auth cookies into `chrome.storage.local`, and dispatches download messages to the active tab. |
| Content script | `src/content/Content.ts` | Runs on `https://*/*`, talks to the backend (`/schedule`, `/videos/metadata`, `/schedule/search`), and renders toast notifications. |
| Action page | `src/action-page/ActionPage.tsx` | React popup opened from the toolbar icon. |

The backend it talks to is configured in `src/models/Server.ts` (default: `https://api.video.home.ruchij.com`).

## Installation (unpacked)

1. `npm install`
2. `npm run build` — outputs to `build/`
3. Open `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, and select the `build/` directory.

## Development

```bash
npm install            # install dependencies
npm run build          # production build → ./build
npm run prettier       # format with Prettier
```

To deploy to a custom output directory, set `BUILD_TARGET`:

```bash
BUILD_TARGET=/path/to/output npm run build
```

## Tech stack

- **TypeScript 6** (target: ES2020)
- **React 19** for the popup UI
- **Zod** for runtime schema validation of API responses and storage data
- **Webpack 5** for bundling
- **Chrome Extension Manifest V3**

## License

MIT — see `package.json`.
