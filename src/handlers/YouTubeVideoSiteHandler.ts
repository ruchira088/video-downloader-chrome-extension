import { VideoSiteHandler } from "./VideoSiteHandler"
import { VideoSite } from "../models/VideoSite"
import { Maybe } from "monet"

class YouTubeVideoSiteHandler implements VideoSiteHandler<VideoSite.YouTube> {
  buttonContainer(document: Document): Maybe<Element> {
    return Maybe.fromNull(document.getElementById("messages"))
  }

  isVideoPage(document: Document): boolean {
    return document.getElementById("ytd-player") != null
  }

  isMatch(url: URL): boolean {
    return url.toString().startsWith("https://www.youtube.com/watch")
  }
}

export default new YouTubeVideoSiteHandler()
