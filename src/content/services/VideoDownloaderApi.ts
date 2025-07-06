import { LocalStorage } from "../../kv-store/LocalStorage"
import { StorageKey } from "../../kv-store/StorageKey"
import { KeyValueStore } from "../../kv-store/KeyValueStore"
import { VideoMetadata } from "../models/VideoMetadata"
import { ApiConfiguration, ApiConfigurations } from "../../models/ApiConfiguration"
import { ScheduledVideoDownload } from "../models/ScheduledVideoDownload"
import { SearchResult } from "../models/SearchResult"
import { zodParse } from "../../models/Zod"

export interface VideoDownloaderApi {
  scheduleVideoDownload(videoUrl: string): Promise<number>

  gatherVideoMetadata(videoUrl: string): Promise<VideoMetadata>

  searchScheduledVideosByUrl(videoUrl: string): Promise<ScheduledVideoDownload[]>
}

class VideoDownloaderApiImpl implements VideoDownloaderApi {
  constructor(readonly apiConfigurations: ApiConfigurations) {}

  scheduleVideoDownload(videoUrl: string): Promise<number> {
    return this._runActions((apiConfiguration) => this._scheduleVideoDownload(videoUrl, apiConfiguration))
  }

  async _scheduleVideoDownload(videoUrl: string, apiConfiguration: ApiConfiguration): Promise<number> {
    const response: Response = await fetch(`${apiConfiguration.serverUrl}/schedule`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiConfiguration.authenticationToken}`,
      },
      body: JSON.stringify({ url: videoUrl }),
    })

    if (response.ok) {
      return response.status
    } else {
      return Promise.reject(response)
    }
  }

  async searchScheduledVideosByUrl(videoUrl: string): Promise<ScheduledVideoDownload[]> {
    const searchResults = await this._runActions((apiConfiguration) =>
      this._searchScheduledVideosByUrl(videoUrl, apiConfiguration),
    )

    return searchResults.results
  }

  async _searchScheduledVideosByUrl(
    videoUrl: string,
    apiConfiguration: ApiConfiguration,
  ): Promise<SearchResult<ScheduledVideoDownload>> {
    const response = await fetch(
      `${apiConfiguration.serverUrl}/schedule/search?video-url=${encodeURIComponent(videoUrl)}`,
      {
        headers: {
          Authorization: `Bearer ${apiConfiguration.authenticationToken}`,
        },
      },
    )

    if (response.ok) {
      const responseBody = await response.json()
      const searchResults = zodParse(SearchResult(ScheduledVideoDownload), responseBody)
      return searchResults
    } else {
      return Promise.reject(response)
    }
  }

  gatherVideoMetadata(videoUrl: string): Promise<VideoMetadata> {
    return this._runActions((apiConfiguration) => this._gatherVideoMetadata(videoUrl, apiConfiguration))
  }

  async _gatherVideoMetadata(videoUrl: string, apiConfiguration: ApiConfiguration): Promise<VideoMetadata> {
    const response = await fetch(`${apiConfiguration.serverUrl}/videos/metadata`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiConfiguration.authenticationToken}`,
      },
      body: JSON.stringify({ url: videoUrl }),
    })

    const body = await response.json()

    if (response.ok) {
      return zodParse(VideoMetadata, body)
    } else {
      return Promise.reject(new Error(`Received non-OK response from server: ${body}`))
    }
  }

  async _runActions<T>(onServer: (apiConfiguration: ApiConfiguration) => Promise<T>): Promise<T> {
    if (await this._isServerOnline(this.apiConfigurations.production)) {
      return onServer(this.apiConfigurations.production!)
    } else if (await this._isServerOnline(this.apiConfigurations.fallback)) {
      return onServer(this.apiConfigurations.fallback!)
    } else {
      return Promise.reject(new Error("No servers available"))
    }
  }

  async _isServerOnline(apiConfiguration: ApiConfiguration | null | undefined): Promise<boolean> {
    if (apiConfiguration == null) {
      return Promise.resolve(false)
    }

    try {
      const response = await fetch(`${apiConfiguration.serverUrl}/service/info`, { signal: AbortSignal.timeout(3000) })
      return response.ok
    } catch {
      return false
    }
  }
}

const apiConfigurations = async (keyValueStore: KeyValueStore<string, string>): Promise<ApiConfigurations> => {
  const apiConfigurationsString: string | null = await keyValueStore.get(StorageKey.ApiConfigurations)

  if (apiConfigurationsString == null || apiConfigurationsString.trim() === "") {
    throw new Error("VideoDownloader API configurations not found")
  }

  const apiConfigs = zodParse(ApiConfigurations, JSON.parse(apiConfigurationsString))

  return apiConfigs
}

export const createVideoDownloaderApi = (localStorage: LocalStorage): Promise<VideoDownloaderApi> =>
  apiConfigurations(localStorage).then((config) => new VideoDownloaderApiImpl(config))
