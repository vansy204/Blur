import React, { useEffect, useState } from "react";
import { IoReorderThreeOutline } from "react-icons/io5";
import { MdLogout } from "react-icons/md";
import { menuItems } from "./SidebarConfig";
import { useNavigate } from "react-router-dom";
import { useDisclosure, useToast } from "@chakra-ui/react";
import LogoutModal from "./LogoutModal";
import { getToken, removeToken } from "../../service/LocalStorageService";
import axios from "axios";
import { getUserDetails } from "../../service/JwtService";
import CreatePostModal from "../Post/CreatePostModal";

export const SidebarComponent = ({ onPostCreate }) => {
  const [activeTab, setActiveTab] = useState();
  const [showDropdown, setShowDropdown] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();

  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isCreateOpen,
    onOpen: onCreateOpen,
    onClose: onCreateClose,
  } = useDisclosure();

  const showToast = (title, description, status) => {
    toast({
      title,
      description,
      status,
      duration: 5000,
      position: "top-right",
      isClosable: true,
    });
  };

  const handleTabClick = (title) => {
    setActiveTab(title);
    switch (title) {
      case "Profile":
        navigate("/profile");
        break;
      case "Home":
        navigate("/");
        break;
      case "Create":
        onCreateOpen();
        break;
      case "Message":
        navigate("/message");
        break;
      case "Notification":
        navigate("/notification");
        break;
      case "Search":
        navigate("/search");
        break;
      default:
    }
  };

  const handleClick = () => setShowDropdown(!showDropdown);

  useEffect(() => {
    const fetchUser = async () => {
      const userData = getUserDetails();
      const token = getToken();
      if (!userData) return;
      try {
        const response = await axios.get(
          "http://localhost:8888/api/profile/users/myInfo",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (response.data?.code !== 1000) throw new Error("Invalid User");
        setUser(response.data?.result);
      } catch (error) {
        console.error("Error:", error);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async (e) => {
    try {
      e.preventDefault();
      const token = getToken();
      const response = await axios.post(
        "http://localhost:8888/api/identity/auth/logout",
        { token }
      );
      if (response.data.code !== 1000) throw new Error("Invalid token");
      removeToken(token);
      showToast("Logout successful!", "", "success");
      navigate("/login");
    } catch (error) {
      showToast("Logout Error", error.message, "error");
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 fixed top-0 left-0 h-screen transition-all duration-300 flex flex-col justify-between px-4 py-6 bg-white border-r border-gray-200 shadow-sm z-50">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-400 to-blue-500 rounded-full blur-md opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <img
              className="relative w-16 h-16 rounded-full cursor-pointer hover:scale-105 transition-transform duration-200 shadow-lg"
              src="../logo.webp"
              alt="Logo"
              onClick={() => navigate("/")}
            />
          </div>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto space-y-1">
          {menuItems.map((item) => (
            <div
              key={item.title}
              onClick={() => handleTabClick(item.title)}
              className={`group flex items-center gap-4 py-3 px-4 rounded-xl cursor-pointer transition-all duration-200 ${
                activeTab === item.title
                  ? "bg-gradient-to-r from-sky-50 to-blue-50 text-sky-600"
                  : "hover:bg-gray-50 text-gray-700"
              }`}
            >
              {item.title === "Profile" && user ? (
                <>
                  <div className="relative">
                    <div className={`absolute inset-0 rounded-full blur-sm transition-opacity ${
                      activeTab === item.title 
                        ? "bg-gradient-to-br from-sky-400 to-blue-500 opacity-20" 
                        : "bg-gray-400 opacity-0 group-hover:opacity-10"
                    }`}></div>
                    <img
                      src={user.imageUrl || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png"}
                      alt="avatar"
                      className="relative w-7 h-7 rounded-full object-cover border-2 border-white shadow-sm"
                    />
                  </div>
                  <span className={`font-medium text-sm ${
                    activeTab === item.title ? "font-semibold" : ""
                  }`}>
                    {user.firstName} {user.lastName}
                  </span>
                </>
              ) : (
                <>
                  <div className={`text-xl transition-transform duration-200 ${
                    activeTab === item.title ? "scale-110" : "group-hover:scale-105"
                  }`}>
                    {activeTab === item.title ? item.activeIcon : item.icon}
                  </div>
                  <span className={`font-medium text-sm ${
                    activeTab === item.title ? "font-semibold" : ""
                  }`}>
                    {item.title}
                  </span>
                </>
              )}

              {/* Active indicator */}
              {activeTab === item.title && (
                <div className="absolute left-0 w-1 h-8 bg-gradient-to-b from-sky-400 to-blue-500 rounded-r-full"></div>
              )}
            </div>
          ))}
        </div>

        {/* More Options */}
        <div className="relative mt-4">
          <div
            className="flex items-center gap-4 py-3 px-4 rounded-xl hover:bg-gray-50 cursor-pointer transition-all duration-200 text-gray-700 group"
            onClick={handleClick}
          >
            <IoReorderThreeOutline className="text-2xl group-hover:scale-105 transition-transform" />
            <span className="font-medium text-sm">More</span>
          </div>
          
          {showDropdown && (
            <div className="absolute bottom-16 left-0 right-0 mx-2 bg-white shadow-xl border border-gray-100 rounded-xl overflow-hidden animate-slideUp">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-red-50 transition-colors group"
              >
                <MdLogout className="text-lg text-gray-600 group-hover:text-red-500 transition-colors" />
                <span className="font-medium text-gray-700 group-hover:text-red-600">
                  Log Out
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64 overflow-y-auto bg-gradient-to-b from-gray-50 to-white">
        {/* Content will be rendered here */}
      </div>

      <LogoutModal isOpen={isOpen} onClose={onClose} />
      <CreatePostModal
        isOpen={isCreateOpen}
        onClose={onCreateClose}
        onPostCreate={onPostCreate}
      />

      {/* Animation styles */}
      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slideUp {
          animation: slideUp 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}