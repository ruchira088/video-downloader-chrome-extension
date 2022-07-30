import { VideoSiteHandler } from "./VideoSiteHandler";
import { Maybe } from "monet";

abstract class TxxxNetworkVideoSiteHandler implements VideoSiteHandler {
  abstract readonly hostname: string

  abstract readonly containerCss: string

  buttonContainer(document: Document): Maybe<Element> {
    return Maybe.fromNull(document.querySelector(this.containerCss))
  }

  isMatch(url: URL): boolean {
    return url.toString().startsWith(`https://${this.hostname}/videos`)
  }

  isVideoPage(document: Document): boolean {
    return document.querySelector("video.jw-video") != null
  }
}

class TxxxVideoSiteHandler extends TxxxNetworkVideoSiteHandler {
  readonly hostname: string = "txxx.com"
  readonly containerCss: string = "div.video-title"

}

class UPorniaVideoSiteHandler extends TxxxNetworkVideoSiteHandler {
  readonly hostname: string = "upornia.com";
  readonly containerCss: string = "div.video-title"
}

class HClipsVideoSiteHandler extends TxxxNetworkVideoSiteHandler {
  readonly hostname: string = "hclips.com";
  readonly containerCss: string = "h1.video-page__title"
}

class HotMovsVideoSiteHandler extends TxxxNetworkVideoSiteHandler {
  readonly hostname: string = "hotmovs.com";
  readonly containerCss: string = "h1.video-page__title"
}

class HdZogVideoSiteHandler extends TxxxNetworkVideoSiteHandler {
  readonly hostname: string = "hdzog.com";
  readonly containerCss: string = ".video-page__header"
}

export const txxxVideoSiteHandler = new TxxxVideoSiteHandler()
export const uporniaVideoSiteHandler = new UPorniaVideoSiteHandler()
export const hclipsVideoSiteHandler = new HClipsVideoSiteHandler()
export const hotMovsVideoSiteHandler = new HotMovsVideoSiteHandler()
export const hdZogVideoSiteHandler = new HdZogVideoSiteHandler()