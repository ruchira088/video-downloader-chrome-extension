import { VideoSiteHandler } from "./VideoSiteHandler"
import { VideoSite } from "../models/VideoSite"
import { Maybe } from "monet"

export class EPornerVideoSiteHandler implements VideoSiteHandler<VideoSite.EPorner> {
  buttonContainer(document: Document): Maybe<Element> {
    return this.videoPlayer(document)
  }

  isVideoPage(document: Document): boolean {
    return this.videoPlayer(document).isJust()
  }

  videoPlayer(document: Document): Maybe<Element> {
    return Maybe.fromFalsy(document.getElementById("video-info"))
  }

  videoSite: string = "www.eporner.com"
}

export default new EPornerVideoSiteHandler()
