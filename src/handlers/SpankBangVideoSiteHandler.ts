import { VideoSiteHandler } from "./VideoSiteHandler"
import { VideoSite } from "../models/VideoSite"
import { Maybe } from "monet"

export class SpankBangVideoSiteHandler implements VideoSiteHandler<VideoSite.SpankBang> {
  buttonContainer(document: Document): Maybe<Element> {
    return Maybe.fromNull(document.getElementById("player_wrapper_outer"))
  }

  isVideoPage(document: Document): boolean {
    return Maybe.fromNull(document.getElementById("video")).isJust()
  }

  videoSite: string = "spankbang.com"
}

export default new SpankBangVideoSiteHandler()
