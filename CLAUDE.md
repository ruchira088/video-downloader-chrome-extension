# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run build          # production build → ./build (set BUILD_TARGET=<dir> to override)
npm run verify:build   # check ./build is a loadable extension (manifest/HTML refs resolve, bundles in budget)
npm run dev            # tsc --watch + webpack --watch together (Ctrl-C kills both)
npm run typecheck      # tsc --noEmit
npm test               # vitest run (single pass); test:watch for watch mode
npm run lint           # oxlint src
npm run prettier       # format (writes); prettier:check to verify only
```

Tests are Vitest, colocated as `src/**/*.test.ts`, running under happy-dom (`vitest.config.mts`). CI
(`.github/workflows/build-pipeline.yml`) runs typecheck, lint, test, prettier:check, audit, build, and verify:build on
every push.

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
- **Action page** (`src/action-page/ActionPage.ts`): toolbar popup (plain TypeScript DOM code, no framework) that polls
  each configured server's `/service/info` and shows status/ping/version.

The worker and content script share state only through `chrome.storage.local` (key defined in
`src/kv-store/StorageKey.ts`, accessed via the `KeyValueStore` abstraction) and runtime messages (discriminated union in
`src/models/Message.ts`). All API payloads and stored data are validated with Zod schemas (`src/models/`,
`src/content/models/`); use `zodParse` from `src/models/Zod.ts`.

### Adding support for a new video site

Implement `VideoSiteHandler` (`src/content/handlers/VideoSiteHandler.ts`) — `hostnames`, `isMatch`, `isVideoPage`,
`buttonContainer` — and register the instance in the `videoSiteHandlers` array in that same file. `hostnames` must cover
every hostname `isMatch` can match, since it gates whether the polling loop runs at all. Sites on the Txxx network
subclass `TxxxNetworkVideoSiteHandler` instead.

Also add the handler to the `SITES` table in `src/content/handlers/VideoSiteHandler.test.ts` — a registered handler with
no fixture fails the suite deliberately. The table drives every handler test, including the `hostnames`/`isMatch`
invariant above and the DOM fixtures for `isVideoPage`/`buttonContainer`.

### Build details

- `manifest.json` at the repo root is the source of truth, but `name`/`version`/`description` are injected from
  `package.json` by the CopyPlugin transform in `webpack.config.js` at build time.
- `src/content/styles/content.scss` is emitted as `styles/content.css` (webpack asset module) and injected declaratively
  via the manifest's `content_scripts.css` — it is not JS-injected, so there is no css-loader/style-loader.
- TypeScript 7 is the native (Go) compiler and ships no JS compiler API, so `ts-loader` and `typescript-eslint` cannot
  run against it. Linting is therefore `oxlint` (config in `.oxlintrc.json`), and the build is two stages: `tsc` emits
  type-stripped JS to `.tsbuild` (tsconfig `rootDir`/`outDir`), then webpack bundles _that_ — there is no TS loader in
  `webpack.config.js`, and its `entry` paths point at `.tsbuild`, not `src`. Because tsc runs first, `npm run build`
  fails on type errors.
- tsconfig sets `"module": "esnext"` deliberately. Emitting CommonJS instead costs webpack its tree-shaking and scope
  hoisting, which triples the bundles (~430 KiB vs ~140 KiB per entry) — don't switch it back.
- tsc emits only JS, so the `./styles/*.scss` imports sitting beside the entry `.ts` files have no counterpart under
  `.tsbuild`. A `NormalModuleReplacementPlugin` in `webpack.config.js` maps those requests back to `src/`. Adding a new
  co-located non-TS import needs the same treatment.
- `scripts/verify-build.mjs` (run by `npm run verify:build`) guards the two things a green webpack build does not: that
  every path `manifest.json` and `index.html` reference actually got emitted, and that the bundles stay within their
  size budgets. Both files are copied verbatim, so a renamed entry point otherwise builds clean and ships a broken
  extension. Raise the budgets in that script when growth is intended.
- tsconfig sets `"include": ["src"]` so that root-level config files stay outside `rootDir`. A consequence worth
  knowing: a `.ts` file added at the repo root is silently _not_ type-checked, which is why the Vitest config lives at
  the root as `vitest.config.mts` (ESM, loaded by Vite) rather than `.ts`.
- `allowScripts` denies `fsevents` and `@parcel/watcher` on purpose — both ship prebuilt binaries and load fine without
  their install scripts, so the entries record "reviewed, not needed" rather than an oversight. Flip one to `true` only
  if a platform genuinely has no prebuild and the package fails to load.
- Every commit must bump the version in both `package.json` and `package-lock.json` — run
  `npm version patch --no-git-tag-version` (or `X.Y.Z` instead of `patch`) before committing so both files stay in sync,
  and include them in the commit.
