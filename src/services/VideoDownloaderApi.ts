import storageAreaKeyValueStore from "../kv-store/StorageAreaKeyValueStore"
import { StorageKey } from "../kv-store/StorageKey"
import { ApiConfiguration } from "../models/ApiConfiguration"
import { ApiUrlUndefinedException, AuthenticationTokenNotFoundException } from "../errors/Errors"
import { KeyValueStore } from "../kv-store/KeyValueStore"
import { VideoMetadata } from "../models/VideoMetadata"
import { parseVideoMetadata } from "../utils/ResponseParser"

export interface VideoDownloaderApi {
  videoExistsByUrl(videoUrl: string): Promise<boolean>

  scheduleVideoDownload(videoUrl: string): Promise<boolean>

  gatherVideoMetadata(videoUrl: string): Promise<VideoMetadata>
}

class VideoDownloaderApiImpl implements VideoDownloaderApi {
  constructor(readonly apiConfiguration: ApiConfiguration) {}

  scheduleVideoDownload(videoUrl: string): Promise<boolean> {
    return fetch(`${this.apiConfiguration.url}/schedule`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiConfiguration.authenticationToken}`,
      },
      body: JSON.stringify({ url: videoUrl }),
    }).then((response: Response) => response.ok)
  }

  videoExistsByUrl(videoUrl: string): Promise<boolean> {
    return fetch(`${this.apiConfiguration.url}/schedule/search?video-url=${encodeURIComponent(videoUrl)}`, {
      headers: {
        Authorization: `Bearer ${this.apiConfiguration.authenticationToken}`,
      },
    })
      .then((response) => response.json().then((body) => (response.ok ? Promise.resolve(body) : Promise.reject(body))))
      .then((body: { results: object[] }) => body.results.length > 0)
  }

  gatherVideoMetadata(videoUrl: string): Promise<VideoMetadata> {
    return fetch(`${this.apiConfiguration.url}/videos/metadata`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiConfiguration.authenticationToken}`,
      },
      body: JSON.stringify({ url: videoUrl }),
    }).then((response: Response) =>
      response.json().then((body) => (response.ok ? Promise.resolve(parseVideoMetadata(body)) : Promise.reject(body)))
    )
  }
}

const apiConfiguration = (keyValueStore: KeyValueStore<string, string>): Promise<ApiConfiguration> =>
  Promise.all([keyValueStore.get(StorageKey.ApiServerUrl), keyValueStore.get(StorageKey.AuthenticationCookie)]).then(
    ([apiServerUrlOpt, authenticationCookieOpt]) =>
      apiServerUrlOpt
        .map((apiServerUrl) => Promise.resolve(apiServerUrl))
        .orLazy(() => Promise.reject(ApiUrlUndefinedException))
        .then((apiServerUrl) =>
          authenticationCookieOpt
            .map((authenticationToken) =>
              Promise.resolve({
                url: apiServerUrl,
                authenticationToken,
              })
            )
            .orLazy(() => Promise.reject(AuthenticationTokenNotFoundException))
        )
  )

export default () => apiConfiguration(storageAreaKeyValueStore()).then((config) => new VideoDownloaderApiImpl(config))
