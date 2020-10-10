import { VideoMetadata } from "../models/VideoMetadata"
import { FileResource } from "../models/FileResource"
import moment from "moment"

const parseFileResource = (json: any): FileResource => ({
  ...json,
  createdAt: moment(json.createdAt),
})

export const parseVideoMetadata = (json: any): VideoMetadata => ({
  ...json,
  duration: moment.duration(json.duration.length, json.duration.unit),
  thumbnail: parseFileResource(json.thumbnail),
})

