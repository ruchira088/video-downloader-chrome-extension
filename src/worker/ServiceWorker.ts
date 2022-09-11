import ChromeCookieStore from "./cookie/CookieStore"
import LocalStorage from "../kv-store/LocalStorage"
import { StorageKey } from "../kv-store/StorageKey"
import { AuthenticationTokenNotFoundException } from "../errors/Errors"
import { Maybe } from "monet"
import { ApiConfiguration } from "../models/ApiConfiguration"
import { API_SERVERS, ApiServers, Server } from "../models/Server"

const initialiseServer = async (server: Server) => {
  const cookieStore = new ChromeCookieStore(server.apiUrl)
  const maybeAuthenticationCookie = await cookieStore.get("authentication")

  const authenticationCookie: chrome.cookies.Cookie =
    await maybeAuthenticationCookie
      .map(cookie => Promise.resolve(cookie))
      .orLazy(() => Promise.reject(AuthenticationTokenNotFoundException))

  const localStorage = new LocalStorage(chrome.storage.local)

  const maybeCredentials: Maybe<string> = await localStorage.get(StorageKey.ApiConfigurations)

  const existingApiConfigurations: object = JSON.parse(maybeCredentials.getOrElse("{}"))
  const apiConfiguration: ApiConfiguration = {
    serverUrl: server.apiUrl,
    authenticationToken: authenticationCookie.value
  }

  const updatedCredentials = { ...existingApiConfigurations, [server.name]: apiConfiguration }

  await localStorage.put(StorageKey.ApiConfigurations, JSON.stringify(updatedCredentials))
}

const run =
  async (apiServers: ApiServers) => {
    await initialiseServer(apiServers.production)
    await initialiseServer(apiServers.development)
  }

run(API_SERVERS)