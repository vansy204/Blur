import React from "react";
import { MessageLeftCard } from "./MessageLeftCard";

const MessageLeft = () => {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="sticky top-0 bg-white z-10">
        <div className="flex ml-2 pb-4 mt-5">
          <img
            className="rounded-full h-20 w-20"
            src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png"
            alt=""
          />
          <div className="pl-2 mt-4">
            <p className="text-xl">UserName</p>
            <p>Name</p>
          </div>
        </div>
        <p className="ml-2 font-semibold text-xl pb-2 border-b">Chats</p>
      </div>
      <div className="flex">
        <div className="w-full ml-2 mr-2">
          {[1, 1, 1, 1, 1, 1, 1, 1, 1, 1].map((item, index) => (
            <MessageLeftCard key={index} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MessageLeft;
