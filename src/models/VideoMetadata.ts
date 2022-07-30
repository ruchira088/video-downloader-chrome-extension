import { Duration } from "moment"
import { FileResource } from "./FileResource"

export interface VideoMetadata {
  readonly url: string
  readonly id: string
  readonly videoSite: string
  readonly title: string
  readonly duration: Duration
  readonly size: number
  readonly thumbnail: FileResource
}
