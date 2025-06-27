import { z } from "zod/v4"
import { ApiName } from "./Server"

export const ApiConfiguration = z.object({
  serverUrl: z.string(),
  authenticationToken: z.string(),
})

export type ApiConfiguration = z.infer<typeof ApiConfiguration>

export const ApiConfigurations = z.object({
  [ApiName.Production]: ApiConfiguration.nullish(),
  [ApiName.Fallback]: ApiConfiguration.nullish(),
})

export type ApiConfigurations = z.infer<typeof ApiConfigurations>
