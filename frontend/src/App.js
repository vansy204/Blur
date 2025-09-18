import React from "react";

import Router from "./Pages/Router/Router";
import { DarkModeProvider } from "./context/DarkModeContext";
import './styles/darkmode.css';
function App() {
  return (
      <DarkModeProvider>
        <Router/>
      </DarkModeProvider>
  );
}
export default App;
