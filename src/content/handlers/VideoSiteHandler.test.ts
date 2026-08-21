import { describe, expect, it } from "vitest"
import { isSupportedHost, VideoSiteHandler, videoSiteHandlers } from "./VideoSiteHandler"
import pornOneVideoSiteHandler from "./PornOneVideoSiteHandler"
import spankBangVideoSiteHandler from "./SpankBangVideoSiteHandler"
import epornerVideoSiteHandler from "./EPornerVideoSiteHandler"
import youTubeVideoSiteHandler from "./YouTubeVideoSiteHandler"
import xhamsterVideoSiteHandler from "./XHamsterVideoSiteHandler"
import xfreeHdVideoSiteHandler from "./XFreeHdVideoSiteHandler"
import sxyPrnVideoSiteHandler from "./SxyPrnVideoSiteHandler"
import freshPornoVideoSiteHandler from "./FreshPornoVideoSiteHandler"
import {
  hclipsVideoSiteHandler,
  hdZogVideoSiteHandler,
  hotMovsVideoSiteHandler,
  txxxVideoSiteHandler,
  uporniaVideoSiteHandler,
} from "./TxxxNetworkVideoSiteHandler"

interface SiteFixture {
  readonly name: string
  readonly handler: VideoSiteHandler
  /** URLs that must select this handler. */
  readonly videoUrls: string[]
  /**
   * URLs on a hostname this handler declares that must NOT select it. Empty for handlers whose `isMatch`
   * deliberately claims every path on the host.
   */
  readonly nonVideoUrls: string[]
  /** Markup `isVideoPage` must accept. The button's expected destination carries `data-expected-container`. */
  readonly videoPageHtml: string
}

const txxxNetworkFixture = (
  name: string,
  handler: VideoSiteHandler,
  hostname: string,
  containerHtml: string,
): SiteFixture => ({
  name,
  handler,
  videoUrls: [`https://${hostname}/videos/12345/some-video-title/`],
  nonVideoUrls: [`https://${hostname}/`, `https://${hostname}/categories/all`],
  videoPageHtml: `<video class="jw-video"></video>${containerHtml}`,
})

const SITES: SiteFixture[] = [
  {
    name: "PornOne",
    handler: pornOneVideoSiteHandler,
    videoUrls: ["https://pornone.com/watch/12345/some-video-title/"],
    nonVideoUrls: [],
    videoPageHtml: `<div data-expected-container="true"><div id="pornone-video-player"></div></div>`,
  },
  {
    name: "SpankBang",
    handler: spankBangVideoSiteHandler,
    videoUrls: ["https://spankbang.com/abcde/video/some+video+title"],
    nonVideoUrls: [],
    videoPageHtml: `<div id="player_wrapper_outer" data-expected-container="true"></div><div id="video"></div>`,
  },
  {
    name: "EPorner",
    handler: epornerVideoSiteHandler,
    videoUrls: ["https://www.eporner.com/video-abc123/some-video-title/"],
    nonVideoUrls: [],
    videoPageHtml: `<div id="video-info" data-expected-container="true"></div>`,
  },
  {
    name: "YouTube",
    handler: youTubeVideoSiteHandler,
    videoUrls: ["https://www.youtube.com/watch?v=dQw4w9WgXcQ"],
    nonVideoUrls: ["https://www.youtube.com/", "https://www.youtube.com/feed/subscriptions"],
    videoPageHtml: `<div id="ytd-player"></div><div id="messages" data-expected-container="true"></div>`,
  },
  {
    name: "XHamster",
    handler: xhamsterVideoSiteHandler,
    videoUrls: ["https://xhamster.com/videos/some-video-title-12345"],
    nonVideoUrls: ["https://xhamster.com/", "https://xhamster.com/channels"],
    videoPageHtml: `<div id="player-container"></div><div class="controls" data-expected-container="true"></div>`,
  },
  {
    name: "XFreeHd",
    handler: xfreeHdVideoSiteHandler,
    videoUrls: ["https://www.xfreehd.com/video/12345/some-video-title"],
    nonVideoUrls: ["https://www.xfreehd.com/"],
    videoPageHtml: `<div class="video-container" data-expected-container="true"></div>`,
  },
  txxxNetworkFixture(
    "Txxx",
    txxxVideoSiteHandler,
    "txxx.com",
    `<div class="video-title" data-expected-container="true"></div>`,
  ),
  txxxNetworkFixture(
    "UPornia",
    uporniaVideoSiteHandler,
    "upornia.com",
    `<div class="video-title" data-expected-container="true"></div>`,
  ),
  txxxNetworkFixture(
    "HClips",
    hclipsVideoSiteHandler,
    "hclips.com",
    `<h1 class="video-page__title" data-expected-container="true"></h1>`,
  ),
  txxxNetworkFixture(
    "HotMovs",
    hotMovsVideoSiteHandler,
    "hotmovs.com",
    `<h1 class="video-page__title" data-expected-container="true"></h1>`,
  ),
  txxxNetworkFixture(
    "HdZog",
    hdZogVideoSiteHandler,
    "hdzog.com",
    `<div class="video-page__header" data-expected-container="true"></div>`,
  ),
  {
    name: "SxyPrn",
    handler: sxyPrnVideoSiteHandler,
    videoUrls: ["https://sxyprn.com/post/abc123def.html"],
    nonVideoUrls: [],
    videoPageHtml: `<div id="vid_container_id" data-expected-container="true"></div>`,
  },
  {
    name: "FreshPorno",
    handler: freshPornoVideoSiteHandler,
    videoUrls: ["https://freshporno.net/videos/12345/some-video-title/"],
    nonVideoUrls: ["https://freshporno.net/"],
    videoPageHtml: `<div id="kt_player"></div><div class="video-info"><div class="title-holder" data-expected-container="true"></div></div>`,
  },
]

