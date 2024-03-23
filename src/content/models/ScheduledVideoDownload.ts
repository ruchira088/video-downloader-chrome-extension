import { VideoMetadata } from "./VideoMetadata"
import { Moment } from "moment"
import { Maybe } from "monet"

export enum SchedulingStatus {
  Active = "Active",
  Completed = "Completed",
  Downloaded = "Downloaded",
  Acquired = "Acquired",
  Stale = "Stale",
  Error = "Error",
  WorkersPaused = "WorkersPaused",
  Paused = "Paused",
  Queued = "Queued",
  Deleted = "Deleted"
}

export interface ScheduledVideoDownload {
  readonly scheduledAt: Moment
  readonly lastUpdatedAt: Moment
  readonly status: SchedulingStatus
  readonly downloadedBytes: number
  readonly videoMetadata: VideoMetadata
  readonly completedAt: Maybe<Moment>
}