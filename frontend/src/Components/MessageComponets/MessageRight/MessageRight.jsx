import React from "react";
import { AiFillPicture } from "react-icons/ai";
import { FaCircle, FaMicrophone, FaPhoneAlt, FaVideo } from "react-icons/fa";
import { FaCirclePlus } from "react-icons/fa6";
import { IoIosInformationCircleOutline } from "react-icons/io";
import { IoSend } from "react-icons/io5";

const MessageRight = () => {
  return (
    <div className="flex flex-col h-screen">
      <div className="sticky top-0 h-[10%] bg-white z-10">
        <div className="flex mt-2 ml-2 relative items-center">
          <div className="relative h-12 w-12">
            <img
              className="h-12 w-12 rounded-full"
              src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png"
              alt=""
            />
            <FaCircle className="absolute bottom-0 right-0 text-green-500 text-[12px] bg-white rounded-full p-[1px]" />
          </div>

          <div className="ml-2">
            <p className="font-semibold text-lg">UserName</p>
            <p className="font-thin text-sm">online</p>
          </div>
          <FaPhoneAlt className="absolute mr-2 right-20 text-2xl text-gray-600 cursor-pointer" />
          <FaVideo className="absolute right-12 text-2xl text-gray-600 cursor-pointer" />
          <IoIosInformationCircleOutline className="absolute right-2 text-2xl text-gray-600 cursor-pointer" />
        </div>
      </div>
      <hr />
      <div className="h-[80%]">body</div>
      <hr />
      <div className="sticky bottom-0 h-[10%] bg-white flex items-center justify-between px-2">
        <div className="flex items-center w-full">
          <FaCirclePlus className="text-2xl mr-2 cursor-pointer" />
          <AiFillPicture className="text-2xl mr-2 cursor-pointer" />
          <FaMicrophone className="text-2xl mr-2 cursor-pointer" />
          <input
            type="text"
            placeholder="Type a message"
            className="flex-grow h-12 p-2 border rounded-md"
          />
          <IoSend className="text-2xl ml-2 cursor-pointer" />
        </div>
      </div>
    </div>
  );
};

export default MessageRight;
