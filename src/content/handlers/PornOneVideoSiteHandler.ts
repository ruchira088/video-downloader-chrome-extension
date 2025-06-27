import { VideoSiteHandler } from "./VideoSiteHandler"
import { map } from "../../helpers/TypeUtils"

class PornOneVideoSiteHandler implements VideoSiteHandler {
  buttonContainer(document: Document): HTMLElement | null {
    return map(this.videoPlayer(document), element => element.parentElement) ?? null
  }

  isVideoPage(document: Document): boolean {
    return this.videoPlayer(document) != null
  }

  videoPlayer(document: Document): HTMLElement | null {
    return document.getElementById("pornone-video-player")
  }

  isMatch(url: URL): boolean {
    return url.hostname === "pornone.com"
  }
}

export default new PornOneVideoSiteHandler()
