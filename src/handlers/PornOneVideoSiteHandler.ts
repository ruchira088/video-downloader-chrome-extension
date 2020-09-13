import {VideoSiteHandler} from "./VideoSiteHandler";
import {VideoSite} from "../models/VideoSite";
import {Maybe} from "monet";

export class PornOneVideoSiteHandler implements VideoSiteHandler<VideoSite.PornOne> {
    buttonContainer(document: Document): Maybe<HTMLElement> {
        return this.videoPlayer(document);
    }

    isVideoPage(document: Document): boolean {
        return this.videoPlayer(document).isJust()
    }

    videoPlayer(document: Document): Maybe<HTMLElement> {
        return Maybe.fromNull(document.getElementById("video_player"))
    }

    videoSite: VideoSite.PornOne = VideoSite.PornOne;
}

export default new PornOneVideoSiteHandler()
