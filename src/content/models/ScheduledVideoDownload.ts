import { z } from "zod/v4"
import { ZodDateTime } from "../../models/Zod"
import { VideoMetadata } from "./VideoMetadata"

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

export const ScheduledVideoDownload = z.object({
  scheduledAt: ZodDateTime,
  lastUpdatedAt: ZodDateTime,
  status: z.enum(SchedulingStatus),
  downloadedBytes: z.number().int(),
  videoMetadata: VideoMetadata,
  completedAt: ZodDateTime.nullish()
})

export type ScheduledVideoDownload = z.infer<typeof ScheduledVideoDownload>