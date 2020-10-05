import storageAreaKeyValueStore from "../kv-store/StorageAreaKeyValueStore"
import {StorageKey} from "../kv-store/StorageKey";
import {ApiConfiguration} from "../models/ApiConfiguration";
import {ApiUrlUndefinedException, AuthenticationTokenNotFoundException} from "../errors/Errors";
import {KeyValueStore} from "../kv-store/KeyValueStore";

export interface VideoDownloaderApi {
    videoExistsByUrl(videoUrl: string): Promise<boolean>

    scheduleVideoDownload(videoUrl: string): Promise<boolean>
}

class VideoDownloaderApiImpl implements VideoDownloaderApi {
    constructor(readonly apiConfiguration: ApiConfiguration) {
    }

    scheduleVideoDownload(videoUrl: string): Promise<boolean> {
        return fetch(`${this.apiConfiguration.url}/schedule`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.apiConfiguration.authenticationToken}`
            },
            body: JSON.stringify({url: videoUrl})
        })
            .then(response => response.ok)
    }

    videoExistsByUrl(videoUrl: string): Promise<boolean> {
        return fetch(`${this.apiConfiguration.url}/schedule/search?video-url=${videoUrl}`, {
                headers: {"Authorization": `Bearer ${this.apiConfiguration.authenticationToken}`}
            }
        )
            .then(response =>
                response.json().then(body => response.ok ? Promise.resolve(body) : Promise.reject(body))
            )
            .then((body: { results: object[] }) => body.results.length > 0)
    }

}

const apiConfiguration = (keyValueStore: KeyValueStore<string, string>): Promise<ApiConfiguration> =>
    Promise.all([keyValueStore.get(StorageKey.ApiServerUrl), keyValueStore.get(StorageKey.AuthenticationCookie)])
        .then(([apiServerUrlOpt, authenticationCookieOpt]) =>
            apiServerUrlOpt.fold<Promise<string>>(Promise.reject(ApiUrlUndefinedException))(apiServerUrl => Promise.resolve(apiServerUrl))
                .then(apiServerUrl => authenticationCookieOpt.fold<Promise<ApiConfiguration>>(Promise.reject(AuthenticationTokenNotFoundException))(authenticationToken => Promise.resolve({
                    url: apiServerUrl,
                    authenticationToken
                })))
        )

export default () => apiConfiguration(storageAreaKeyValueStore()).then(config => new VideoDownloaderApiImpl(config))
