import React, {useState, useEffect} from "react"
import { HealthStatus } from "../models/HealthStatus"
import { Server } from "../../models/Server"

const ApiServer = (props: { server: Server }) => {
  const [status, setStatus] = useState(HealthStatus.Pending)

  const checkStatus = () =>
    fetch(`${props.server.apiUrl}/service/info`)
      .then(() => HealthStatus.Online)
      .catch(() => HealthStatus.Offline)
      .then(status => setStatus(status))

  useEffect(() => {
    checkStatus()
    const id = setInterval(checkStatus, 10_000)
    return () => clearInterval(id)
  }, [])

  return (
    <div>
      <div>{props.server.label}</div>
      <div>{status}</div>
      <div>{props.server.apiUrl}</div>
    </div>
  )
}

export default ApiServer