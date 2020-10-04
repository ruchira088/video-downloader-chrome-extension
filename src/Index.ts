import {addButtonFunctionality, createButton, videoSiteHandlers} from "./handlers/VideoSiteHandler";
import {Maybe} from "monet";

window.onload = () => {
    const url = window.location.href;

    Maybe.fromNull(videoSiteHandlers.find(videoSiteHandler => url.startsWith(`https://${videoSiteHandler.videoSite.toLowerCase()}`)))
        .forEach(videoSiteHandler => {
            if (videoSiteHandler.isVideoPage(document)) {
                const downloadButton = createButton(document)
                downloadButton.disabled = true

                videoSiteHandler.buttonContainer(document).forEach(container => container.appendChild(downloadButton))

                addButtonFunctionality(downloadButton, url)
            }
        })
}

