import { VideoSiteHandler } from "./VideoSiteHandler"

class FreshPornoVideoSiteHandler implements VideoSiteHandler {
  readonly hostnames: string[] = ["freshporno.net"]

  buttonContainer(document: Document): HTMLElement | null {
    return document.querySelector(".video-info .title-holder")
  }

  isMatch(url: URL): boolean {
    return url.toString().startsWith("https://freshporno.net/videos")
  }

  isVideoPage(document: Document): boolean {
    return document.querySelector("#kt_player") != null
  }
}

export default new FreshPornoVideoSiteHandler()
