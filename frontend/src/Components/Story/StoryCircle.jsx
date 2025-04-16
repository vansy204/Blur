import React, { useState } from "react";
import StoryModal from "./StoryModal";

const StoryCircle = ({ story }) => {
  const [isOpen, setIsOpen] = useState(false);

  const stories = [story]; // có thể mở rộng nếu 1 user có nhiều story

  return (
    <>
      <div
        onClick={() => setIsOpen(true)}
        className="cursor-pointer flex flex-col items-center"
      >
        <img
          className="w-16 h-16 rounded-full border-2 border-blue-500 p-1 object-cover"
          src={story.mediaUrl}
          alt="story"
        />
        <p className="text-sm mt-1">{story.username || "username"}</p>
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
