import { Maybe } from "monet"
import PornOneVideoSiteHandler from "./PornOneVideoSiteHandler"
import SpankBangVideoSiteHandler from "./SpankBangVideoSiteHandler"
import EPornerVideoSiteHandler from "./EPornerVideoSiteHandler"
import YouTubeVideoSiteHandler from "./YouTubeVideoSiteHandler"
import XHamsterVideoSiteHandler from "./XHamsterVideoSiteHandler"
import XFreeHdVideoSiteHandler from "./XFreeHdVideoSiteHandler"
import TxxxNetworkVideoSiteHandler from "./TxxxNetworkVideoSiteHandler";

export interface VideoSiteHandler {
  isMatch: (url: URL) => boolean

  isVideoPage: (document: Document) => boolean

  buttonContainer: (document: Document) => Maybe<Element>
}

export const videoSiteHandlers: VideoSiteHandler[] = [
  PornOneVideoSiteHandler,
  SpankBangVideoSiteHandler,
  EPornerVideoSiteHandler,
  YouTubeVideoSiteHandler,
  XHamsterVideoSiteHandler,
  XFreeHdVideoSiteHandler,
  TxxxNetworkVideoSiteHandler
]
