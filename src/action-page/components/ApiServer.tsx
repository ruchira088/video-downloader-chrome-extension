import React, { useEffect, useState } from "react"
import { HealthStatus } from "../models/HealthStatus"
import { Server } from "../../models/Server"
import { Maybe, None, Some } from "monet"
import moment, { Moment } from "moment"

interface ServiceInformation {
  readonly gitCommit: string
  readonly serviceVersion: string
  readonly buildTimestamp: string
}

const ApiServer = (props: { server: Server }) => {
  const [status, setStatus] = useState(HealthStatus.Pending)
  const [maybeVersion, setVersion] = useState<Maybe<string>>(None())
  const [mayBuildTimestamp, setBuildTimestamp] = useState<Maybe<Moment>>(None())


  const checkStatus = () =>
    // @ts-ignore
    fetch(`${props.server.apiUrl}/service/info`, { signal: AbortSignal.timeout(3000) })
      .then(async response => {
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
      })

  useEffect(() => {
    checkStatus()
    const id = setInterval(checkStatus, 5_000)
    return () => clearInterval(id)
  }, [])

  return (
    <div>
      <div>{props.server.label}</div>
      <div>{status}</div>
      {maybeVersion.map(version => <div>{version}</div>).orNull()}
      <div>{props.server.apiUrl}</div>
      {mayBuildTimestamp.map(buildTimestamp => <div>Built {buildTimestamp.fromNow()}</div>).orNull()}
    </div>
  )
}

export default ApiServer