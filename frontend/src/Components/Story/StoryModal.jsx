import React, { useEffect, useState, useRef } from "react";
import { formatDistanceToNow } from 'date-fns';
import { likeStory, unlikeStory, deleteStory } from "../../api/storyApi";
import { timeDifference } from "../../Config/Logic";
import { useToast } from '@chakra-ui/react';

const StoryModal = ({ isOpen, onClose, stories, story, onDeleteSuccess }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const timerRef = useRef(null);
  const videoRef = useRef(null);
  const modalContentRef = useRef(null);
  const toast = useToast();
  
  const currentStory = stories[currentIndex] || {};

  // Kiểm tra xem mediaUrl có phải là video không dựa vào đuôi file
  const isVideo = currentStory.mediaUrl && 
    (currentStory.mediaUrl.toLowerCase().endsWith('.mp4') || 
    currentStory.mediaUrl.toLowerCase().endsWith('.mov') || 
    currentStory.mediaUrl.toLowerCase().endsWith('.webm'));

  const handleClose = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      
      try {
        videoRef.current.removeEventListener('ended', handleVideoEnd);
      } catch (error) {}
    }
    
    onClose();
  };

  const handleVideoEnd = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      handleClose();
    }
  };

  const handleOutsideClick = (e) => {
    if (modalContentRef.current && !modalContentRef.current.contains(e.target)) {
      handleClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (isVideo) {
        if (videoRef.current) {
          videoRef.current.addEventListener('ended', handleVideoEnd);
          return () => {
            if (videoRef.current) {
              videoRef.current.removeEventListener('ended', handleVideoEnd);
            }
          };
        }
      } else {
        timerRef.current = setTimeout(() => {
          if (currentIndex < stories.length - 1) {
            setCurrentIndex((prev) => prev + 1);
          } else {
            handleClose();
          }
        }, 10000);
      }

      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    }
  }, [currentIndex, isOpen, stories.length, isVideo]);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setIsMuted(true);
    }
  }, [isOpen]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [currentIndex, isMuted]);

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
    e.stopPropagation();
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
    e.stopPropagation();
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

  const handleDeleteStory = async (storyId) => {
    if (!storyId) {
      toast({
        title: "Error",
        description: "Cannot delete story. Invalid story ID.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    try {
      const result = await deleteStory(storyId);
      if (result) {
        toast({
          title: "Story deleted",
          description: "The story has been deleted successfully.",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        
        // Gọi callback để thông báo xoá thành công và gửi ID story đã xoá
        if (typeof onDeleteSuccess === 'function') {
          onDeleteSuccess(storyId);
        }
        
        handleClose();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete the story. Please try again.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error("Error deleting story:", error);
      toast({
        title: "Error",
        description: error.message || "Something went wrong while deleting the story.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
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
        className="bg-black rounded-xl relative max-w-lg w-full" 
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-2 right-2 text-white bg-black bg-opacity-50 rounded-full w-8 h-8 z-10 flex items-center justify-center cursor-pointer"
          onClick={handleClose}
        >
          ✕
        </button>

        <div className="absolute top-0 left-0 right-0 flex gap-1 px-2 pt-2 z-10">
          {stories.map((_, idx) => (
            <div
              key={idx}
              className="h-1 flex-1 rounded-full bg-white/30 overflow-hidden"
            >
              <div
                className={`h-full bg-white transition-all ${!isVideo && idx === currentIndex ? "duration-[10000ms] w-full" : idx < currentIndex ? "w-full" : "w-0"}`}></div>
            </div>
          ))}
        </div>

        <div className="absolute top-4 left-2 right-2 flex items-center gap-2 z-10 px-2 pt-4">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-white">
            <img 
              src={currentStory?.userProfileImage} 
              alt="profile" 
              className="w-full h-full object-cover"
         
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
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="text-white ml-2"
          >
            ⋮
          </button>
          {showMenu && (
            <div className="absolute right-2 bg-black bg-opacity-70 rounded-lg p-2">
              <button
                onClick={() => handleDeleteStory(currentStory.id)}
                className="text-white text-sm"
              >
                Delete Story
              </button>
            </div>
          )}
        </div>

        {currentStory?.mediaUrl && (
          isVideo ? (
            <video
              ref={videoRef}
              src={currentStory.mediaUrl}
              className="w-full object-cover rounded-xl"
              autoPlay
              playsInline
              muted={isMuted}
              onError={(e) => console.error("Video error:", e)}
            />
          ) : (
            <img
              src={currentStory.mediaUrl}
              alt="story"
              className="w-full object-cover rounded-xl"

            />
          )
        )}

        {currentStory?.content && (
          <div className="absolute bottom-12 left-2 right-2 text-white px-4 py-2 bg-black/50 rounded-lg">
            {currentStory.content}
          </div>
        )}

        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between z-10">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (currentStory && currentStory.id) {
                handleLikeStory(currentStory.id);
              }
            }}
            className="text-white bg-black bg-opacity-50 rounded-full w-8 h-8 flex items-center justify-center"
          >
            {isLiked ? '❤️' : '🤍'}
          </button>

          {isVideo && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleMute();
              }}
              className="text-white bg-black bg-opacity-50 rounded-full w-8 h-8 flex items-center justify-center"
            >
              {isMuted ? '🔇' : '🔊'}
            </button>
          )}
        </div>

        <div className="absolute top-0 left-0 h-full w-1/2" onClick={handlePrev} />
        <div className="absolute top-0 right-0 h-full w-1/2" onClick={handleNext} />
      </div>
    </div>
  );
};

export default StoryModal;
