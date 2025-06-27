import { FileResource } from "./FileResource"
import { z } from "zod/v4"
import { ZodDuration } from "../../models/Zod"

export const VideoMetadata = z.object({
  url: z.string(),
  id: z.string(),
  videoSite: z.string(),
  title: z.string(),
  duration: ZodDuration,
  size: z.number().int(),
  thumbnail: FileResource,
})

export type VideoMetadata = z.infer<typeof VideoMetadata>
