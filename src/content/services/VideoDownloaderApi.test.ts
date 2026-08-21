import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createVideoDownloaderApi } from "./VideoDownloaderApi"
import { LocalStorage } from "../../kv-store/LocalStorage"
import { StorageKey } from "../../kv-store/StorageKey"
import { SchedulingStatus } from "../models/ScheduledVideoDownload"
import StorageArea = chrome.storage.StorageArea

const PRODUCTION_URL = "https://api.production.example"
const FALLBACK_URL = "https://api.fallback.example"

const VIDEO_URL = "https://xhamster.com/videos/some-video-title-12345"

const videoMetadataPayload = {
  url: VIDEO_URL,
  id: "xhamster-12345",
  videoSite: "xhamster",
  title: "Some video title",
  duration: { length: 754, unit: "seconds" },
  size: 524_288_000,
  thumbnail: {
    id: "thumbnail-12345",
    createdAt: "2026-08-20T09:15:00.000Z",
    path: "/images/thumbnail-12345.jpg",
    mediaType: "image/jpeg",
    size: 48_213,
  },
}

const scheduledVideoDownloadPayload = {
  scheduledAt: "2026-08-21T13:45:30.000Z",
  lastUpdatedAt: "2026-08-21T14:02:11.000Z",
  status: SchedulingStatus.Active,
  downloadedBytes: 12_345_678,
  videoMetadata: videoMetadataPayload,
  completedAt: null,
}

const storageBackedApi = (apiConfigurations: string | null) => {
  const storageArea = {
    get: (key: string, callback: (items: Record<string, string>) => void) =>
      callback(apiConfigurations === null ? {} : { [key]: apiConfigurations }),
  }

  return createVideoDownloaderApi(new LocalStorage(storageArea as unknown as StorageArea))
}

const configurationsFor = (servers: { production?: boolean; fallback?: boolean }) =>
  JSON.stringify({
    ...(servers.production === false
      ? {}
      : { production: { serverUrl: PRODUCTION_URL, authenticationToken: "production-token" } }),
    ...(servers.fallback ? { fallback: { serverUrl: FALLBACK_URL, authenticationToken: "fallback-token" } } : {}),
  })

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })

/**
 * Routes requests by server. `online` decides how /service/info answers, which is what drives the
 * production -> fallback failover in _runActions.
 */
const routedFetch = (servers: Record<string, { online: boolean | "network-error"; body?: unknown }>) =>
  // `_init` is declared so that recorded calls keep the RequestInit in mock.calls, even though routing ignores it.
  vi.fn((input: RequestInfo | URL, _init?: RequestInit) => {
    const url = input.toString()
    const server = Object.keys(servers).find((serverUrl) => url.startsWith(serverUrl))

    if (server === undefined) {
      throw new Error(`Unexpected request to ${url}`)
    }

    const { online, body } = servers[server]

    if (url.includes("/service/info")) {
      if (online === "network-error") {
        return Promise.reject(new TypeError("Failed to fetch"))
      }

      return Promise.resolve(jsonResponse({ gitBranch: "master" }, online ? 200 : 503))
    }

    return Promise.resolve(jsonResponse(body ?? {}))
  })

describe("createVideoDownloaderApi", () => {
  it.each([
    ["no configuration is stored", null],
    ["the stored configuration is empty", ""],
    ["the stored configuration is only whitespace", "   "],
  ])("rejects when %s", async (_description, stored) => {
    await expect(storageBackedApi(stored)).rejects.toThrow("VideoDownloader API configurations not found")
  })

  it("reads the configuration from the ApiConfigurations storage key", async () => {
    const get = vi.fn((_key: string, callback: (items: Record<string, string>) => void) => callback({}))

    await expect(createVideoDownloaderApi(new LocalStorage({ get } as unknown as StorageArea))).rejects.toThrow()
    expect(get).toHaveBeenCalledWith(StorageKey.ApiConfigurations, expect.any(Function))
  })

  it("rejects a stored configuration that does not match the schema", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})

    try {
      await expect(storageBackedApi(JSON.stringify({ production: { serverUrl: 42 } }))).rejects.toThrow()
    } finally {
      consoleError.mockRestore()
    }
  })
})

