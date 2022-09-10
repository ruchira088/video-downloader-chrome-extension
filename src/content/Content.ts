import { Maybe } from "monet"
import prettyBytes from "pretty-bytes"
import { videoSiteHandlers } from "./handlers/VideoSiteHandler"
import videoDownloaderApi, { VideoDownloaderApi } from "./services/VideoDownloaderApi"
import { VideoMetadata } from "./models/VideoMetadata"

import "./styles/content.scss"
import LocalStorage from "../kv-store/LocalStorage"

const DOWNLOAD_SECTION_ID = "video-downloader"

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

const initializeDownloadButton = (
  api: VideoDownloaderApi,
  downloadSection: HTMLDivElement,
  downloadButton: HTMLButtonElement,
  videoUrl: string
): Promise<void> =>
  api
    .videoExistsByUrl(videoUrl)
    .then((exists) => {
      if (exists) {
        downloadButton.textContent = "Already scheduled"
        downloadButton.className = "scheduled"
        downloadButton.disabled = true

        return Promise.resolve()
      } else {
        downloadButton.textContent = "Download"
        downloadButton.className = "download"
        downloadButton.disabled = false

        const downloadIcon = chrome.runtime.getURL("images/download-icon.svg")
        // downloadButton.style.backgroundImage = `url('${downloadIcon}')`

        downloadButton.onclick = () => {
          downloadButton.disabled = true

          return api
            .scheduleVideoDownload(videoUrl)
            .then(() => initializeDownloadButton(api, downloadSection, downloadButton, videoUrl))
        }

        return api.gatherVideoMetadata(videoUrl).then((videoMetadata: VideoMetadata) => {
          displayMessage(downloadSection, prettyBytes(videoMetadata.size))
          return Promise.resolve()
        })
      }
    })
    .catch(({ errorMessages }: { errorMessages: string[] | undefined }) =>
      Promise.reject(
        new Error(
          Maybe.fromFalsy(errorMessages)
            .map((messages) => messages.join(", "))
            .orJust("Unknown error")
        )
      )
    )

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
