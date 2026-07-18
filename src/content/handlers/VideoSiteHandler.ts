import pornOneVideoSiteHandler from "./PornOneVideoSiteHandler"
import spankBangVideoSiteHandler from "./SpankBangVideoSiteHandler"
import epornerVideoSiteHandler from "./EPornerVideoSiteHandler"
import youTubeVideoSiteHandler from "./YouTubeVideoSiteHandler"
import xhamsterVideoSiteHandler from "./XHamsterVideoSiteHandler"
import xfreeHdVideoSiteHandler from "./XFreeHdVideoSiteHandler"
import {
  hclipsVideoSiteHandler,
  hdZogVideoSiteHandler,
  hotMovsVideoSiteHandler,
  txxxVideoSiteHandler,
  uporniaVideoSiteHandler,
} from "./TxxxNetworkVideoSiteHandler"
import sxyPrnVideoSiteHandler from "./SxyPrnVideoSiteHandler"
import freshPornoVideoSiteHandler from "./FreshPornoVideoSiteHandler"

export interface VideoSiteHandler {
  hostnames: string[]

  isMatch: (url: URL) => boolean

  isVideoPage: (document: Document) => boolean

  buttonContainer: (document: Document) => HTMLElement | null
}

export const videoSiteHandlers: VideoSiteHandler[] = [
  pornOneVideoSiteHandler,
  spankBangVideoSiteHandler,
  epornerVideoSiteHandler,
  youTubeVideoSiteHandler,
  xhamsterVideoSiteHandler,
  xfreeHdVideoSiteHandler,
  hclipsVideoSiteHandler,
  hdZogVideoSiteHandler,
  txxxVideoSiteHandler,
  hotMovsVideoSiteHandler,
  uporniaVideoSiteHandler,
  sxyPrnVideoSiteHandler,
  freshPornoVideoSiteHandler,
]

export const isSupportedHost = (hostname: string): boolean =>
  videoSiteHandlers.some((videoSiteHandler) => videoSiteHandler.hostnames.includes(hostname))
