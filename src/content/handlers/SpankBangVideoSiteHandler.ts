import { VideoSiteHandler } from "./VideoSiteHandler"

class SpankBangVideoSiteHandler implements VideoSiteHandler {
  buttonContainer(document: Document): HTMLElement | null {
    return document.getElementById("player_wrapper_outer")
  }

  isVideoPage(document: Document): boolean {
    return document.getElementById("video") != null
  }

  isMatch(url: URL): boolean {
    return url.hostname === "spankbang.com"
  }
}

export default new SpankBangVideoSiteHandler()
