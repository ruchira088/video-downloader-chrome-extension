export interface Server {
  readonly apiUrl: string
  readonly label: ServerLabel
}

export interface ApiServers {
  readonly production: Server
  readonly development: Server
}

export enum ServerLabel {
  Production = "Production",
  Development = "Development"
}

export const API_SERVERS: ApiServers = {
  production: { label: ServerLabel.Production, apiUrl: "https://api.video.home.ruchij.com" },
  development: { label: ServerLabel.Development, apiUrl: "https://api.dev.video.dev.ruchij.com" }
}