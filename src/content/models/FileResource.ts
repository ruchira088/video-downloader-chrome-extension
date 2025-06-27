import { z } from "zod/v4"
import { ZodDateTime } from "../../models/Zod"

export const FileResource = z.object({
  id: z.string(),
  createdAt: ZodDateTime,
  path: z.string(),
  mediaType: z.string(),
  size: z.number().int()
})

export type FileResource = z.infer<typeof FileResource>