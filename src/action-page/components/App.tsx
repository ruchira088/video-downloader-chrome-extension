import React from "react"
import ApiServer from "./ApiServer"
import { API_SERVERS } from "../../models/Server"

const App = () => (
  <div>
    { Object.values(API_SERVERS).map((server, index) => <ApiServer server={server} key={index}/>) }
  </div>
)

export default App