import { VideoSiteHandler } from "./VideoSiteHandler"
import { VideoSite } from "../models/VideoSite"
import { Maybe } from "monet"

export class XFreeHdVideoSiteHandler implements VideoSiteHandler<VideoSite.XFreeHD> {
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
