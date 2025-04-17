import React, { useState } from "react";
import StoryModal from "./StoryModal";
import AddStoryModal from "./AddStoryModal";

const StoryCircle = ({ story, stories = [], isAddNew = false, onStoryCreated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Story preview
  const handleOpenStory = () => {
    if (isAddNew) {
      setShowCreateModal(true); // Mở modal tạo mới
    } else {
      setIsOpen(true); // Mở modal xem story
    }
  };

  // Xử lý khi tạo story mới thành công
  const handleStoryCreated = (newStory) => {
    if (onStoryCreated && typeof onStoryCreated === 'function') {
      onStoryCreated(newStory);
    }
    setShowCreateModal(false);
  };

  // Sử dụng tất cả stories của user này (nếu được truyền vào) hoặc chỉ story hiện tại
  const userStories = stories.length > 0 ? stories : [story];

  // Lấy thông tin hiển thị cho story circle
  const getDisplayName = () => {
    if (isAddNew) return "Tạo";
    if (!story) return "User";
    
    // Ưu tiên firstName + lastName nếu có
    if (story.firstName) {
      return `${story.firstName} ${story.lastName || ''}`.trim();
    }
    
    // Nếu không có firstName thì dùng username
    return story.username || "User";
  };

  return (
    <>
      <div
        onClick={handleOpenStory}
        className="cursor-pointer flex flex-col items-center"
      >
        {isAddNew ? (
          <>
            <div className="w-16 h-16 rounded-full border-2 border-gray-300 p-1 relative">
              <img
                src="https://cdn-icons-png.flaticon.com/512/1828/1828919.png"
                alt="Add Story"
                className="w-full h-full rounded-full object-cover"
              />
              <div className="absolute bottom-0 right-0 bg-blue-500 w-5 h-5 rounded-full text-white text-xs flex items-center justify-center">
                +
              </div>
            </div>
            <p className="text-sm mt-1">Tạo</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full border-2 border-blue-500 p-1">
              <img
                className="w-full h-full rounded-full object-cover"
                src={story?.mediaUrl || story?.userProfileImage || "https://via.placeholder.com/150"}
                alt="story"
                style={{ objectPosition: "center", imageRendering: "crisp-edges" }}
                onError={(e) => e.target.src = "https://via.placeholder.com/150"}
              />
            </div>
            <p className="text-sm mt-1">{getDisplayName()}</p>
          </>
        )}
      </div>

      {/* Xem story */}
      {!isAddNew && (
        <StoryModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          stories={userStories} // Truyền tất cả stories của user này
          story={story} // Truyền story hiện tại vào modal
        />
      )}

      {/* Tạo story */}
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