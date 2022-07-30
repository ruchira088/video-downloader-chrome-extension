import { VideoSiteHandler } from "./VideoSiteHandler"
import { Maybe } from "monet"

class EPornerVideoSiteHandler implements VideoSiteHandler {
  buttonContainer(document: Document): Maybe<Element> {
    return this.videoPlayer(document)
  }

  isVideoPage(document: Document): boolean {
    return this.videoPlayer(document).isJust()
  }

  videoPlayer(document: Document): Maybe<Element> {
    return Maybe.fromFalsy(document.getElementById("video-info"))
  }

  isMatch(url: URL): boolean {
    return url.host === "www.eporner.com"
  }
}

export default new EPornerVideoSiteHandler()
