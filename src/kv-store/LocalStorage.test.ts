import { beforeEach, describe, expect, it } from "vitest"
import { LocalStorage } from "./LocalStorage"
import StorageArea = chrome.storage.StorageArea

/**
 * Minimal stand-in for chrome.storage.local. Only the callback-style get/set/remove are modelled, since
 * those are the entirety of what LocalStorage touches.
 */
class FakeStorageArea {
  readonly entries = new Map<string, string>()

  get(key: string, callback: (items: Record<string, string>) => void): void {
    const value = this.entries.get(key)

    // chrome omits the key entirely when it is absent, rather than returning undefined against it.
    callback(value === undefined ? {} : { [key]: value })
  }

  set(items: Record<string, string>, callback: () => void): void {
    for (const [key, value] of Object.entries(items)) {
      this.entries.set(key, value)
    }

    callback()
  }

  remove(key: string, callback: () => void): void {
    this.entries.delete(key)
    callback()
  }
}

describe("LocalStorage", () => {
  let storageArea: FakeStorageArea
  let localStorage: LocalStorage

  beforeEach(() => {
    storageArea = new FakeStorageArea()
    localStorage = new LocalStorage(storageArea as unknown as StorageArea)
  })

  describe("get", () => {
    it("returns null for a key that was never written", async () => {
      await expect(localStorage.get("missing")).resolves.toBeNull()
    })

    it("returns the stored value", async () => {
      storageArea.entries.set("token", "abc123")

      await expect(localStorage.get("token")).resolves.toBe("abc123")
    })

    it("returns an empty string that was deliberately stored", async () => {
      storageArea.entries.set("token", "")

      await expect(localStorage.get("token")).resolves.toBe("")
    })
  })

  describe("put", () => {
    it("writes the value through to the storage area", async () => {
      await localStorage.put("token", "abc123")

      expect(storageArea.entries.get("token")).toBe("abc123")
    })

    it("returns null when there was no previous value", async () => {
      await expect(localStorage.put("token", "abc123")).resolves.toBeNull()
    })

    it("returns the previous value when overwriting", async () => {
      await localStorage.put("token", "abc123")

      await expect(localStorage.put("token", "def456")).resolves.toBe("abc123")
      expect(storageArea.entries.get("token")).toBe("def456")
    })
  })

  describe("remove", () => {
    it("deletes the entry and returns the value it held", async () => {
      await localStorage.put("token", "abc123")

      await expect(localStorage.remove("token")).resolves.toBe("abc123")
      expect(storageArea.entries.has("token")).toBe(false)
    })

    it("returns null and leaves storage untouched for an absent key", async () => {
      await expect(localStorage.remove("missing")).resolves.toBeNull()
      expect(storageArea.entries.size).toBe(0)
    })
  })
})
