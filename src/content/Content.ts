import prettyBytes from "pretty-bytes"
import { VideoSiteHandler, videoSiteHandlers } from "./handlers/VideoSiteHandler"
import { createVideoDownloaderApi, VideoDownloaderApi } from "./services/VideoDownloaderApi"

import "./styles/content.scss"
import LocalStorage from "../kv-store/LocalStorage"
import { ScheduledVideoDownload, SchedulingStatus } from "./models/ScheduledVideoDownload"
import { map } from "../helpers/TypeUtils"
import { Message, MessageType } from "../models/Message"
import { zodParse } from "../models/Zod"
import { VideoMetadata } from "./models/VideoMetadata"

const DOWNLOAD_SECTION_ID = "video-downloader"
const FRONT_END_URL = "https://video.home.ruchij.com"

const initialise = () => {
  console.debug("Initializing content script for video downloader")

  chrome.runtime.onMessage.addListener(async (incomingMessage) => {
    console.debug("Received message", incomingMessage)

    const message: Message = zodParse(Message, incomingMessage)

    if (message.type === MessageType.DownloadVideo) {
      const videoDownloaderApi = await createVideoDownloaderApiWithNotifications()
      await videoDownloaderApi.scheduleVideoDownload(message.videoUrl)
    }
  })

  setInterval(() => run(document, window.location.href), 5000)
}

const run = async (document: Document, url: string): Promise<boolean> => {
  const videoSiteHandler: VideoSiteHandler | undefined = videoSiteHandlers.find((videoSiteHandler) =>
    videoSiteHandler.isMatch(new URL(url)),
  )

  if (videoSiteHandler === undefined) {
    return false
  }

  if (videoSiteHandler.isVideoPage(document) && !downloadSectionExistsForUrl(document, url)) {
    removeDownloadSectionIfExists(document)
    const [downloadSection, downloadButton] = createDownloadSection(document, url)
    const buttonContainer: Element | null = videoSiteHandler.buttonContainer(document)
    downloadButton.disabled = true

    if (buttonContainer === null) {
      return false
    }

    buttonContainer.appendChild(downloadSection)

    await initializeElements(downloadSection, downloadButton, url)
    return true
  } else {
    return false
  }
}

const removeDownloadSectionIfExists = (document: Document): boolean => {
  const downloadSection: HTMLElement | null = document.getElementById(DOWNLOAD_SECTION_ID)

  if (downloadSection === null) {
    return false
  }

  downloadSection.remove()
  return true
}

const downloadSectionExistsForUrl = (document: Document, url: String): boolean => {
  const downloadSection: HTMLElement | null = document.getElementById(DOWNLOAD_SECTION_ID)

  if (downloadSection === null) {
    return false
  }

  return downloadSection.dataset.url === url
}

export const createDownloadSection = (document: Document, url: string): [HTMLDivElement, HTMLButtonElement] => {
  const downloadSection = document.createElement("div")
  const downloadButton = document.createElement("button")

  downloadSection.id = DOWNLOAD_SECTION_ID
  downloadSection.dataset.url = url
  downloadSection.appendChild(downloadButton)

  downloadButton.textContent = "Checking"
  downloadButton.className = "checking"

  return [downloadSection, downloadButton]
}

