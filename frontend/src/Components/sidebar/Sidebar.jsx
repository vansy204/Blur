import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { IoReorderThreeOutline } from "react-icons/io5";
import { menuSideBarContent } from './Sidebarconfig';
import { useDisclosure } from '@chakra-ui/react';

export const Sidebar = () => {
    const [activeTab,setActiveTab] = useState();
    const navigate = useNavigate();
    const {isOpen,onOpen, onClose} = useDisclosure();
    const [isSearchVisible,setIsSearchVisible] = useState(false);
    const handleTabClick = (title) => {
      setActiveTab(title);
      if (title === "Profile") {
        navigate("/username");
      } else if (title === "Home") {
        navigate("/");
      }else if(title === "Create"){
        onOpen();
      }else if(title === "Search"){
        setIsSearchVisible(true);
      }else{
        setIsSearchVisible(false);
      }
    };
  
  return (
    <div className="sticky top-0 h-[100vh] flex">
    <div className={`flex flex-col justify-between h-full  ${activeTab==="Search"?"px-2" :" px-10"} "`}>
     { <div>
       { activeTab!=="Search" && <div className="pt-10">
          <img
            className="w-40 "
            src="../logo.webp"
            alt=""
          />
        </div>}
        <div className="mt-10">
          {menuSideBarContent.map((item) => (
            <div
              onClick={() => handleTabClick(item.title)}
              className="flex items-center mb-5 cursor-pointer text-lg"
            >
              {activeTab === item.title ? item.activeIcon : item.icon}
              { activeTab!=="Search" && <p
                className={`${
                  activeTab === item.title ? "font-bold" : "font-simibold}"
                }`}
              >
                {item.title}
              </p>}
            </div>
          ))}
        </div>
      </div>}
      <div className="flex items-center cursor-pointer pb-10">
        <IoReorderThreeOutline className="text-2xl" />
        { activeTab!=="Search" && <p className="ml-5">More</p>}
      </div>
    </div>
  </div>
  )
}

