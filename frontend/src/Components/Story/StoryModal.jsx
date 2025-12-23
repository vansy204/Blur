import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { likeStory, unlikeStory, deleteStory } from "../../api/storyApi";
import { timeDifference } from "../../Config/Logic";
import { useToast } from "@chakra-ui/react";
import {
  MdClose,
  MdVolumeOff,
  MdVolumeUp,
  MdMoreVert,
  MdDelete,
} from "react-icons/md";
import { AiOutlineHeart } from "react-icons/ai";

const StoryModal = ({
  isOpen,
  onClose,
  stories = [],
  initialStoryId,
  story,
  onDeleteSuccess,
}) => {
  const toast = useToast();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [reaction, setReaction] = useState(null); // null | "LIKE" | "LOVE" | ...
  const [showReactions, setShowReactions] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  const reactionRef = useRef(null);
  const timerRef = useRef(null);
  const videoRef = useRef(null);
  const modalContentRef = useRef(null);

  const currentStory = stories[currentIndex] || {};

  const isVideo = useMemo(() => {
    const url = currentStory?.mediaUrl?.toLowerCase?.() || "";
    return url.endsWith(".mp4") || url.endsWith(".mov") || url.endsWith(".webm");
  }, [currentStory?.mediaUrl]);

  const REACTIONS = useMemo(
    () => [
      { type: "LIKE", label: "👍", name: "Like" },
      { type: "LOVE", label: "❤️", name: "Love" },
      { type: "HAHA", label: "😂", name: "Haha" },
      { type: "WOW", label: "😮", name: "Wow" },
      { type: "SAD", label: "😢", name: "Sad" },
      { type: "ANGRY", label: "😡", name: "Angry" },
    ],
    []
  );

  const getReactionEmoji = (type) =>
    REACTIONS.find((r) => r.type === type)?.label || "❤️";

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const cleanupVideoListener = useCallback(() => {
    try {
      if (videoRef.current) {
        videoRef.current.removeEventListener("ended", handleVideoEnd);
      }
    } catch {}
  }, []);

  const handleClose = useCallback(() => {
    clearTimer();

    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      } catch {}
    }
    cleanupVideoListener();

    onClose?.();
  }, [clearTimer, cleanupVideoListener, onClose]);

  const handleVideoEnd = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      handleClose();
    }
  }, [currentIndex, stories.length, handleClose]);

  // ✅ Close reaction popup khi click ngoài
  useEffect(() => {
    const onDocClick = (e) => {
      if (reactionRef.current && !reactionRef.current.contains(e.target)) {
        setShowReactions(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // ✅ Set index theo initialStoryId khi mở modal
  useEffect(() => {
    if (!isOpen) return;

    const idx = stories.findIndex((s) => String(s?.id) === String(initialStoryId));
    setCurrentIndex(idx >= 0 ? idx : 0);

    setIsMuted(true);
    setShowMenu(false);
    setShowReactions(false);
    setReaction(null);
  }, [isOpen, initialStoryId, stories]);

  // ✅ Reset reaction mỗi khi chuyển story
  useEffect(() => {
    setReaction(null);
    setShowReactions(false);
  }, [currentIndex]);

  // ✅ Auto next story: video -> ended, image -> timer 10s
  useEffect(() => {
    if (!isOpen) return;

    clearTimer();
    cleanupVideoListener();

    if (isVideo) {
      if (videoRef.current) {
        videoRef.current.addEventListener("ended", handleVideoEnd);
      }
      return () => cleanupVideoListener();
    } else {
      timerRef.current = setTimeout(() => {
        if (currentIndex < stories.length - 1) {
          setCurrentIndex((prev) => prev + 1);
        } else {
          handleClose();
        }
      }, 10000);

      return () => clearTimer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, isOpen, stories.length, isVideo, handleVideoEnd, handleClose]);

  // ✅ Sync mute
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = isMuted;
  }, [isMuted, currentIndex]);

  const handleOutsideClick = (e) => {
    if (modalContentRef.current && !modalContentRef.current.contains(e.target)) {
      handleClose();
    }
  };

  const handleNext = (e) => {
    e.stopPropagation();
    clearTimer();
    cleanupVideoListener();
    if (videoRef.current) {
      try {
        videoRef.current.pause();
      } catch {}
    }

    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    clearTimer();
    cleanupVideoListener();
    if (videoRef.current) {
      try {
        videoRef.current.pause();
      } catch {}
    }

    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  const handleReactStory = async (storyId, reactionType) => {
    try {
      if (reaction && reaction === reactionType) {
        await unlikeStory(storyId);
        setReaction(null);
        return;
      }
      await likeStory(storyId, reactionType);
      setReaction(reactionType);
    } catch (error) {
      console.error("Error reacting story:", error);
      toast({
        title: "Lỗi",
        description: "Không thể react story. Vui lòng thử lại.",
        status: "error",
        duration: 2500,
        isClosable: true,
      });
    } finally {
      setShowReactions(false);
    }
  };

  const handleDeleteStory = async (storyId) => {
    if (!storyId) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa story. ID không hợp lệ.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const result = await deleteStory(storyId);
      if (result) {
        toast({
          title: "Đã xóa story",
          description: "Story đã được xóa thành công.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });

        if (typeof onDeleteSuccess === "function") onDeleteSuccess(storyId);
        handleClose();
      } else {
        toast({
          title: "Lỗi",
          description: "Không thể xóa story. Vui lòng thử lại.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error("Error deleting story:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra khi xóa story.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-sm flex justify-center items-center z-50 p-4"
      onClick={handleOutsideClick}
    >
      <div
        ref={modalContentRef}
        className="relative w-[360px] sm:w-[420px] aspect-[9/16] bg-black rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          className="absolute top-4 right-4 z-[80] w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm flex items-center justify-center transition-all group"
          onClick={handleClose}
        >
          <MdClose className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
        </button>

        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 flex gap-1 px-3 pt-3 z-[70]">
          {stories.map((_, idx) => (
            <div
              key={idx}
              className="h-1 flex-1 rounded-full bg-white/20 overflow-hidden backdrop-blur-sm"
            >
              <div
                className={`h-full bg-gradient-to-r from-sky-400 to-blue-500 rounded-full transition-all ${
                  !isVideo && idx === currentIndex
                    ? "duration-[10000ms] w-full"
                    : idx < currentIndex
                    ? "w-full"
                    : "w-0"
                }`}
              />
            </div>
          ))}
        </div>

        {/* User info header */}
        <div className="absolute top-12 left-3 right-3 flex items-center gap-3 z-[70] px-2">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-sky-400 shadow-lg">
            <img
              src={currentStory?.userProfileImage}
              alt="profile"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1">
            <div className="text-white text-sm font-semibold drop-shadow-lg">
              {currentStory?.firstName
                ? `${currentStory.firstName} ${currentStory.lastName || ""}`
                : currentStory?.username || "User"}
            </div>
            <div className="text-white/80 text-xs drop-shadow">
              {timeDifference(currentStory?.createdAt)}
            </div>
          </div>

          {/* Menu button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu((v) => !v);
            }}
            className="w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm flex items-center justify-center transition-all"
          >
            <MdMoreVert className="text-white w-5 h-5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-12 bg-white rounded-xl shadow-xl overflow-hidden min-w-[160px] z-[90]">
              <button
                onClick={() => {
                  handleDeleteStory(currentStory.id);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
              >
                <MdDelete className="w-5 h-5" />
                Xóa Story
              </button>
            </div>
          )}
        </div>

        {/* Media content */}
        <div className="absolute inset-0 bg-black pointer-events-none">
          {isVideo ? (
            <video
              ref={videoRef}
              src={currentStory.mediaUrl}
              className="w-full h-full object-contain pointer-events-none"
              autoPlay
              playsInline
              muted={isMuted}
            />
          ) : (
            <img
              src={currentStory.mediaUrl}
              className="w-full h-full object-contain pointer-events-none"
              alt=""
            />
          )}
        </div>

        {/* Caption */}
        {currentStory?.content && (
          <div className="absolute bottom-20 left-4 right-4 text-white px-4 py-3 bg-black/60 backdrop-blur-md rounded-xl shadow-lg z-[70]">
            <p className="text-sm leading-relaxed">{currentStory.content}</p>
          </div>
        )}

        {/* Action buttons (✅ z cao hơn vùng click next/prev) */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-[80] gap-3">
          {/* Reaction button + picker */}
          <div className="relative" ref={reactionRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!currentStory?.id) return;

                // ✅ click để mở/tắt picker (mobile friendly)
                setShowReactions((v) => !v);
              }}
              onMouseEnter={() => setShowReactions(true)}
              className="w-11 h-11 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm flex items-center justify-center transition-all group"
              title="React"
            >
              {reaction ? (
                <span className="text-2xl group-hover:scale-110 transition-transform">
                  {getReactionEmoji(reaction)}
                </span>
              ) : (
                <AiOutlineHeart className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
              )}
            </button>

            {showReactions && (
              <div
                onClick={(e) => e.stopPropagation()}
                onMouseEnter={() => setShowReactions(true)}
                onMouseLeave={() => setShowReactions(false)}
                className="absolute bottom-14 left-0 z-[999] pointer-events-auto
                           bg-black/70 backdrop-blur-md rounded-full px-3 py-2
                           flex gap-2 shadow-xl border border-white/10"
              >
                {REACTIONS.map((r) => (
                  <button
                    key={r.type}
                    onClick={() =>
                      currentStory?.id && handleReactStory(currentStory.id, r.type)
                    }
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xl
                                transition-transform hover:scale-125 ${
                                  reaction === r.type ? "bg-white/15" : "bg-transparent"
                                }`}
                    title={r.name}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mute button */}
          {isVideo && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleMute();
              }}
              className="w-11 h-11 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm flex items-center justify-center transition-all group"
            >
              {isMuted ? (
                <MdVolumeOff className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
              ) : (
                <MdVolumeUp className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
              )}
            </button>
          )}
        </div>

        {/* Navigation areas (✅ z thấp hơn action bar để không che popup react) */}
        <div
          className="absolute inset-y-0 left-0 w-1/2 z-[30] cursor-pointer"
          onClick={handlePrev}
        />
        <div
          className="absolute inset-y-0 right-0 w-1/2 z-[30] cursor-pointer"
          onClick={handleNext}
        />
      </div>
    </div>
  );
};

export default StoryModal;
