import {VideoSite} from "../models/VideoSite"
import {scheduleVideo, videoExists} from "../services/VideoDownloaderApi"
import {Maybe} from "monet";
import pornOneVideoSiteHandler from "./PornOneVideoSiteHandler";

export interface VideoSiteHandler<A extends VideoSite> {
    videoSite: A

    isVideoPage: (document: Document) => boolean

    buttonContainer: (document: Document) => Maybe<HTMLElement>
}

export const videoSiteHandlers: VideoSiteHandler<VideoSite>[] =
    [pornOneVideoSiteHandler]

export const createButton =
    (document: Document): HTMLButtonElement => {
        const downloadButton = document.createElement("button")
        downloadButton.id = "download-video-button"
        downloadButton.textContent = "Checking"

        return downloadButton
    }

export const addButtonFunctionality =
    (downloadButton: HTMLButtonElement, url: string): Promise<void> =>
        videoExists(url)
            .then(exists => {
                if (exists) {
                    downloadButton.textContent = "Already scheduled"
                    return
                } else {
                    downloadButton.textContent = "Download"
                    downloadButton.disabled = false

                    downloadButton.onclick = () => {
                        downloadButton.disabled = true

                        return scheduleVideo(url).then(() => addButtonFunctionality(downloadButton, url))
                    }
                }
            })
            .catch(({errorMessages}: { errorMessages: string[] | undefined }) => {
                downloadButton.textContent = "Error"

                const errorSection = document.createElement("span")
                errorSection.style.marginLeft = "1em"
                errorSection.textContent =
                    Maybe.fromFalsy(errorMessages).map(messages => messages.join(", ")).orJust("Unknown error")

                Maybe.fromFalsy(downloadButton.parentElement).forEach(parent => parent.appendChild(errorSection))
            })
