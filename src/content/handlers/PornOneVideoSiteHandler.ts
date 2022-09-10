import { VideoSiteHandler } from "./VideoSiteHandler"
import { Maybe } from "monet"

class PornOneVideoSiteHandler implements VideoSiteHandler {
  buttonContainer(document: Document): Maybe<Element> {
    return this.videoPlayer(document).flatMap(element => Maybe.fromNull(element.parentElement))
  }

  isVideoPage(document: Document): boolean {
    return this.videoPlayer(document).isJust()
  }

  videoPlayer(document: Document): Maybe<Element> {
    return Maybe.fromNull(document.getElementById("pornone-video-player"))
  }

  isMatch(url: URL): boolean {
    return url.hostname === "pornone.com"
  }
}

export default new PornOneVideoSiteHandler()
