import { VideoSiteHandler } from "./VideoSiteHandler"

class SxyPrnVideoSiteHandler implements VideoSiteHandler {
  buttonContainer(document: Document): HTMLElement | null {
    return this.videoPlayer(document)
  }

  isVideoPage(document: Document): boolean {
    return this.videoPlayer(document) != null
  }

  videoPlayer(document: Document): HTMLElement | null {
    return document.getElementById("vid_container_id")
  }

  isMatch(url: URL): boolean {
    return url.host === "sxyprn.com"
  }
}

export default new SxyPrnVideoSiteHandler()