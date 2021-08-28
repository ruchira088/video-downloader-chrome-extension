import { Maybe } from "monet"
import prettyBytes from "pretty-bytes"
import { videoSiteHandlers } from "../handlers/VideoSiteHandler"
import videoDownloaderApi, { VideoDownloaderApi } from "../services/VideoDownloaderApi"
import { VideoMetadata } from "../models/VideoMetadata"

const DOWNLOAD_SECTION_ID = "video-downloader-download-section"

window.onload = () => {
  setInterval(() => run(document, window.location.href), 5000)
}

const run = (document: Document, url: string): Promise<Maybe<boolean>> =>
  Maybe.fromNull(videoSiteHandlers.find((videoSiteHandler) => url.startsWith(`https://${videoSiteHandler.videoSite.toLowerCase()}`)))
    .fold<Promise<Maybe<boolean>>>(Promise.resolve(Maybe.None()))(videoSiteHandler => {
      if (videoSiteHandler.isVideoPage(document) && !alreadyHasDownloadSection(document, url)) {
        removeDownloadSectionIfExists(document)
        const [downloadSection, downloadButton] = createDownloadSection(document, url)
        downloadButton.disabled = true

        videoSiteHandler.buttonContainer(document)
          .forEach((container) => container.appendChild(downloadSection))

        return initializeElements(downloadSection, downloadButton, url).then(() => Maybe.Some(true))
      } else {
        return Promise.resolve(Maybe.Some(false))
      }
  })

const removeDownloadSectionIfExists =
  (document: Document) =>
    Maybe.fromNull(document.getElementById(DOWNLOAD_SECTION_ID))
      .map(section => {
        section.remove()
        return true
      })
      .orJust(false)

const alreadyHasDownloadSection = (document: Document, url: String): boolean =>
  Maybe.fromNull(document.getElementById(DOWNLOAD_SECTION_ID))
    .map(section => section.dataset.url === url)
    .orJust(false)

export const createDownloadSection = (document: Document, url: string): [HTMLDivElement, HTMLButtonElement] => {
  const downloadSection = document.createElement("div")
  const downloadButton = document.createElement("button")

  downloadSection.id = DOWNLOAD_SECTION_ID
  downloadSection.dataset.url = url
  downloadSection.appendChild(downloadButton)

  downloadButton.textContent = "Checking"

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
        downloadButton.disabled = true
        return Promise.resolve()
      } else {
        downloadButton.textContent = "Download"
        downloadButton.disabled = false

        downloadButton.onclick = () => {
          downloadButton.disabled = true

          return api.scheduleVideoDownload(videoUrl)
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

export const initializeElements = (downloadSection: HTMLDivElement, downloadButton: HTMLButtonElement, url: string): Promise<void> =>
  videoDownloaderApi()
    .then((api) => initializeDownloadButton(api, downloadSection, downloadButton, url))
    .catch((error) => {
      downloadButton.textContent = "Error"
      downloadButton.disabled = true

      displayMessage(downloadSection, error)
    })

const displayMessage = (downloadSection: HTMLDivElement, message: string): HTMLElement => {
  const messageContainer = document.createElement("span")

  messageContainer.style.marginLeft = "1em"
  messageContainer.style.color = "white"
  messageContainer.style.backgroundColor = "grey"
  messageContainer.style.padding = "0.2em"
  messageContainer.style.borderRadius = "0.2em"
  messageContainer.textContent = message

  return downloadSection.appendChild(messageContainer)
}
