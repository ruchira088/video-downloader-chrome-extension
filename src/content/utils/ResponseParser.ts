import { VideoMetadata } from "../models/VideoMetadata"
import { FileResource } from "../models/FileResource"
import moment from "moment"
import { ScheduledVideoDownload } from "../models/ScheduledVideoDownload"
import { Maybe } from "monet"

const parseFileResource = (json: any): FileResource => ({
  ...json,
  createdAt: moment(json.createdAt)
})

export const parseVideoMetadata = (json: any): VideoMetadata => ({
  ...json,
  duration: moment.duration(json.duration.length, json.duration.unit),
  thumbnail: parseFileResource(json.thumbnail)
})

export const parseScheduledVideoDownload = (json: any): ScheduledVideoDownload => ({
  ...json,
  scheduledAt: moment(json.scheduledAt),
  lastUpdatedAt: moment(json.lastUpdatedAt),
  videoMetadata: parseVideoMetadata(json.videoMetadata),
  completedAt: Maybe.fromFalsy(json.completedAt).map(moment)
})
