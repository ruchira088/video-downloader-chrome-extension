import { Maybe } from "monet"
import videoSites from "./config/other-video-sites.json"
import { VideoSiteHandler } from "./VideoSiteHandler"
import { VideoSite } from "../models/VideoSite"

export class OtherVideoSitesHandler implements VideoSiteHandler<VideoSite.Other> {
  buttonContainer(document: Document): Maybe<Element> {
    return Maybe.fromNull(document.querySelector("body")).map((body) => {
      const container = document.createElement("div")
      body.prepend(container)

      return container
    })
  }

  isVideoPage(document: Document): boolean {
    return this.videoPlayer(document).isJust()
  }

  videoPlayer(document: Document): Maybe<HTMLVideoElement> {
    return Maybe.fromNull(document.querySelector<HTMLVideoElement>("video"))
  }

  isMatch(url: URL): boolean {
    return Maybe.fromNull(videoSites.find((hostname) => url.host.includes(hostname.toLowerCase()))).isJust()
  }
}

export default new OtherVideoSitesHandler()
