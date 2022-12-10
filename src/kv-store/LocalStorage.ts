import { KeyValueStore } from "./KeyValueStore"
import { Maybe, None, Some } from "monet"
import StorageArea = chrome.storage.StorageArea

export class LocalStorage implements KeyValueStore<string, string> {
  constructor(readonly storageArea: StorageArea) {
  }

  get(key: string): Promise<Maybe<string>> {
    return new Promise<Maybe<string>>((resolve) => {
      this.storageArea.get(key, (result) => {
        resolve(Maybe.fromFalsy(result).flatMap((value) => Maybe.fromFalsy(value[key])))
      })
    })
  }

  put(key: string, value: string): Promise<Maybe<string>> {
    return this.get(key).then(
      (previous) =>
        new Promise((resolve) => {
          this.storageArea.set({ [key]: value }, () => {
            resolve(previous)
          })
        })
    )
  }

  remove(key: string): Promise<Maybe<string>> {
    return this.get(key).then((result) =>
      result.fold<Promise<Maybe<string>>>(Promise.resolve(None()))(
        (value) => new Promise<Maybe<string>>((resolve) => this.storageArea.remove(key, () => resolve(Some(value))))
      )
    )
  }
}

export default LocalStorage
