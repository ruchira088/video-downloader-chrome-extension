import {VideoSite} from "../models/VideoSite"
import {videoExists, scheduleVideo} from "../services/VideoDownloaderApi"
import {Maybe} from "monet";
import PornOneVideoSiteHandler from "./PornOneVideoSiteHandler";

export interface VideoSiteHandler<A extends VideoSite> {
    videoSite: A

    isVideoPage: (document: Document) => boolean

    buttonContainer: (document: Document) => Maybe<HTMLElement>
}

export const videoSiteHandlers: VideoSiteHandler<VideoSite>[] =
    [PornOneVideoSiteHandler]

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
                    downloadButton.disabled = true
                    return
                } else {
                    downloadButton.textContent = "Download"
                    downloadButton.onclick = () => {
                        downloadButton.disabled = true

                        return scheduleVideo(url).then(() => addButtonFunctionality(downloadButton, url))
                    }
                }
            })
