import React from "react";
import Router from "./Pages/Router/Router";
import { SocketProvider } from "./contexts/SocketContext";

function App() {
  return (
      <SocketProvider>
        <Router />
      </SocketProvider>
  );
}

export default App;
