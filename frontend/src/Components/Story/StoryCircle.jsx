import React, { useState } from "react";
import StoryModal from "./StoryModal";

const StoryCircle = () => {
  const [isOpen, setIsOpen] = useState(false);

  const stories = [
    {
      type: "image",
      url: "https://cdn.pixabay.com/photo/2023/06/22/06/53/beautiful-girl-8080757_640.jpg",
    },
    {
      type: "image",
      url: "https://cdn.pixabay.com/photo/2021/06/17/18/58/flowers-6344661_640.jpg",
    },
    {
      type: "video",
      url: "https://www.w3schools.com/html/mov_bbb.mp4",
    },
  ];

  return (
    <>
      <div
        onClick={() => setIsOpen(true)}
        className="cursor-pointer flex flex-col items-center"
      >
        <img
          className="w-16 h-16 rounded-full border-2 border-blue-500 p-1"
          src={stories[0].url}
          alt="story"
        />
        <p className="">username</p>
      </div>

      <StoryModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        stories={stories}
      />
    </>
  );
};

export default StoryCircle;
