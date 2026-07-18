# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run build          # production build → ./build (set BUILD_TARGET=<dir> to override)
npm run dev            # development build in watch mode
npm run typecheck      # tsc --noEmit
npm run lint           # eslint src
npm run prettier       # format (writes); prettier:check to verify only
```

There are no tests. CI (`.github/workflows/ci.yml`) runs typecheck, lint, prettier:check, and build on pushes/PRs to
`master`.

To try changes in Chrome: `npm run build`, then load `build/` as an unpacked extension at `chrome://extensions`.

## Architecture

Chrome Manifest V3 extension that schedules video downloads on a self-hosted backend (default
`https://api.video.home.ruchij.com`, configured in `src/models/Server.ts`). Three webpack entry points
(`webpack.config.js`), each a separate bundle:

- **Service worker** (`src/worker/ServiceWorker.ts`): registers the two context menus ("Download Page Video" / "Download
  Video in Link") and syncs authentication into storage. Auth works by reading the backend's session cookie
  (`chrome.cookies`) and writing it as an `ApiConfiguration` into `chrome.storage.local` — triggered by a
  `chrome.alarms` alarm every 30s (never use `setInterval` here; MV3 suspends the worker). Context-menu clicks are
  forwarded to the active tab via `chrome.tabs.sendMessage`.
- **Content script** (`src/content/Content.ts`): runs on all HTTPS pages (required so context-menu downloads work
  anywhere), but its 5-second DOM polling loop only starts on hostnames claimed by a site handler. It injects a download
  button on supported video pages, handles `DownloadVideo` messages from the worker, and shows toast notifications. All
  backend calls go through `VideoDownloaderApi` (`src/content/services/VideoDownloaderApi.ts`), which reads the auth
  config from `chrome.storage.local`, health-checks `/service/info`, and fails over from `production` to `fallback`
  server (only `production` is defined in `Server.ts`).
- **Action page** (`src/action-page/ActionPage.tsx`): React popup that polls each configured server's `/service/info`
  and shows status/ping/version.

The worker and content script share state only through `chrome.storage.local` (key defined in
`src/kv-store/StorageKey.ts`, accessed via the `KeyValueStore` abstraction) and runtime messages (discriminated union in
`src/models/Message.ts`). All API payloads and stored data are validated with Zod schemas (`src/models/`,
`src/content/models/`); use `zodParse` from `src/models/Zod.ts`.

### Adding support for a new video site

Implement `VideoSiteHandler` (`src/content/handlers/VideoSiteHandler.ts`) — `hostnames`, `isMatch`, `isVideoPage`,
`buttonContainer` — and register the instance in the `videoSiteHandlers` array in that same file. `hostnames` must cover
every hostname `isMatch` can match, since it gates whether the polling loop runs at all. Sites on the Txxx network
subclass `TxxxNetworkVideoSiteHandler` instead.

### Build details

- `manifest.json` at the repo root is the source of truth, but `name`/`version`/`description` are injected from
  `package.json` by the CopyPlugin transform in `webpack.config.js` at build time.
- `src/content/styles/content.scss` is emitted as `styles/content.css` (webpack asset module) and injected declaratively
  via the manifest's `content_scripts.css` — it is not JS-injected, so there is no css-loader/style-loader.
- Version bumps are their own commit (`Bump version to X.Y.Z`); use `npm version X.Y.Z --no-git-tag-version` so
  `package-lock.json` stays in sync.
