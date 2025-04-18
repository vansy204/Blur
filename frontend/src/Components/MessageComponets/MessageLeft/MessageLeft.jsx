import React from "react";
import { MessageLeftCard } from "./MessageLeftCard";

const MessageLeft = () => {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-gray-50">
      <div className="sticky top-0 bg-white z-10 shadow-md p-4">
        <div className="flex items-center">
          <img
            className="rounded-full h-16 w-16"
            src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png"
            alt="Profile"
          />
          <div className="pl-4">
            <p className="text-xl font-semibold">UserName</p>
            <p className="text-sm text-gray-500">Full Name</p>
          </div>
        </div>
        <p className="mt-4 font-semibold text-lg border-b pb-2">Chats</p>
      </div>
      <div className="p-2 space-y-2">
        {[...Array(10)].map((_, index) => (
          <MessageLeftCard key={index} />
        ))}
      </div>
    </div>
  );
};

export default MessageLeft;
