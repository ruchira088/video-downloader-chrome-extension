import { Maybe } from "monet"
import prettyBytes from "pretty-bytes"
import { videoSiteHandlers } from "../handlers/VideoSiteHandler"
import videoDownloaderApi, { VideoDownloaderApi } from "../services/VideoDownloaderApi"
import { VideoMetadata } from "../models/VideoMetadata"

const DOWNLOAD_BUTTON_ID = "video-downloader-download-button"

window.onload = () => {
  setInterval(() => run(document, window.location.href), 5000)
}

const run = (document: Document, url: string): Promise<Maybe<boolean>> =>
  Maybe.fromNull(videoSiteHandlers.find((videoSiteHandler) => url.startsWith(`https://${videoSiteHandler.videoSite.toLowerCase()}`)))
    .fold<Promise<Maybe<boolean>>>(Promise.resolve(Maybe.None()))(videoSiteHandler => {
      if (videoSiteHandler.isVideoPage(document) && !alreadyHasDownloadButton(document, url)) {
        removeDownloadButtonIfExists(document)
        const downloadButton = createButton(document, url)
        downloadButton.disabled = true

        videoSiteHandler.buttonContainer(document).forEach((container) => container.appendChild(downloadButton))

        return initializeElements(downloadButton, url).then(() => Maybe.Some(true))
      } else {
        return Promise.resolve(Maybe.Some(false))
      }
  })

const removeDownloadButtonIfExists =
  (document: Document) =>
    Maybe.fromNull(document.getElementById(DOWNLOAD_BUTTON_ID))
      .map(button => {
        button.remove()
        return true
      })
      .orJust(false)

const alreadyHasDownloadButton = (document: Document, url: String): boolean =>
  Maybe.fromNull(document.getElementById(DOWNLOAD_BUTTON_ID))
    .map(button => button.dataset.url === url)
    .orJust(false)

export const createButton = (document: Document, url: string): HTMLButtonElement => {
  const downloadButton = document.createElement("button")
  downloadButton.id = DOWNLOAD_BUTTON_ID
  downloadButton.textContent = "Checking"
  downloadButton.dataset.url = url

  return downloadButton
}

const initializeDownloadButton = (
  api: VideoDownloaderApi,
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

          return api.scheduleVideoDownload(videoUrl).then(() => initializeDownloadButton(api, downloadButton, videoUrl))
        }

        return api.gatherVideoMetadata(videoUrl).then((videoMetadata: VideoMetadata) => {
          displayMessage(downloadButton, prettyBytes(videoMetadata.size))
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

export const initializeElements = (downloadButton: HTMLButtonElement, url: string): Promise<void> =>
  videoDownloaderApi()
    .then((api) => initializeDownloadButton(api, downloadButton, url))
    .catch((error) => {
      downloadButton.textContent = "Error"
      downloadButton.disabled = true

      displayMessage(downloadButton, error)
    })

const displayMessage = (downloadButton: HTMLButtonElement, message: string): Maybe<HTMLElement> => {
  const messageContainer = document.createElement("span")

  messageContainer.style.marginLeft = "1em"
  messageContainer.style.color = "white"
  messageContainer.style.backgroundColor = "grey"
  messageContainer.style.padding = "0.2em"
  messageContainer.style.borderRadius = "0.2em"
  messageContainer.textContent = message

  return Maybe.fromFalsy(downloadButton.parentElement).map((parent) => parent.appendChild(messageContainer))
}
