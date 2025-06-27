import { z } from "zod/v4"
import { ZodDateTime } from "../../models/Zod"

export const ServiceInformation = z.object({
  gitCommit: z.string(),
  serviceVersion: z.string(),
  buildTimestamp: ZodDateTime
})

export type ServiceInformation = z.infer<typeof ServiceInformation>