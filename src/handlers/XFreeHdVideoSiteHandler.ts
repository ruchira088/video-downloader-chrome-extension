import { VideoSiteHandler } from "./VideoSiteHandler"
import { Maybe } from "monet"

class XFreeHdVideoSiteHandler implements VideoSiteHandler {
  buttonContainer(document: Document): Maybe<Element> {
    return this.videoPlayer(document)
  }

  isMatch(url: URL): boolean {
    return url.toString().startsWith("https://www.xfreehd.com/video")
  }

  isVideoPage(document: Document): boolean {
    return this.videoPlayer(document).isJust()
  }

  videoPlayer(document: Document): Maybe<Element> {
    return Maybe.fromNull(document.querySelector(".video-container"))
  }
}

export default new XFreeHdVideoSiteHandler()
