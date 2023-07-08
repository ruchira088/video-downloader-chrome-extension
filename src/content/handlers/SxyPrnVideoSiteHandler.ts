import { VideoSiteHandler } from "./VideoSiteHandler"
import { Maybe } from "monet"

class SxyPrnVideoSiteHandler implements VideoSiteHandler {
  buttonContainer(document: Document): Maybe<Element> {
    return this.videoPlayer(document)
  }

  isVideoPage(document: Document): boolean {
    return this.videoPlayer(document).isJust()
  }

  videoPlayer(document: Document): Maybe<Element> {
    return Maybe.fromFalsy(document.getElementById("vid_container_id"))
  }

  isMatch(url: URL): boolean {
    return url.host === "sxyprn.com"
  }
}

export default new SxyPrnVideoSiteHandler()