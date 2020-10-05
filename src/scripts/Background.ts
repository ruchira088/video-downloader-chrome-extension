import cookieStore, {CookieStore} from "../kv-store/CookieStore"
import storageAreaKeyValueStore from "../kv-store/StorageAreaKeyValueStore"
import {StorageKey} from "../kv-store/StorageKey";
import {KeyValueStore} from "../kv-store/KeyValueStore";
import {AuthenticationTokenNotFoundException} from "../errors/Errors";
import Cookie = chrome.cookies.Cookie;

const initialize =
    (store: CookieStore, keyValueStore: KeyValueStore<string, string>) =>
        store.get("authentication")
            .then(cookieOpt => cookieOpt.fold<Promise<Cookie>>(Promise.reject(AuthenticationTokenNotFoundException))(cookie => Promise.resolve(cookie)))
            .then(cookie => keyValueStore.put(StorageKey.AuthenticationCookie, cookie.value))
            .then(() => console.log("Authentication token persisted to Key-Value store"))

cookieStore()
    .then(store => initialize(store, storageAreaKeyValueStore()))
    .catch(error => console.log(error))
