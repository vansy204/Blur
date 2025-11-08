import React from "react";
import Router from "./Pages/Router/Router";
import { SocketProvider } from "./contexts/SocketContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { NotificationSocketProvider } from "./contexts/NotificationSocketContext";

function App() {
  return (
    <SocketProvider>
      <NotificationProvider>
        <NotificationSocketProvider>
          <Router />   {/* ✅ chỉ gọi Router, không lồng lại App */}
        </NotificationSocketProvider>
      </NotificationProvider>
    </SocketProvider>
  );
}

export default App;
