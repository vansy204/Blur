import React, { useEffect, useState } from "react";
import { IoReorderThreeOutline } from "react-icons/io5";
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
      <div className="w-64 fixed top-0 left-0 h-screen transition-all duration-300 flex flex-col justify-between px-4 py-6 bg-white border-r shadow-md z-50">
        <div className="flex items-center justify-center">
          <img
            className="w-16 h-16 rounded-full cursor-pointer hover:opacity-80"
            src="../logo.webp"
            alt="Logo"
            onClick={() => navigate("/")}
          />
        </div>

        <div className="mt-10 flex-1 overflow-y-auto">
          {menuItems.map((item) => (
            <div
              key={item.title}
              onClick={() => handleTabClick(item.title)}
              className={`flex items-center py-2 px-4 mb-2 rounded-lg cursor-pointer hover:bg-gray-100 transition ${
                activeTab === item.title ? "bg-gray-200 font-semibold" : ""
              }`}
            >
              {item.title === "Profile" && user ? (
                <>
                  <img
                    src={user.imageUrl || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png"}
                    alt="avatar"
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <span className="ml-3">{user.firstName} {user.lastName}</span>
                </>
              ) : (
                <>
                  <span className="text-xl">
                    {activeTab === item.title ? item.activeIcon : item.icon}
                  </span>
                  <p className="ml-3">{item.title}</p>
                </>
              )}
            </div>
          ))}
        </div>

        {/* More Options */}
        <div className="relative">
          <div
            className="flex items-center py-2 px-4 rounded-lg hover:bg-gray-100 cursor-pointer"
            onClick={handleClick}
          >
            <IoReorderThreeOutline className="text-2xl" />
            <p className="ml-3">More</p>
          </div>
          {showDropdown && (
            <div className="absolute bottom-12 left-0 w-full bg-white shadow-lg border rounded-md z-10">
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64 overflow-y-auto p-4">
        {/* Nội dung chính sẽ được render tại đây */}
      </div>

      <LogoutModal isOpen={isOpen} onClose={onClose} />
      <CreatePostModal
        isOpen={isCreateOpen}
        onClose={onCreateClose}
        onPostCreate={onPostCreate}
      />
    </div>
  );
};
