import React from "react"
import ApiServerInformation from "./ApiServerInformation"
import { API_SERVERS } from "../../models/Server"

const App = () => (
  <div>
    {
      Object.values(API_SERVERS)
        .filter(server => server != null)
        .map(server => <ApiServerInformation server={server} key={server.name} />)
    }
  </div>
)

export default App