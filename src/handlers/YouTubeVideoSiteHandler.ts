import { VideoSiteHandler } from "./VideoSiteHandler"
import { VideoSite } from "../models/VideoSite"
import { Maybe } from "monet"

class YouTubeVideoSiteHandler implements VideoSiteHandler<VideoSite.YouTube> {
  buttonContainer(document: Document): Maybe<Element> {
    return this.videoPlayer(document);
  }

  isVideoPage(document: Document): boolean {
    return this.videoPlayer(document).isJust();
  }

  videoPlayer(document: Document): Maybe<Element>  {
    return Maybe.fromNull(document.getElementById("ytd-player"))
  }

  videoSite: string = "www.youtube.com/watch"
}

export default new YouTubeVideoSiteHandler()