const initializeDownloadButton = async (
  api: VideoDownloaderApi,
  downloadSection: HTMLDivElement,
  downloadButton: HTMLButtonElement,
  videoUrl: string,
): Promise<void> => {
  try {
    const scheduledVideoDownloads = await api.searchScheduledVideosByUrl(videoUrl)
    const downloadedVideo = scheduledVideoDownloads.find(
      (scheduledVideoDownload) => scheduledVideoDownload.status === SchedulingStatus.Completed,
    )

    if (downloadedVideo != undefined) {
      downloadButton.textContent = "Go to video"
      downloadButton.className = "completed"
      downloadButton.disabled = false

      downloadButton.onclick = () => {
        const url = `${FRONT_END_URL}/video/${downloadedVideo.videoMetadata.id}`
        window.open(url, "_blank")
      }
    } else if (scheduledVideoDownloads.length > 0) {
      downloadButton.textContent = "Scheduled"
      downloadButton.className = "scheduled"
      downloadButton.disabled = true
    } else {
      const downloadIcon = chrome.runtime.getURL("images/download-icon.svg")
      // downloadButton.style.backgroundImage = `url('${downloadIcon}')`

      downloadButton.onclick = async () => {
        downloadButton.disabled = true

        await api.scheduleVideoDownload(videoUrl)
        await initializeDownloadButton(api, downloadSection, downloadButton, videoUrl)
      }

      downloadButton.textContent = "Fetching metadata..."
      const videoMetadata = await api.gatherVideoMetadata(videoUrl)

      if (videoMetadata.size > 0) {
        displayMessage(downloadSection, prettyBytes(videoMetadata.size))
      }

      downloadButton.textContent = "Download"
      downloadButton.className = "download"
      downloadButton.disabled = false
    }
  } catch (error) {
    const { errorMessages } = error as { errorMessages: string[] | undefined }

    return Promise.reject(new Error(map(errorMessages, (messages) => messages.join(", ")) ?? "Unknown error"))
  }
}

export const initializeElements = async (
  downloadSection: HTMLDivElement,
  downloadButton: HTMLButtonElement,
  url: string,
): Promise<void> => {
  try {
    const videoDownloaderApi = await createVideoDownloaderApiWithNotifications()
    await initializeDownloadButton(videoDownloaderApi, downloadSection, downloadButton, url)
  } catch (error) {
    downloadButton.textContent = "Error"
    downloadButton.disabled = true

    displayMessage(downloadSection, error?.toString() ?? "Unknown error")
  }
}

const createVideoDownloaderApiWithNotifications = async (): Promise<VideoDownloaderApi> => {
  const localStorage: LocalStorage = new LocalStorage(chrome.storage.local)
  const videoDownloaderApi: VideoDownloaderApi = await createVideoDownloaderApi(localStorage)

  return new VideoDownloaderApiWithNotifications(videoDownloaderApi)
}

const displayMessage = (downloadSection: HTMLDivElement, message: string): HTMLElement => {
  const messageContainer = document.createElement("span")
  messageContainer.className = "message-board"
  messageContainer.textContent = message

  return downloadSection.appendChild(messageContainer)
}

enum NotificationType {
  Success = "success",
  Error = "error",
  Info = "info",
  Warning = "warning",
}

const notificationToast = (message: string, notificationType: NotificationType) => {
  const toast = document.createElement("div")
  toast.className = `toast ${notificationType}`
  toast.textContent = message

  document.body.appendChild(toast)

  setTimeout(() => toast.remove(), 2_975)
}

class VideoDownloaderApiWithNotifications implements VideoDownloaderApi {
  constructor(private readonly videoDownloaderApi: VideoDownloaderApi) {}

  gatherVideoMetadata(videoUrl: string): Promise<VideoMetadata> {
    return this.videoDownloaderApi.gatherVideoMetadata(videoUrl)
  }

  async scheduleVideoDownload(videoUrl: string): Promise<number> {
    try {
      const statusCode: number = await this.videoDownloaderApi.scheduleVideoDownload(videoUrl)

      if (statusCode === 200) {
        notificationToast(`Already scheduled: ${videoUrl}`, NotificationType.Info)
      } else if (statusCode === 201) {
        notificationToast(`Scheduled: ${videoUrl}`, NotificationType.Success)
      } else {
        throw new Error(`Unexpected status code: ${statusCode}`)
      }

      return statusCode
    } catch (error) {
      if (error instanceof Response) {
        const jsonBody = await error.json()

        notificationToast(
          `Error occurred scheduling videoUrl=${videoUrl}\n${JSON.stringify(jsonBody, null, 2)}`,
          error.status < 500 ? NotificationType.Warning : NotificationType.Error,
        )

        return error.status
      }

      throw error
    }
  }

  searchScheduledVideosByUrl(videoUrl: string): Promise<ScheduledVideoDownload[]> {
    return this.videoDownloaderApi.searchScheduledVideosByUrl(videoUrl)
  }
}

initialise()