/** URLs that impersonate a supported site and must not select any handler. */
const IMPERSONATING_URLS = [
  "https://xhamster.com.evil.example/videos/12345",
  "https://evil.example/https://xhamster.com/videos/12345",
  "https://www.xhamster.com/videos/12345",
  "https://pornone.com.evil.example/watch/12345/",
  "https://notpornone.com/watch/12345/",
  "https://evil.example/?redirect=https://www.youtube.com/watch?v=abc",
]

const ALL_URLS = SITES.flatMap((site) => [...site.videoUrls, ...site.nonVideoUrls]).concat(IMPERSONATING_URLS)

const parseDocument = (html: string): Document => new DOMParser().parseFromString(html, "text/html")

describe("videoSiteHandlers", () => {
  it("is exactly the set of handlers covered by this suite", () => {
    // Guards against registering a handler without also giving it a fixture below.
    expect(new Set(videoSiteHandlers)).toEqual(new Set(SITES.map((site) => site.handler)))
  })

  it("declares no duplicate hostnames across handlers", () => {
    const hostnames = videoSiteHandlers.flatMap((handler) => handler.hostnames)

    expect(hostnames).toHaveLength(new Set(hostnames).size)
  })
})

describe.each(SITES)("$name", ({ handler, videoUrls, nonVideoUrls, videoPageHtml }) => {
  it.each(videoUrls)("matches %s", (url) => {
    expect(handler.isMatch(new URL(url))).toBe(true)
  })

  it.each(nonVideoUrls.length > 0 ? nonVideoUrls : [null])("does not match non-video URL %s", (url) => {
    if (url === null) return // handler deliberately claims every path on its host

    expect(handler.isMatch(new URL(url))).toBe(false)
  })

  it.each(SITES.filter((other) => other.handler !== handler).flatMap((other) => other.videoUrls))(
    "does not match another site's URL %s",
    (url) => {
      expect(handler.isMatch(new URL(url))).toBe(false)
    },
  )

  it.each(IMPERSONATING_URLS)("does not match impersonating URL %s", (url) => {
    expect(handler.isMatch(new URL(url))).toBe(false)
  })

  it("recognises its video page and returns the button container", () => {
    const document = parseDocument(videoPageHtml)

    expect(handler.isVideoPage(document)).toBe(true)
    expect(handler.buttonContainer(document)?.dataset.expectedContainer).toBe("true")
  })

  it("does not recognise an unrelated page", () => {
    const document = parseDocument(`<div id="unrelated"><p>nothing to see</p></div>`)

    expect(handler.isVideoPage(document)).toBe(false)
    expect(handler.buttonContainer(document)).toBeNull()
  })
})

describe("hostnames / isMatch invariant", () => {
  // Content.ts gates its polling loop on isSupportedHost(window.location.hostname) and only then consults
  // isMatch. A handler that matches a URL whose hostname it does not declare is therefore dead code: the
  // download button would silently never appear.
  it.each(SITES)("$name only matches URLs on a hostname it declares", ({ handler }) => {
    const overreaching = ALL_URLS.map((url) => new URL(url)).filter(
      (url) => handler.isMatch(url) && !handler.hostnames.includes(url.hostname),
    )

    expect(overreaching.map((url) => url.toString())).toEqual([])
  })

  it("selects exactly one handler for every known video URL", () => {
    const videoUrls = SITES.flatMap((site) => site.videoUrls)

    const matchCounts = videoUrls.map((url) => ({
      url,
      matches: videoSiteHandlers.filter((handler) => handler.isMatch(new URL(url))).length,
    }))

    expect(matchCounts.filter(({ matches }) => matches !== 1)).toEqual([])
  })

  it("selects no handler for an impersonating URL", () => {
    const matched = IMPERSONATING_URLS.filter((url) =>
      videoSiteHandlers.some((handler) => handler.isMatch(new URL(url))),
    )

    expect(matched).toEqual([])
  })
})

describe("isSupportedHost", () => {
  it.each(videoSiteHandlers.flatMap((handler) => handler.hostnames))("supports %s", (hostname) => {
    expect(isSupportedHost(hostname)).toBe(true)
  })

  it.each(["example.com", "www.xhamster.com", "xhamster.com.evil.example", ""])("does not support %s", (hostname) => {
    expect(isSupportedHost(hostname)).toBe(false)
  })
})
