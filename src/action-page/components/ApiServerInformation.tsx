import React, { FC, useEffect, useState } from "react"
import { HealthStatus } from "../models/HealthStatus"
import { Server } from "../../models/Server"
import { DateTime, Duration } from "luxon"
import { ServiceInformation } from "../models/ServiceInformation"
import { map } from "../../helpers/TypeUtils"
import { zodParse } from "../../models/Zod"

type ApiServerInformation = {
  readonly server: Server
}

const ApiServerInformation: FC<ApiServerInformation> = props => {
  const [status, setStatus] = useState(HealthStatus.Pending)
  const [ping, setPing] = useState<Duration | undefined>(undefined)
  const [serviceInformation, setServiceInformation] = useState<ServiceInformation | undefined>(undefined)

  const checkStatus = async (): Promise<ServiceInformation> => {
    try {
      const startTime = DateTime.now()
      const response = await fetch(`${props.server.apiUrl}/service/info`, { signal: AbortSignal.timeout(5_000) })
      const pingInMs = DateTime.now().toMillis() - startTime.toMillis()
      setPing(Duration.fromMillis(pingInMs))
      setStatus(HealthStatus.Online)

      if (response.ok) {
        const body = await response.json()
        const serviceInfo = zodParse(ServiceInformation, body)
        setServiceInformation(serviceInfo)
        return serviceInfo
      } else {
        return Promise.reject(`Service returned ${response.status} (${response.statusText}) status code`)
      }
    } catch (error) {
      setStatus(HealthStatus.Offline)
      return Promise.reject(error)
    }
  }

  useEffect(() => {
    checkStatus()
    const id = setInterval(checkStatus, 15_000)
    return () => clearInterval(id)
  }, [])

  return (
    <div>
      <div>{props.server.label}</div>
      <div>{props.server.apiUrl}</div>
      {map(ping, ping => <div>{ping.toMillis()}ms</div>)}
      <div>{status}</div>
      {map(serviceInformation, serviceInformation =>
        <>
          <div>{serviceInformation.serviceVersion} ({serviceInformation.gitCommit})</div>
          <div>{serviceInformation.buildTimestamp.toLocaleString(DateTime.DATETIME_MED)} ({serviceInformation.buildTimestamp.toRelative({ base: DateTime.now() })})</div>
        </>
      )
      }
    </div>
  )
}

export default ApiServerInformation