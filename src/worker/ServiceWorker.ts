import ChromeCookieStore from "./cookie/CookieStore"
import LocalStorage from "../kv-store/LocalStorage"
import { StorageKey } from "../kv-store/StorageKey"
import { ApiConfiguration, ApiConfigurations } from "../models/ApiConfiguration"
import { API_SERVERS, ApiName, ApiServers, Server } from "../models/Server"
import { filter, map } from "../helpers/TypeUtils"
import { zodParse } from "../models/Zod"
import { DownloadVideo } from "../models/Message"
import Cookie = chrome.cookies.Cookie
import Tab = chrome.tabs.Tab

const initialiseServer = async (server: Server) => {
  const cookieStore = new ChromeCookieStore(server.apiUrl)

  const authenticationCookie: Cookie | null = await cookieStore.get(server.authenticationCookieName)

  if (authenticationCookie == null) {
    throw new Error(`Authentication token not found for ${server.name}`)
  }

  const localStorage = new LocalStorage(chrome.storage.local)

  const apiConfigurationsString: string | null = await localStorage.get(StorageKey.ApiConfigurations)

  const existingApiConfigurations: ApiConfigurations | {} =
    map(
      filter(apiConfigurationsString, (value) => value?.trim() !== ""),
      (stringValue) => zodParse(ApiConfigurations, JSON.parse(stringValue)),
    ) ?? {}

  const apiConfiguration: ApiConfiguration = ApiConfiguration.parse({
    serverUrl: server.apiUrl,
    authenticationToken: authenticationCookie.value,
  })

  const updatedApiServers = zodParse(ApiConfigurations, {
    ...existingApiConfigurations,
    [server.name]: apiConfiguration,
  })

  await localStorage.put(StorageKey.ApiConfigurations, JSON.stringify(updatedApiServers))
}

const downloadVideoFromUrl = async (videoUrl: string, tab?: Tab) => {
  if (tab?.id != null) {
    await chrome.tabs.sendMessage(tab.id, DownloadVideo.parse({ videoUrl }))
  } else {
    throw new Error(`Tab ID is undefined: ${tab}`)
  }
}

const init = () => {
  chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.onClicked.addListener(async (info, tab) => {
      try {
        if (info.menuItemId === "download-page-url") {
          const videoUrl = info.pageUrl

          if (videoUrl != null) {
            await downloadVideoFromUrl(videoUrl, tab)
          } else {
            throw new Error(`Page URL not found: ${info}`)
          }
        } else if (info.menuItemId === "download-link-url") {
          const videoUrl = info.linkUrl

          if (videoUrl != null) {
            await downloadVideoFromUrl(videoUrl, tab)
          } else {
            throw new Error(`Link URL not found: ${info}`)
          }
        } else {
          throw new Error(`Unknown menu item clicked: ${info}`)
        }
      } catch (error) {
        console.error(error)
      }
    })

    chrome.contextMenus.create({
      id: "download-page-url",
      title: "Download Page Video",
      contexts: ["page"],
    })

    chrome.contextMenus.create({
      id: "download-link-url",
      title: "Download Video in Link",
      contexts: ["link"],
    })
  })
}

const run = async (apiServers: ApiServers) => {
  await initialiseServer(apiServers.production).catch(console.error)

  if (apiServers.fallback != null) {
    await initialiseServer(apiServers[ApiName.Fallback]).catch(console.error)
  }
}

init()
setInterval(() => run(API_SERVERS), 30_000)
