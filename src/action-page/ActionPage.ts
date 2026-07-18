import { DateTime, Duration } from "luxon"
import { API_SERVERS, Server } from "../models/Server"
import { HealthStatus } from "./models/HealthStatus"
import { ServiceInformation } from "./models/ServiceInformation"
import { zodParse } from "../models/Zod"

type ServerState = {
  status: HealthStatus
  ping?: Duration
  serviceInformation?: ServiceInformation
}

const textDiv = (text: string): HTMLDivElement => {
  const div = document.createElement("div")
  div.textContent = text
  return div
}

const renderServerSection = (section: HTMLElement, server: Server, state: ServerState) => {
  const elements = [textDiv(server.label), textDiv(server.apiUrl)]

  if (state.ping != null) {
    elements.push(textDiv(`${state.ping.toMillis()}ms`))
  }

  elements.push(textDiv(state.status))

  if (state.serviceInformation != null) {
    const { gitBranch, gitCommit, buildTimestamp } = state.serviceInformation

    elements.push(
      textDiv(`${gitCommit} (${gitBranch})`),
      textDiv(
        `${buildTimestamp.toLocaleString(DateTime.DATETIME_SHORT)} (${buildTimestamp.toRelative({ base: DateTime.now() })})`,
      ),
    )
  }

  section.replaceChildren(...elements)
}

const checkStatus = async (server: Server, state: ServerState): Promise<void> => {
  try {
    const startTime = DateTime.now()
    const response = await fetch(`${server.apiUrl}/service/info`, { signal: AbortSignal.timeout(5_000) })
    state.ping = Duration.fromMillis(DateTime.now().toMillis() - startTime.toMillis())
    state.status = HealthStatus.Online

    if (response.ok) {
      const body = await response.json()
      state.serviceInformation = zodParse(ServiceInformation, body)
    }
  } catch {
    state.status = HealthStatus.Offline
    state.ping = undefined
    state.serviceInformation = undefined
  }
}

const initialiseServerSection = (root: HTMLElement, server: Server) => {
  const section = document.createElement("div")
  root.appendChild(section)

  const state: ServerState = { status: HealthStatus.Pending }
  renderServerSection(section, server, state)

  const refresh = async () => {
    await checkStatus(server, state)
    renderServerSection(section, server, state)
  }

  refresh()
  setInterval(refresh, 15_000)
}

const root = document.getElementById("root")

if (root != null) {
  Object.values(API_SERVERS)
    .filter((server) => server != null)
    .forEach((server) => initialiseServerSection(root, server))
}
