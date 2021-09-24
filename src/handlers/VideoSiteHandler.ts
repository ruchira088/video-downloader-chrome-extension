import { VideoSite } from "../models/VideoSite"
import { Maybe } from "monet"
import PornOneVideoSiteHandler from "./PornOneVideoSiteHandler"
import SpankBangVideoSiteHandler from "./SpankBangVideoSiteHandler"
import EPornerVideoSiteHandler from "./EPornerVideoSiteHandler"
import YouTubeVideoSiteHandler from "./YouTubeVideoSiteHandler"
import XHamsterVideoSiteHandler from "./XHamsterVideoSiteHandler"
import OtherVideoSitesHandler from "./OtherVideoSitesHandler"

export interface VideoSiteHandler<A extends VideoSite> {
  isMatch: (url: URL) => boolean

  isVideoPage: (document: Document) => boolean

  buttonContainer: (document: Document) => Maybe<Element>
}

export const videoSiteHandlers: VideoSiteHandler<VideoSite>[] = [
  PornOneVideoSiteHandler,
  SpankBangVideoSiteHandler,
  EPornerVideoSiteHandler,
  YouTubeVideoSiteHandler,
  XHamsterVideoSiteHandler,
  OtherVideoSitesHandler
]
