import { VideoSite } from "./VideoSite"
import { Duration } from "moment"
import { FileResource } from "./FileResource"

export interface VideoMetadata {
  readonly url: string
  readonly id: string
  readonly videoSite: VideoSite
  readonly title: string
  readonly duration: Duration
  readonly size: number
  readonly thumbnail: FileResource
}
