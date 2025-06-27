import { z } from "zod/v4"

export enum ApiName {
  Production = "production",
  Fallback = "fallback",
}

export const Server = z.object({
  apiUrl: z.string(),
  name: z.enum(ApiName),
  label: z.string(),
  authenticationCookieName: z.string(),
})

export type Server = z.infer<typeof Server>

export const ApiServers = z.object({
  [ApiName.Production]: Server,
  [ApiName.Fallback]: Server.nullish(),
})

export type ApiServers = z.infer<typeof ApiServers>

export const API_SERVERS: ApiServers = ApiServers.parse({
  production: {
    name: ApiName.Production,
    label: "Production",
    apiUrl: "https://api.video.home.ruchij.com",
    authenticationCookieName: "authentication",
  },
})
