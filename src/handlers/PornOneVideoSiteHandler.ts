import { VideoSiteHandler } from "./VideoSiteHandler"
import { VideoSite } from "../models/VideoSite"
import { Maybe } from "monet"

export class PornOneVideoSiteHandler implements VideoSiteHandler<VideoSite.PornOne> {
  buttonContainer(document: Document): Maybe<Element> {
    return this.videoPlayer(document)
  }

  isVideoPage(document: Document): boolean {
    return this.videoPlayer(document).isJust()
  }

  videoPlayer(document: Document): Maybe<Element> {
    return Maybe.fromNull(document.getElementById("video_player"))
  }

  isMatch(url: URL): boolean {
    return url.hostname === "pornone.com"
  }
}

export default new PornOneVideoSiteHandler()
