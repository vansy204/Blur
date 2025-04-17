import React, { useEffect, useState, useRef } from "react";
import { formatDistanceToNow } from 'date-fns';
import { likeStory, unlikeStory } from "../../api/storyApi";
import { timeDifference } from "../../Config/Logic";

const StoryModal = ({ isOpen, onClose, stories, story }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const timerRef = useRef(null);
  const videoRef = useRef(null);
  const modalContentRef = useRef(null);
  
  const currentStory = stories[currentIndex] || {};

  // Kiểm tra xem mediaUrl có phải là video không dựa vào đuôi file
  const isVideo = currentStory.mediaUrl && 
    (currentStory.mediaUrl.toLowerCase().endsWith('.mp4') || 
     currentStory.mediaUrl.toLowerCase().endsWith('.mov') || 
     currentStory.mediaUrl.toLowerCase().endsWith('.webm'));

  // Handle proper cleanup when closing the modal
  const handleClose = () => {
    // Clear any running timers
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    // Stop video playback if active
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      
      // Remove any event listeners
      try {
        videoRef.current.removeEventListener('ended', handleVideoEnd);
      } catch (error) {
        // Ignore if the listener wasn't attached
      }
    }
    
    // Call the parent's onClose function
    onClose();
  };

  // Video end event handler (defined outside useEffect for reuse)
  const handleVideoEnd = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      handleClose(); // Use handleClose instead of onClose directly
    }
  };

  // Handle click outside modal
  const handleOutsideClick = (e) => {
    if (modalContentRef.current && !modalContentRef.current.contains(e.target)) {
      handleClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (isVideo) {
        // Nếu là video, đợi video kết thúc
        if (videoRef.current) {
          videoRef.current.addEventListener('ended', handleVideoEnd);
          
          return () => {
            if (videoRef.current) {
              videoRef.current.removeEventListener('ended', handleVideoEnd);
            }
          };
        }
      } else {
        // Nếu là ảnh, đợi 10 giây
        timerRef.current = setTimeout(() => {
          if (currentIndex < stories.length - 1) {
            setCurrentIndex((prev) => prev + 1);
          } else {
            handleClose(); // Use handleClose instead of onClose directly
          }
        }, 10000); // 10 giây cho ảnh
      }

      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    }
  }, [currentIndex, isOpen, stories.length, isVideo]);

  useEffect(() => {
    // Reset currentIndex và trạng thái âm thanh khi mở modal
    if (isOpen) {
      setCurrentIndex(0);
      setIsMuted(true);
    }
  }, [isOpen]);

  // Cập nhật trạng thái âm thanh khi thay đổi story
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [currentIndex, isMuted]);

  // Cleanup everything when component unmounts
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (videoRef.current) {
        videoRef.current.pause();
      }
    };
  }, []);

  const handleNext = (e) => {
    e.stopPropagation(); // Prevent the click from bubbling up and triggering handleOutsideClick
    
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (videoRef.current) {
      videoRef.current.pause();
    }
    
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = (e) => {
    e.stopPropagation(); // Prevent the click from bubbling up and triggering handleOutsideClick
    
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (videoRef.current) {
      videoRef.current.pause();
    }
    
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  const handleLikeStory = async (storyId) => {
    try {
      if (isLiked) {
        await unlikeStory(storyId);
      } else {
        await likeStory(storyId);
      }
      setIsLiked(!isLiked);
    } catch (error) {
      console.error("Error liking/unliking story:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50"
      onClick={handleOutsideClick}
    >
      <div 
        ref={modalContentRef}
        className="bg-black rounded-xl relative max-w-sm w-full" 
        onClick={(e) => e.stopPropagation()} // Prevent clicks on the modal from closing it
      >
        {/* Close Button */}
        <button
          className="absolute top-2 right-2 text-white bg-black bg-opacity-50 rounded-full w-8 h-8 z-10 flex items-center justify-center cursor-pointer"
          onClick={handleClose}
        >
          ✕
        </button>

        {/* Progress Bars */}
        <div className="absolute top-0 left-0 right-0 flex gap-1 px-2 pt-2 z-10">
          {stories.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 flex-1 rounded-full bg-white/30 overflow-hidden`}
            >
              <div
                className={`h-full bg-white transition-all ${
                  !isVideo && idx === currentIndex ? "duration-[10000ms] w-full" : 
                  idx < currentIndex ? "w-full" : "w-0"
                }`}
              ></div>
            </div>
          ))}
        </div>

        {/* User Info & Timestamp */}
        <div className="absolute top-4 left-2 right-2 flex items-center gap-2 z-10 px-2 pt-4">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-white">
            <img 
              src={currentStory?.userProfileImage || "https://via.placeholder.com/40"} 
              alt="profile" 
              className="w-full h-full object-cover"
              onError={(e) => e.target.src = "https://via.placeholder.com/40"}
            />
          </div>
          <div className="text-white text-sm font-medium">
            {currentStory?.firstName 
              ? `${currentStory.firstName} ${currentStory.lastName || ''}`
              : currentStory?.username || "User"}
          </div>
          <div className="text-white/70 text-xs ml-auto">
            {timeDifference(currentStory?.createdAt)}
          </div>
        </div>

        {/* Content */}
        {currentStory?.mediaUrl && (
          isVideo ? (
            <video
              ref={videoRef}
              src={currentStory.mediaUrl}
              className="w-full h-[500px] object-cover rounded-xl"
              autoPlay
              playsInline
              muted={isMuted}
              onError={(e) => console.error("Video error:", e)}
            />
          ) : (
            <img
              src={currentStory.mediaUrl}
              alt="story"
              className="w-full h-[500px] object-cover rounded-xl"
              onError={(e) => e.target.src = "https://via.placeholder.com/500x500?text=Image+Not+Found"}
            />
          )
        )}

        {/* Caption if any */}
        {currentStory?.content && (
          <div className="absolute bottom-12 left-2 right-2 text-white px-4 py-2 bg-black/50 rounded-lg">
            {currentStory.content}
          </div>
        )}

        {/* Action buttons container */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between z-10">
          {/* Like button */}
          <button 
            onClick={() => handleLikeStory(currentStory.id)}
            className="text-white bg-black bg-opacity-50 rounded-full w-8 h-8 flex items-center justify-center"
          >
            {isLiked ? '❤️' : '🤍'}
          </button>
          
          {/* Audio control button - only for videos */}
          {isVideo && (
            <button 
              onClick={toggleMute}
              className="text-white bg-black bg-opacity-50 rounded-full w-8 h-8 flex items-center justify-center"
            >
              {isMuted ? '🔇' : '🔊'}
            </button>
          )}
        </div>

        {/* Controls */}
        <div className="absolute top-0 left-0 h-full w-1/2" onClick={handlePrev} />
        <div className="absolute top-0 right-0 h-full w-1/2" onClick={handleNext} />
      </div>
    </div>
  );
};

export default StoryModal;