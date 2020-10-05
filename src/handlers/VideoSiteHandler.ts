import { VideoSite } from "../models/VideoSite"
import { Maybe } from "monet"
import PornOneVideoSiteHandler from "./PornOneVideoSiteHandler"

export interface VideoSiteHandler<A extends VideoSite> {
  videoSite: A

  isVideoPage: (document: Document) => boolean

  buttonContainer: (document: Document) => Maybe<HTMLElement>
}

export const videoSiteHandlers: VideoSiteHandler<VideoSite>[] = [PornOneVideoSiteHandler]
