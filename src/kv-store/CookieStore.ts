import {Maybe} from "monet";
import storageAreaKeyValueStore from "./StorageAreaKeyValueStore"
import {StorageKey} from "./StorageKey";
import Cookie = chrome.cookies.Cookie;
import {ApiUrlUndefinedException} from "../errors/Errors";

export interface CookieStore {
    get(key: string): Promise<Maybe<Cookie>>
}

class ChromeCookieStore implements CookieStore {
    constructor(readonly url: string) {
    }

    get(key: string): Promise<Maybe<Cookie>> {
        return new Promise(resolve =>
            chrome.cookies.getAll(
                { url: this.url },
                    result => resolve(Maybe.fromFalsy(result.find(cookie => cookie.name === key)))
            )
        )
    }
}

const cookieStore: () => Promise<CookieStore> =
    () =>
        storageAreaKeyValueStore().get(StorageKey.ApiServerUrl)
            .then(result => result.fold<Promise<CookieStore>>(Promise.reject(ApiUrlUndefinedException))(apiServerUrl => Promise.resolve(new ChromeCookieStore(apiServerUrl))))

export default cookieStore
