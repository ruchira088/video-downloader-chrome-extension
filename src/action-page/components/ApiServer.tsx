import React, { useEffect, useState } from "react"
import { Maybe, None, Some } from "monet"
import moment, { duration, Duration, Moment } from "moment"
import { HealthStatus } from "../models/HealthStatus"
import { Server } from "../../models/Server"

interface ServiceInformation {
  readonly gitCommit: string
  readonly serviceVersion: string
  readonly buildTimestamp: string
}

const ApiServer = (props: { server: Server }) => {
  const [status, setStatus] = useState(HealthStatus.Pending)
  const [maybePing, setPing] = useState<Maybe<Duration>>(None())
  const [maybeVersion, setVersion] = useState<Maybe<string>>(None())
  const [mayBuildTimestamp, setBuildTimestamp] = useState<Maybe<Moment>>(None())

  const checkStatus = () => {
    const start = moment()

    fetch(`${props.server.apiUrl}/service/info`, { signal: AbortSignal.timeout(10_000) })
      .then(async response => {
        const ping = moment().valueOf() - start.valueOf()
        setPing(Some(duration(ping, "ms")))

        if (response.ok) {
          const serviceInformation: ServiceInformation = await response.json()
          setStatus(HealthStatus.Online)
          setVersion(Some(`${serviceInformation.serviceVersion} (${serviceInformation.gitCommit})`))
          setBuildTimestamp(Some(moment(serviceInformation.buildTimestamp)))
          return Promise.resolve()
        } else {
          return Promise.reject(`Service returned ${response.status} (${response.statusText}) status code`)
        }
      })
      .catch(() => {
        setStatus(HealthStatus.Offline)
        setVersion(None())
        setBuildTimestamp(None())
      })
  }

  useEffect(() => {
    checkStatus()
    const id = setInterval(checkStatus, 15_000)
    return () => clearInterval(id)
  }, [])

  return (
    <div>
      <div>{props.server.label}</div>
      {maybePing.map(ping => <div>{ping.milliseconds()}ms</div>).orNull()}
      <div>{status}</div>
      {maybeVersion.map(version => <div>{version}</div>).orNull()}
      <div>{props.server.apiUrl}</div>
      {mayBuildTimestamp.map(buildTimestamp => <div>Built {buildTimestamp.fromNow()}</div>).orNull()}
    </div>
  )
}

export default ApiServer