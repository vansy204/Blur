import React from "react";

import { Route, Routes, useLocation } from "react-router-dom";
import HomePage from "../HomePage/HomePage";
import { SidebarComponent } from "../../Components/Sidebar/SidebarComponent";
import Profile from "../Profile/Profile";
import MessagePage from "../MessagePage/MessagePage";
import LoginPage from "../Login/LoginPage";
import RegisterPage from "../Login/RegisterPage";
import Authenticate from "../Login/Authenticate";
import CreatePassword from "../Login/CreatePassword";
import ActivationPage from "../Login/ActivationPage";

const Router = () => {
  const location = useLocation();
  return (
    <div>
     ({location.pathname !== "/login" && location.pathname !== "/register"  && location.pathname !== "/create-password"&& location.pathname !== "/activate" && (
        <div className="flex">
          <div className="w-[20%] border border-;-slate-500">
            <SidebarComponent />
          </div>
          <div className="w-full">
            <Routes>
              <Route path="/" element={<HomePage />}></Route>
              <Route path="/username" element={<Profile/>}/>
              <Route path="/message" element={<MessagePage/>} />
              <Route path="/Authenticate" element={<Authenticate/>}></Route>
            </Routes>
          </div>
        </div>
      )}
      {(location.pathname === "/login" || location.pathname ==="/register" || location.pathname === "/create-password" || location.pathname === "/activate") && (
        <div>
          <Routes>
          <Route path="/login" element={<LoginPage/>}/>
          <Route path="/register" element={<RegisterPage/>}/>
          <Route path="/create-password" element={<CreatePassword/>}></Route>
          <Route path="/Activate" element={<ActivationPage/>}></Route>
          </Routes>
        </div>
      )})
    </div>
  );
};

export default Router;
