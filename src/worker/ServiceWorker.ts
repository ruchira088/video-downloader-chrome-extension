import ChromeCookieStore from "./cookie/CookieStore"
import LocalStorage from "../kv-store/LocalStorage"
import { StorageKey } from "../kv-store/StorageKey"
import { Maybe } from "monet"
import { ApiConfiguration } from "../models/ApiConfiguration"
import { API_SERVERS, ApiServers, Server } from "../models/Server"
import Cookie = chrome.cookies.Cookie

const initialiseServer = async (server: Server) => {
  const cookieStore = new ChromeCookieStore(server.apiUrl)

  const maybeAuthenticationCookie = await cookieStore.get(server.authenticationCookieName)

  const authenticationCookie: Cookie =
    await maybeAuthenticationCookie
      .map(cookie => Promise.resolve(cookie))
      .orLazy(() => Promise.reject(new Error(`Authentication token not found for ${server.name}`)))

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
    await initialiseServer(apiServers.production).catch(console.error)

    if (apiServers.productionFallback != undefined) {
      await initialiseServer(apiServers.productionFallback).catch(console.error)
    }
  }

run(API_SERVERS)