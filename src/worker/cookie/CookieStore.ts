import { Maybe } from "monet"
import Cookie = chrome.cookies.Cookie

export interface CookieStore {
  get(key: string): Promise<Maybe<Cookie>>

  getAll(): Promise<Cookie[]>
}

class ChromeCookieStore implements CookieStore {
  constructor(readonly url: string) {
  }

  get(key: string): Promise<Maybe<Cookie>> {
    return this.getAll()
      .then(cookies => Maybe.fromFalsy(cookies.find((cookie) => cookie.name === key)))
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
