import { VideoSiteHandler } from "./VideoSiteHandler"

class XFreeHdVideoSiteHandler implements VideoSiteHandler {
  buttonContainer(document: Document): HTMLElement | null {
    return this.videoPlayer(document)
  }

  isMatch(url: URL): boolean {
    return url.toString().startsWith("https://www.xfreehd.com/video")
  }

  isVideoPage(document: Document): boolean {
    return this.videoPlayer(document) != null
  }

  videoPlayer(document: Document): HTMLElement | null {
    return document.querySelector(".video-container")
  }
}

export default new XFreeHdVideoSiteHandler()
