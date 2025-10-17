import React from "react";
import Router from "./Pages/Router/Router";
import { SocketProvider } from "./contexts/SocketContext";
import { NotificationProvider } from "./contexts/NotificationContext";

function App() {
  return (
      <SocketProvider>
        <NotificationProvider>
           <Router />
        </NotificationProvider>
       
      </SocketProvider>
  );
}

export default App;
