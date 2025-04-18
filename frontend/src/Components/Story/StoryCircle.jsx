import React, { useState, useEffect } from "react";
import StoryModal from "./StoryModal";
import AddStoryModal from "./AddStoryModal";

const StoryCircle = ({ story, stories = [], isAddNew = false, onStoryCreated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleOpenStory = () => {
    if (isAddNew) {
      setShowCreateModal(true);
    } else {
      setIsOpen(true);
    }
  };

  const handleStoryCreated = (newStory) => {
    // Make sure onStoryCreated is called with the complete newStory object
    // which should include the thumbnailUrl if it's a video
    if (onStoryCreated && typeof onStoryCreated === 'function') {
      onStoryCreated(newStory);
    }
    setShowCreateModal(false);
  };

  const userStories = stories.length > 0 ? stories : [story];

  const getDisplayName = () => {
    if (isAddNew) return "Tạo tin";
    if (!story) return "Người dùng";
    if (story.firstName) return `${story.firstName} ${story.lastName || ""}`.trim();
    return story.username || "Người dùng";
  };

  const isVideo = story?.mediaType === "video";

  // Function to get the right media preview URL
  const getMediaPreview = () => {
    // For videos, prioritize thumbnailUrl
    if (isVideo && story?.thumbnailUrl) {
      return story.thumbnailUrl;
    }
    // Fall back to mediaUrl or placeholder
    return story?.mediaUrl || "https://placehold.co/300x500";
  };

  const renderAddStory = () => (
    <div
      onClick={handleOpenStory}
      className="cursor-pointer w-28 h-48 rounded-xl overflow-hidden bg-gray-200 relative group"
    >
      <img
        src={story?.mediaUrl || "https://placehold.co/300x500?text=+"}
        alt="Tạo story"
        className="w-full h-full object-cover group-hover:brightness-75 transition"
      />
      <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-30 transition" />
      <div className="absolute top-2 left-2 w-10 h-10 rounded-full bg-white flex items-center justify-center text-blue-500 text-xl font-bold border-2 border-blue-500">
        +
      </div>
      <div className="absolute bottom-2 left-2 right-2 text-sm font-semibold text-white">
        Tạo tin
      </div>
    </div>
  );

  const renderStoryItem = () => (
    <div
      onClick={handleOpenStory}
      className="cursor-pointer w-28 h-48 rounded-xl overflow-hidden relative group"
    >
      {/* Use getMediaPreview() to get the right image URL */}
      <img
        src={getMediaPreview()}
        alt="story"
        className="w-full h-full object-cover group-hover:brightness-75 transition"
        onError={(e) => {
          console.log("Image error, falling back to placeholder");
          e.target.src = "https://placehold.co/300x500";
        }}
      />
  
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
  
      <div className="absolute top-2 left-2 w-10 h-10 rounded-full border-4 border-blue-500 overflow-hidden">
        <img
          src={story?.userProfileImage || "https://via.placeholder.com/150"}
          alt="avatar"
          className="w-full h-full object-cover"
          onError={(e) => e.target.src = "https://via.placeholder.com/150"}
        />
      </div>
  
      <div className="absolute bottom-2 left-2 right-2 text-sm font-semibold text-white line-clamp-1">
        {getDisplayName()}
      </div>
  
      {isVideo && (
        <div className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-4.586-2.663A1 1 0 009 9.337v5.326a1 1 0 001.166.832l4.586-2.663a1 1 0 000-1.664z" />
          </svg>
        </div>
      )}
    </div>
  );
  
  return (
    <>
      {isAddNew ? renderAddStory() : renderStoryItem()}

      {!isAddNew && (
        <StoryModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          stories={userStories}
          story={story}
        />
      )}

      {isAddNew && showCreateModal && (
        <AddStoryModal
          onClose={() => setShowCreateModal(false)}
          onStoryCreated={handleStoryCreated}
        />
      )}
    </>
  );
};

export default StoryCircle;