import { LocalStorage } from "../../kv-store/LocalStorage"
import { StorageKey } from "../../kv-store/StorageKey"
import { KeyValueStore } from "../../kv-store/KeyValueStore"
import { VideoMetadata } from "../models/VideoMetadata"
import { parseVideoMetadata } from "../utils/ResponseParser"
import { ApiConfiguration } from "../../models/ApiConfiguration"
import { ScheduledVideoDownload, SchedulingStatus } from "../models/ScheduledVideoDownload"

interface VideoDownloaderApiConfiguration {
  readonly production: ApiConfiguration
  readonly development: ApiConfiguration
  readonly productionFallback: ApiConfiguration
}

interface SearchResult<T> {
  readonly results: T[]
}

export interface VideoDownloaderApi {
  scheduleVideoDownload(videoUrl: string): Promise<boolean>

  gatherVideoMetadata(videoUrl: string): Promise<VideoMetadata>

  searchScheduledVideosByUrl(videoUrl: string): Promise<ScheduledVideoDownload[]>
}

class VideoDownloaderApiImpl implements VideoDownloaderApi {
  constructor(readonly videoDownloaderApiConfiguration: VideoDownloaderApiConfiguration) {
  }

  async scheduleVideoDownload(videoUrl: string): Promise<boolean> {
    if (await this.isProductionServerOnline()) {
      return this._scheduleVideoDownload(videoUrl, this.videoDownloaderApiConfiguration.production)
    } else {
      return this._scheduleVideoDownload(videoUrl, this.videoDownloaderApiConfiguration.productionFallback)
    }
  }

  async _scheduleVideoDownload(videoUrl: string, apiConfiguration: ApiConfiguration): Promise<boolean> {
    const response: Response =
      await fetch(`${apiConfiguration.serverUrl}/schedule`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiConfiguration.authenticationToken}`
        },
        body: JSON.stringify({ url: videoUrl })
      })

    return response.ok
  }

  async searchScheduledVideosByUrl(videoUrl: string): Promise<ScheduledVideoDownload[]> {
    const searchResults = await this._searchScheduledVideosByUrl(videoUrl, this.videoDownloaderApiConfiguration.production)
    return searchResults.results
  }

  async _searchScheduledVideosByUrl(videoUrl: string, apiConfiguration: ApiConfiguration): Promise<SearchResult<ScheduledVideoDownload>> {
    const response =
      await fetch(`${apiConfiguration.serverUrl}/schedule/search?video-url=${encodeURIComponent(videoUrl)}`, {
        headers: {
          Authorization: `Bearer ${apiConfiguration.authenticationToken}`
        }
      })

    if (response.ok) {
      const body: SearchResult<ScheduledVideoDownload> = await response.json()
      return Promise.resolve(body)
    } else {
      return Promise.reject(response)
    }
  }

  async gatherVideoMetadata(videoUrl: string): Promise<VideoMetadata> {
    if (await this.isProductionServerOnline()) {
      return this._gatherVideoMetadata(videoUrl, this.videoDownloaderApiConfiguration.production)
    } else {
      return this._gatherVideoMetadata(videoUrl, this.videoDownloaderApiConfiguration.development)
    }
  }

  async _gatherVideoMetadata(videoUrl: string, apiConfiguration: ApiConfiguration): Promise<VideoMetadata> {
    const response =
      await fetch(`${apiConfiguration.serverUrl}/videos/metadata`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiConfiguration.authenticationToken}`
        },
        body: JSON.stringify({ url: videoUrl })
      })

    const body = await response.json()

    if (response.ok) {
      return Promise.resolve(parseVideoMetadata(body))
    } else {
      return Promise.reject(body)
    }
  }

  isProductionServerOnline(): Promise<boolean> {
    // @ts-ignore
    return fetch(`${this.videoDownloaderApiConfiguration.production.serverUrl}/service/info`, { signal: AbortSignal.timeout(3000) })
      .then(response => response.ok)
      .catch(() => false)
  }
}

const apiConfigurations = async (keyValueStore: KeyValueStore<string, string>): Promise<VideoDownloaderApiConfiguration> => {
  const maybeValue = await keyValueStore.get(StorageKey.ApiConfigurations)

  const videoDownloaderApiConfiguration: VideoDownloaderApiConfiguration =
    await maybeValue
      .filter(value => value != "")
      .map(value => Promise.resolve(JSON.parse(value) as VideoDownloaderApiConfiguration))
      .orLazy(() => Promise.reject("VideoDownloader API configuration not found"))

  return videoDownloaderApiConfiguration
}

export default (localStorage: LocalStorage) =>
  apiConfigurations(localStorage).then((config) => new VideoDownloaderApiImpl(config))
