import React from "react";
import { Route, Routes, useLocation, Navigate } from "react-router-dom";
import HomePage from "../HomePage/HomePage";

import Profile from "../Profile/Profile";
import MessagePage from "../MessagePage/MessagePage";
import LoginPage from "../Login/LoginPage";
import RegisterPage from "../Login/RegisterPage";
import Authenticate from "../Login/Authenticate";
import CreatePassword from "../Login/CreatePassword";
import ActivationPage from "../Login/ActivationPage";
import EditAccountPage from "../Account/EditAccountPage";
import OtherUserProfile from "../../Components/ProfileComponents/OrderUserProfile";
import SearchPage from "../Search/SearchPage";
import { SidebarComponent } from "../../Components/Sidebar/SidebarComponent";

const Router = () => {
  const location = useLocation();
  const isAuthenticated = !!localStorage.getItem("token");

  const authRoutes = ["/login", "/register", "/create-password", "/activate"];
  const isAuthPage = authRoutes.includes(location.pathname);

  // Nếu chưa đăng nhập và không ở trang auth → chuyển về login
  if (!isAuthenticated && !isAuthPage) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex">
      {/* Sidebar luôn hiển thị */}
      {location.pathname !== "/login" && location.pathname !== "/register" && (
        <div className="w-[250px] min-h-screen border-r">
          <SidebarComponent/>
      </div>
      )}

      {/* Nội dung chính */}
      <div className="flex-1 p-4">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/user" element={<OtherUserProfile/>} />
          <Route path="/message" element={<MessagePage />} />
          <Route path="/authenticate" element={<Authenticate />} />
          <Route path="/account/edit" element={<EditAccountPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/create-password" element={<CreatePassword />} />
          <Route path="/activate" element={<ActivationPage />} />
          <Route path="/search" element={<SearchPage/>}/>
        </Routes>
      </div>
    </div>
  );
};

export default Router;
