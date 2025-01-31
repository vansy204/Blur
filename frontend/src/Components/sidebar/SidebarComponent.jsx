import React, { useState } from "react";
import { IoReorderThreeOutline } from "react-icons/io5";
import { menuItems } from "./SidebarConfig";
import { useNavigate } from "react-router-dom";
import { useDisclosure, useToast } from "@chakra-ui/react";
import SearchComponent from "../SearchComponent/SearchComponent";
import "./SidebarComponents.css";
import LogoutModal from "./LogoutModal";
import { getToken } from "../../service/LocalStorageService";

export const SidebarComponent = () => {
  const [activeTab, setActiveTab] = useState();
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const toast = useToast();
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
    if (title === "Profile") {
      navigate("/username");
      setIsSearchVisible(false);
    } else if (title === "Home") {
      navigate("/");
      setIsSearchVisible(false);
    } else if (title === "Create") {
      onOpen();
    } else if (title === "Message") {
      navigate("/message");
    } else if (title === "Search") {
      setIsSearchVisible(true);
    } else {
      setIsSearchVisible(false);
    }
  };

  const handleClick = () => {
    setShowDropdown(!showDropdown);
  };

  const handleLoggout = (even) => {
    try {
      even.preventDefault();
      onOpen(); // Mở modal khi bấm nút
      const token = getToken();
      fetch("http://localhost:8888/api/identity/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: token,
        }),
      })
        .then((response) => {
          return response.json();
        })
        .then((data) => {
          if (data.code !== 1000) {
            throw new Error("Invalid token");
          }
          localStorage.removeItem("token");
          showToast("Logout success!!", "", "success");
          navigate("/login");
        });
    } catch (error) {
      showToast("Logout Error", error.message, "error");
    }
  };
  return (
    <div className="sticky top-0 h-[100vh] flex">
      <div
        className={`flex flex-col justify-between h-full  ${
          activeTab === "Search" ? "px-2" : " px-10"
        } "`}
      >
        <div>
          {activeTab !== "Search" && (
            <div className="pt-5">
              <img
                className="w-20 h-20 rounded-full "
                src="../logo.webp"
                alt=""
                onClick={() => {
                  navigate("/");
                }}
              />
            </div>
          )}
          <div className="mt-10">
            {menuItems.map((item) => (
              <div
                onClick={() => handleTabClick(item.title)}
                className="flex items-center mb-5 cursor-pointer text-lg"
                key={item.title}
              >
                {activeTab === item.title ? item.activeIcon : item.icon}
                {activeTab !== "Search" && (
                  <p
                    className={`${
                      activeTab === item.title ? "font-bold" : "font-simibold}"
                    }`}
                  >
                    {item.title}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="dropdown">
          <div className=" flex items-center cursor-pointer pb-10">
            <IoReorderThreeOutline
              className="three-line text-2xl"
              onClick={handleClick}
            />
            {activeTab !== "Search" && <p className="ml-5">More</p>}
            <div className="dropdown-content">
              {showDropdown && (
                <button
                  className="bg-black text-white py-1 px-4 rounded-md cursor-pointer"
                  onClick={handleLoggout}
                >
                  Log Out
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {isSearchVisible && <SearchComponent />}
      <LogoutModal isOpen={isOpen} onClose={onClose} />
    </div>
  );
};
