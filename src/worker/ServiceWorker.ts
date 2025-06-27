import ChromeCookieStore from "./cookie/CookieStore"
import LocalStorage from "../kv-store/LocalStorage"
import { StorageKey } from "../kv-store/StorageKey"
import { ApiConfiguration, ApiConfigurations } from "../models/ApiConfiguration"
import { API_SERVERS, ApiName, ApiServers, Server } from "../models/Server"
import { map } from "../helpers/TypeUtils"
import { zodParse } from "../models/Zod"
import Cookie = chrome.cookies.Cookie

const initialiseServer = async (server: Server) => {
  const cookieStore = new ChromeCookieStore(server.apiUrl)

  const authenticationCookie: Cookie | null =
    await cookieStore.get(server.authenticationCookieName)

  if (authenticationCookie == null) {
    throw new Error(`Authentication token not found for ${server.name}`)
  }

  const localStorage = new LocalStorage(chrome.storage.local)

  const apiConfigurationsString: string | null = await localStorage.get(StorageKey.ApiConfigurations)

  const existingApiConfigurations: ApiConfigurations | {} =
    map(apiConfigurationsString, stringValue => zodParse(ApiConfigurations, JSON.parse(stringValue))) ?? {}

  const apiConfiguration: ApiConfiguration = ApiConfiguration.parse({
    serverUrl: server.apiUrl,
    authenticationToken: authenticationCookie.value
  })

  const updatedApiServers = zodParse(ApiServers, ({ ...existingApiConfigurations, [server.name]: apiConfiguration }))

  await localStorage.put(StorageKey.ApiConfigurations, JSON.stringify(updatedApiServers))
}

const run =
  async (apiServers: ApiServers) => {
    await initialiseServer(apiServers.production).catch(console.error)

    if (apiServers.fallback != null) {
      await initialiseServer(apiServers[ApiName.Fallback]).catch(console.error)
    }
  }

setInterval(() => run(API_SERVERS), 30_000)