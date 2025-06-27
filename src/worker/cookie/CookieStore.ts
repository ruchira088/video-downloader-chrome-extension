import Cookie = chrome.cookies.Cookie

export interface CookieStore {
  get(key: string): Promise<Cookie | null>

  getAll(): Promise<Cookie[]>
}

class ChromeCookieStore implements CookieStore {
  constructor(readonly url: string) {
  }

  async get(key: string): Promise<Cookie | null> {
    const cookies = await this.getAll()
    return cookies.find((cookie) => cookie.name === key) ?? null
  }

  getAll(): Promise<Cookie[]> {
    return new Promise((resolve) =>
      chrome.cookies.getAll({ url: this.url }, cookies =>
        resolve(cookies)
      )
    )
  }
}

export default ChromeCookieStore
