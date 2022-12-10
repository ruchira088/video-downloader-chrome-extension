import { Maybe } from "monet"
import Cookie = chrome.cookies.Cookie

export interface CookieStore {
  get(key: string): Promise<Maybe<Cookie>>
}

class ChromeCookieStore implements CookieStore {
  constructor(readonly url: string) {
  }

  get(key: string): Promise<Maybe<Cookie>> {
    return new Promise((resolve) =>
      chrome.cookies.getAll({ url: this.url }, (result) =>
        resolve(Maybe.fromFalsy(result.find((cookie) => cookie.name === key)))
      )
    )
  }
}

export default ChromeCookieStore
