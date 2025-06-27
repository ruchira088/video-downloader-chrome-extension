import { VideoSiteHandler } from "./VideoSiteHandler"

class EPornerVideoSiteHandler implements VideoSiteHandler {
  buttonContainer(document: Document): HTMLElement | null {
    return this.videoPlayer(document)
  }

  isVideoPage(document: Document): boolean {
    return this.videoPlayer(document) != null
  }

  videoPlayer(document: Document): HTMLElement | null {
    return document.getElementById("video-info")
  }

  isMatch(url: URL): boolean {
    return url.host === "www.eporner.com"
  }
}

export default new EPornerVideoSiteHandler()
