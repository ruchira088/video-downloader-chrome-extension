import { Maybe } from "monet"
import prettyBytes from "pretty-bytes"
import { videoSiteHandlers } from "../handlers/VideoSiteHandler"
import videoDownloaderApi, { VideoDownloaderApi } from "../services/VideoDownloaderApi"
import { VideoMetadata } from "../models/VideoMetadata"

window.onload = () => {
  const url = window.location.href

  Maybe.fromNull(
    videoSiteHandlers.find((videoSiteHandler) => url.startsWith(`https://${videoSiteHandler.videoSite.toLowerCase()}`))
  ).forEach((videoSiteHandler) => {
    if (videoSiteHandler.isVideoPage(document)) {
      const downloadButton = createButton(document)
      downloadButton.disabled = true

      videoSiteHandler.buttonContainer(document).forEach((container) => container.appendChild(downloadButton))

      initializeElements(downloadButton, url)
    }
  })
}

export const createButton = (document: Document): HTMLButtonElement => {
  const downloadButton = document.createElement("button")
  downloadButton.id = "download-video-button"
  downloadButton.textContent = "Checking"

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