describe("VideoDownloaderApi", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe("server selection", () => {
    it("uses production while production is healthy", async () => {
      const fetch = routedFetch({
        [PRODUCTION_URL]: { online: true },
        [FALLBACK_URL]: { online: true },
      })
      vi.stubGlobal("fetch", fetch)

      const api = await storageBackedApi(configurationsFor({ fallback: true }))
      await api.scheduleVideoDownload(VIDEO_URL)

      const requested = fetch.mock.calls.map(([input]) => input.toString())
      expect(requested).toContain(`${PRODUCTION_URL}/schedule`)
      expect(requested).not.toContain(`${FALLBACK_URL}/schedule`)
    })

    it("fails over to fallback when production returns a non-OK health check", async () => {
      const fetch = routedFetch({
        [PRODUCTION_URL]: { online: false },
        [FALLBACK_URL]: { online: true },
      })
      vi.stubGlobal("fetch", fetch)

      const api = await storageBackedApi(configurationsFor({ fallback: true }))
      await api.scheduleVideoDownload(VIDEO_URL)

      const requested = fetch.mock.calls.map(([input]) => input.toString())
      expect(requested).toContain(`${FALLBACK_URL}/schedule`)
      expect(requested).not.toContain(`${PRODUCTION_URL}/schedule`)
    })

    it("fails over to fallback when the production health check throws", async () => {
      const fetch = routedFetch({
        [PRODUCTION_URL]: { online: "network-error" },
        [FALLBACK_URL]: { online: true },
      })
      vi.stubGlobal("fetch", fetch)

      const api = await storageBackedApi(configurationsFor({ fallback: true }))
      await api.scheduleVideoDownload(VIDEO_URL)

      expect(fetch.mock.calls.map(([input]) => input.toString())).toContain(`${FALLBACK_URL}/schedule`)
    })

    it("rejects when every configured server is offline", async () => {
      vi.stubGlobal(
        "fetch",
        routedFetch({
          [PRODUCTION_URL]: { online: false },
          [FALLBACK_URL]: { online: false },
        }),
      )

      const api = await storageBackedApi(configurationsFor({ fallback: true }))

      await expect(api.scheduleVideoDownload(VIDEO_URL)).rejects.toThrow("No servers available")
    })

    it("rejects when production is offline and no fallback is configured", async () => {
      vi.stubGlobal("fetch", routedFetch({ [PRODUCTION_URL]: { online: false } }))

      const api = await storageBackedApi(configurationsFor({}))

      await expect(api.scheduleVideoDownload(VIDEO_URL)).rejects.toThrow("No servers available")
    })
  })

  describe("scheduleVideoDownload", () => {
    it("posts the video URL with the server's bearer token", async () => {
      const fetch = routedFetch({ [PRODUCTION_URL]: { online: true } })
      vi.stubGlobal("fetch", fetch)

      const api = await storageBackedApi(configurationsFor({}))
      await expect(api.scheduleVideoDownload(VIDEO_URL)).resolves.toBe(200)

      const scheduleCall = fetch.mock.calls.find(([input]) => input.toString().endsWith("/schedule"))
      expect(scheduleCall).toBeDefined()

      const requestInit = scheduleCall![1]!
      expect(requestInit.method).toBe("POST")
      expect((requestInit.headers as Record<string, string>).Authorization).toBe("Bearer production-token")
      expect(JSON.parse(requestInit.body as string)).toEqual({ url: VIDEO_URL })
    })
  })

  describe("gatherVideoMetadata", () => {
    it("parses the metadata response", async () => {
      vi.stubGlobal("fetch", routedFetch({ [PRODUCTION_URL]: { online: true, body: videoMetadataPayload } }))

      const api = await storageBackedApi(configurationsFor({}))
      const metadata = await api.gatherVideoMetadata(VIDEO_URL)

      expect(metadata.id).toBe("xhamster-12345")
      expect(metadata.duration.toMillis()).toBe(754_000)
    })
  })

  describe("searchScheduledVideosByUrl", () => {
    let fetch: ReturnType<typeof routedFetch>

    beforeEach(() => {
      fetch = routedFetch({
        [PRODUCTION_URL]: { online: true, body: { results: [scheduledVideoDownloadPayload] } },
      })
      vi.stubGlobal("fetch", fetch)
    })

    it("unwraps the results array", async () => {
      const api = await storageBackedApi(configurationsFor({}))
      const results = await api.searchScheduledVideosByUrl(VIDEO_URL)

      expect(results).toHaveLength(1)
      expect(results[0].status).toBe(SchedulingStatus.Active)
      expect(results[0].videoMetadata.title).toBe("Some video title")
    })

    it("percent-encodes the video URL into the query string", async () => {
      const api = await storageBackedApi(configurationsFor({}))
      await api.searchScheduledVideosByUrl(VIDEO_URL)

      const searchRequest = fetch.mock.calls.map(([input]) => input.toString()).find((url) => url.includes("/search"))

      expect(searchRequest).toBe(`${PRODUCTION_URL}/schedule/search?video-url=${encodeURIComponent(VIDEO_URL)}`)
    })
  })
})
