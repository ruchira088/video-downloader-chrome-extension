import { DateTime, Duration } from "luxon"
import { API_SERVERS, Server } from "../models/Server"
import { HealthStatus } from "./models/HealthStatus"
import { ServiceInformation } from "./models/ServiceInformation"
import { zodParse } from "../models/Zod"

import "./styles/action-page.scss"

type ServerState = {
  status: HealthStatus
  ping?: Duration
  serviceInformation?: ServiceInformation
}

const statusPill = (status: HealthStatus): HTMLElement => {
  const pill = document.createElement("span")
  pill.className = `status-pill ${status.toLowerCase()}`

  const dot = document.createElement("span")
  dot.className = "status-dot"

  pill.append(dot, status)
  return pill
}

const detailRow = (label: string, value: string, note?: string): HTMLElement => {
  const row = document.createElement("div")
  row.className = "detail-row"

  const term = document.createElement("dt")
  term.textContent = label

  const detail = document.createElement("dd")
  detail.textContent = value

  if (note != null) {
    const noteElement = document.createElement("span")
    noteElement.className = "detail-note"
    noteElement.textContent = note
    detail.appendChild(noteElement)
  }

  row.append(term, detail)
  return row
}

const renderServerSection = (section: HTMLElement, server: Server, state: ServerState) => {
  const header = document.createElement("header")
  header.className = "server-header"

  const identity = document.createElement("div")
  identity.className = "server-identity"

  const label = document.createElement("span")
  label.className = "server-label"
  label.textContent = server.label

  const endpoint = document.createElement("span")
  endpoint.className = "server-endpoint"
  endpoint.textContent = server.apiUrl

  identity.append(label, endpoint)
  header.append(identity, statusPill(state.status))

  const details = document.createElement("dl")
  details.className = "server-details"

  if (state.ping != null) {
    details.appendChild(detailRow("Ping", `${state.ping.toMillis()}ms`))
  }

  if (state.serviceInformation != null) {
    const { gitBranch, gitCommit, buildTimestamp } = state.serviceInformation

    details.appendChild(detailRow("Build", `${gitCommit} (${gitBranch})`))
    details.appendChild(
      detailRow(
        "Built",
        buildTimestamp.toFormat("dd/MM/yyyy, h:mm a"),
        buildTimestamp.toRelative({ base: DateTime.now() }) ?? undefined,
      ),
    )
  }

  section.replaceChildren(header, details)
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
  section.className = "server-card"
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
