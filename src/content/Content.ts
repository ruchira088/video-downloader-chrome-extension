import { Maybe } from "monet"
import prettyBytes from "pretty-bytes"
import { videoSiteHandlers } from "./handlers/VideoSiteHandler"
import videoDownloaderApi, { VideoDownloaderApi } from "./services/VideoDownloaderApi"

import "./styles/content.scss"
import LocalStorage from "../kv-store/LocalStorage"
import { SchedulingStatus } from "./models/ScheduledVideoDownload"

const DOWNLOAD_SECTION_ID = "video-downloader"
const FRONT_END_URL = "https://video.home.ruchij.com"


window.onload = () => {
  setInterval(() => run(document, window.location.href), 5000)
}

const run = (document: Document, url: string): Promise<Maybe<boolean>> => {
  return Maybe.fromNull(videoSiteHandlers.find((videoSiteHandler) => videoSiteHandler.isMatch(new URL(url)))).fold<
    Promise<Maybe<boolean>>
  >(Promise.resolve(Maybe.None()))((videoSiteHandler) => {
    if (videoSiteHandler.isVideoPage(document) && !hasDownloadSection(document, url)) {
      removeDownloadSectionIfExists(document)
      const [downloadSection, downloadButton] = createDownloadSection(document, url)
      downloadButton.disabled = true

      videoSiteHandler.buttonContainer(document).forEach((container) => container.appendChild(downloadSection))

      return initializeElements(downloadSection, downloadButton, url).then(() => Maybe.Some(true))
    } else {
      return Promise.resolve(Maybe.Some(false))
    }
  })
}

const removeDownloadSectionIfExists = (document: Document) =>
  Maybe.fromNull(document.getElementById(DOWNLOAD_SECTION_ID))
    .map((section) => {
      section.remove()
      return true
    })
    .orJust(false)

const hasDownloadSection = (document: Document, url: String): boolean =>
  Maybe.fromNull(document.getElementById(DOWNLOAD_SECTION_ID))
    .map((section) => section.dataset.url === url)
    .orJust(false)

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
  videoUrl: string
): Promise<void> => {
  try {
    const scheduledVideoDownloads = await api.searchScheduledVideosByUrl(videoUrl)
    const downloadedVideo = scheduledVideoDownloads.find(scheduledVideoDownload => scheduledVideoDownload.status === SchedulingStatus.Completed)

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

    return Promise.reject(
      new Error(
        Maybe.fromFalsy(errorMessages)
          .map((messages) => messages.join(", "))
          .orJust("Unknown error")
      )
    )
  }
}

export const initializeElements = (
  downloadSection: HTMLDivElement,
  downloadButton: HTMLButtonElement,
  url: string
): Promise<void> =>
  videoDownloaderApi(new LocalStorage(chrome.storage.local))
    .then((api) => initializeDownloadButton(api, downloadSection, downloadButton, url))
    .catch((error) => {
      downloadButton.textContent = "Error"
      downloadButton.disabled = true

      displayMessage(downloadSection, error)
    })

const displayMessage = (downloadSection: HTMLDivElement, message: string): HTMLElement => {
  const messageContainer = document.createElement("span")
  messageContainer.className = "message-board"
  messageContainer.textContent = message

  return downloadSection.appendChild(messageContainer)
}
