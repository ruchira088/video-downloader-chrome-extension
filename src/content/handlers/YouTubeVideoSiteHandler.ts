import { VideoSiteHandler } from "./VideoSiteHandler"

class YouTubeVideoSiteHandler implements VideoSiteHandler {
  readonly hostnames: string[] = ["www.youtube.com"]

  buttonContainer(document: Document): HTMLElement | null {
    return document.getElementById("messages")
  }

  isVideoPage(document: Document): boolean {
    return document.getElementById("ytd-player") != null
  }

  isMatch(url: URL): boolean {
    return url.toString().startsWith("https://www.youtube.com/watch")
  }
}

export default new YouTubeVideoSiteHandler()
