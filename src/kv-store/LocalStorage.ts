import { KeyValueStore } from "./KeyValueStore"
import { map } from "../helpers/TypeUtils"
import StorageArea = chrome.storage.StorageArea

export class LocalStorage implements KeyValueStore<string, string> {
  constructor(readonly storageArea: StorageArea) {}

  get(key: string): Promise<string | null> {
    return new Promise<string | null>((resolve) => {
      this.storageArea.get(key, (result) => {
        resolve(map(result, (result) => result[key]))
      })
    })
  }

  async put(key: string, value: string): Promise<string | null> {
    const existing = await this.get(key)

    return new Promise((resolve) => {
      this.storageArea.set({ [key]: value }, () => {
        resolve(existing)
      })
    })
  }

  async remove(key: string): Promise<string | null> {
    const existing = await this.get(key)

    if (existing != null) {
      return new Promise<string>((resolve) => this.storageArea.remove(key, () => resolve(existing)))
    } else {
      return null
    }
  }
}

export default LocalStorage
