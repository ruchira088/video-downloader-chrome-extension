import { VideoSiteHandler } from "./VideoSiteHandler";
import { Maybe } from "monet";

export class TxxxNetworkVideoSiteHandler implements VideoSiteHandler {
  static readonly HOSTNAMES: string[] = [
    "txxx.com",
    "upornia.com",
    "hclips.com",
    "hotmovs.com",
    "hdzog.com"
  ];

  buttonContainer(document: Document): Maybe<Element> {
    return Maybe.fromNull(document.querySelector("div.video-tags"));
  }

  isMatch(url: URL): boolean {
    return TxxxNetworkVideoSiteHandler.HOSTNAMES.some(hostname => url.toString().startsWith(`https://${hostname}/videos`));
  }

  isVideoPage(document: Document): boolean {
    return document.querySelector("video.jw-video") != null;
  }
}

export default new TxxxNetworkVideoSiteHandler()