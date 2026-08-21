import { describe, expect, it } from "vitest"
import { ScheduledVideoDownload, SchedulingStatus } from "./ScheduledVideoDownload"
import { VideoMetadata } from "./VideoMetadata"
import { SearchResult } from "./SearchResult"

const videoMetadataPayload = {
  url: "https://xhamster.com/videos/some-video-title-12345",
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

describe("VideoMetadata", () => {
  it("parses a realistic API payload", () => {
    const parsed = VideoMetadata.parse(videoMetadataPayload)

    expect(parsed.title).toBe("Some video title")
    expect(parsed.duration.toMillis()).toBe(754_000)
    expect(parsed.thumbnail.createdAt.toUTC().toISO()).toBe("2026-08-20T09:15:00.000Z")
  })

  it.each([
    ["a non-integer size", { ...videoMetadataPayload, size: 1.5 }],
    ["a missing thumbnail", { ...videoMetadataPayload, thumbnail: undefined }],
    ["a malformed duration", { ...videoMetadataPayload, duration: 754 }],
  ])("rejects %s", (_description, payload) => {
    expect(() => VideoMetadata.parse(payload)).toThrow()
  })
})

describe("ScheduledVideoDownload", () => {
  it("parses a realistic API payload", () => {
    const parsed = ScheduledVideoDownload.parse(scheduledVideoDownloadPayload)

    expect(parsed.status).toBe(SchedulingStatus.Active)
    expect(parsed.downloadedBytes).toBe(12_345_678)
    expect(parsed.scheduledAt.toUTC().toISO()).toBe("2026-08-21T13:45:30.000Z")
    expect(parsed.completedAt).toBeNull()
  })

  it("accepts a completedAt once the download finishes", () => {
    const parsed = ScheduledVideoDownload.parse({
      ...scheduledVideoDownloadPayload,
      status: SchedulingStatus.Completed,
      completedAt: "2026-08-21T14:30:00.000Z",
    })

    expect(parsed.completedAt?.toUTC().toISO()).toBe("2026-08-21T14:30:00.000Z")
  })

  it.each(Object.values(SchedulingStatus))("accepts the %s status", (status) => {
    expect(ScheduledVideoDownload.parse({ ...scheduledVideoDownloadPayload, status }).status).toBe(status)
  })

  it("rejects a status the backend does not define", () => {
    expect(() => ScheduledVideoDownload.parse({ ...scheduledVideoDownloadPayload, status: "Unknown" })).toThrow()
  })
})

describe("SearchResult", () => {
  it("parses a wrapped list of results", () => {
    const parsed = SearchResult(ScheduledVideoDownload).parse({ results: [scheduledVideoDownloadPayload] })

    expect(parsed.results).toHaveLength(1)
    expect(parsed.results[0].videoMetadata.id).toBe("xhamster-12345")
  })

  it("parses an empty result set", () => {
    expect(SearchResult(ScheduledVideoDownload).parse({ results: [] }).results).toEqual([])
  })

  it("rejects a result set containing a malformed entry", () => {
    expect(() =>
      SearchResult(ScheduledVideoDownload).parse({
        results: [scheduledVideoDownloadPayload, { ...scheduledVideoDownloadPayload, status: "Unknown" }],
      }),
    ).toThrow()
  })
})
