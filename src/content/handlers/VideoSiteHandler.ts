import { Maybe } from "monet"
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
  uporniaVideoSiteHandler
} from "./TxxxNetworkVideoSiteHandler"

export interface VideoSiteHandler {
  isMatch: (url: URL) => boolean;

  isVideoPage: (document: Document) => boolean;

  buttonContainer: (document: Document) => Maybe<Element>;
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
  uporniaVideoSiteHandler
]
