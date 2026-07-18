import { z } from "zod/v4"
import { ZodDateTime } from "../../models/Zod"

export const ServiceInformation = z.object({
  gitBranch: z.string(),
  gitCommit: z.string(),
  buildTimestamp: ZodDateTime,
})

export type ServiceInformation = z.infer<typeof ServiceInformation>
