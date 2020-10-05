import {Maybe} from "monet";
import storageAreaKeyValueStore from "./StorageAreaKeyValueStore"
import {StorageKey} from "./StorageKey";
import {ApiUrlUndefinedException} from "../errors/Errors";
import Cookie = chrome.cookies.Cookie;

export interface CookieStore {
    get(key: string): Promise<Maybe<Cookie>>
}

class ChromeCookieStore implements CookieStore {
    constructor(readonly url: string) {
    }

    get(key: string): Promise<Maybe<Cookie>> {
        return new Promise(resolve =>
            chrome.cookies.getAll(
                {url: this.url},
                result => resolve(Maybe.fromFalsy(result.find(cookie => cookie.name === key)))
            )
        )
    }
}

const cookieStore: () => Promise<CookieStore> =
    () =>
        storageAreaKeyValueStore().get(StorageKey.ApiServerUrl)
            .then(result => result.map(apiServerUrl => Promise.resolve(new ChromeCookieStore(apiServerUrl))).orLazy(() => Promise.reject(ApiUrlUndefinedException)))

export default cookieStore
