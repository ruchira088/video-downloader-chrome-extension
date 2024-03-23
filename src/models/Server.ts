export interface Server {
  readonly apiUrl: string
  readonly name: string
  readonly label: string
  readonly authenticationCookieName: string
}

export interface ApiServers {
  readonly production: Server
  readonly productionFallback?: Server
}

export const API_SERVERS: ApiServers = {
  production: {
    name: "production",
    label: "Production",
    apiUrl: "https://api.video.home.ruchij.com",
    authenticationCookieName: "authentication"
  },
  // productionFallback: {
  //   name: "productionFallback",
  //   label: "Production Fallback",
  //   apiUrl: "https://fallback-api.video.dev.ruchij.com",
  //   authenticationCookieName: "SESSION"
  // }
}