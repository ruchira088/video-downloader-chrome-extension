import retrieveCookieStore, { CookieStore } from "../kv-store/CookieStore"
import storageAreaKeyValueStore from "../kv-store/StorageAreaKeyValueStore"
import { StorageKey } from "../kv-store/StorageKey"
import { KeyValueStore } from "../kv-store/KeyValueStore"
import { AuthenticationTokenNotFoundException } from "../errors/Errors"

const initialize = (store: CookieStore, keyValueStore: KeyValueStore<string, string>) =>
  store
    .get("authentication")
    .then((cookieOpt) =>
      cookieOpt
        .map((cookie) => Promise.resolve(cookie))
        .orLazy(() => Promise.reject(AuthenticationTokenNotFoundException))
    )
    .then((cookie) => keyValueStore.put(StorageKey.AuthenticationCookie, cookie.value))
    .then(() => console.log("Authentication token persisted to Key-Value store"))

const backgroundTask = () =>
  retrieveCookieStore()
    .then((store) => initialize(store, storageAreaKeyValueStore()))
    .catch((error) => console.log(error))

chrome.runtime.onMessage.addListener(() => {
  backgroundTask()
})

backgroundTask()
