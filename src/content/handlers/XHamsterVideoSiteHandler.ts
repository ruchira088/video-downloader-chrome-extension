import { VideoSiteHandler } from "./VideoSiteHandler"

class XHamsterVideoSiteHandler implements VideoSiteHandler {
  buttonContainer(document: Document): HTMLElement | null {
    return document.querySelector(".controls")
  }

  isVideoPage(document: Document): boolean {
    return document.getElementById("player-container") != null
  }

  isMatch(url: URL): boolean {
    return url.toString().startsWith("https://xhamster.com/videos")
  }
}

export default new XHamsterVideoSiteHandler()
