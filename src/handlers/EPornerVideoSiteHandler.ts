import { VideoSiteHandler } from "./VideoSiteHandler"
import { VideoSite } from "../models/VideoSite"
import { Maybe } from "monet"

export class EPornerVideoSiteHandler implements VideoSiteHandler<VideoSite.EPorner> {
  buttonContainer(document: Document): Maybe<HTMLElement> {
    return this.videoPlayer(document)
  }

  isVideoPage(document: Document): boolean {
    return this.videoPlayer(document).isJust()
  }

  videoPlayer(document: Document): Maybe<HTMLElement> {
    return Maybe.fromFalsy(document.getElementById("video-info"))
  }

  videoSite: VideoSite.EPorner = VideoSite.EPorner
}

export default new EPornerVideoSiteHandler()
