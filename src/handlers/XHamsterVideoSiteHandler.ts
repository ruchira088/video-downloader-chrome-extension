import { VideoSiteHandler } from "./VideoSiteHandler"
import { VideoSite } from "../models/VideoSite"
import { Maybe } from "monet"

class XHamsterVideoSiteHandler implements VideoSiteHandler<VideoSite.XHamster> {
  buttonContainer(document: Document): Maybe<Element> {
    return Maybe.fromNull(document.querySelector(".controls"))
  }

  isVideoPage(document: Document): boolean {
    return Maybe.fromNull(document.getElementById("player-container")).isJust()
  }

  isMatch(url: URL): boolean {
    return url.toString().startsWith("https://xhamster.com/videos")
  }
}

export default new XHamsterVideoSiteHandler()
