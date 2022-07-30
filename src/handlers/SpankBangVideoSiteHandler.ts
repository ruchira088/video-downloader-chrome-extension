import { VideoSiteHandler } from "./VideoSiteHandler"
import { Maybe } from "monet"

class SpankBangVideoSiteHandler implements VideoSiteHandler {
  buttonContainer(document: Document): Maybe<Element> {
    return Maybe.fromNull(document.getElementById("player_wrapper_outer"))
  }

  isVideoPage(document: Document): boolean {
    return Maybe.fromNull(document.getElementById("video")).isJust()
  }

  isMatch(url: URL): boolean {
    return url.hostname === "spankbang.com"
  }
}

export default new SpankBangVideoSiteHandler()
