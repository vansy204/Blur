import React from "react";

import { Route, Routes, useLocation } from "react-router-dom";
import HomePage from "../HomePage/HomePage";
import { SidebarComponent } from "../../Components/Sidebar/SidebarComponent";

const Router = () => {
  const location = useLocation();
  return (
    <div>
      {location.pathname !== "/login" && location.pathname !== "/signup" && (
        <div className="flex">
          <div className="w-[20%] border border-;-slate-500">
            <SidebarComponent />
          </div>
          <div className="w-full">
            <Routes>
              <Route path="/" element={<HomePage />}></Route>
            
            </Routes>
          </div>
        </div>
      )}
      {(location.pathname === "/login" || location.pathname === "/signup") && (
        <div>
          <Routes>
         
          </Routes>
        </div>
      )}
    </div>
  );
};

export default Router;
