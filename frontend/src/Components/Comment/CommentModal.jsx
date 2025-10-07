import React, { useEffect, useRef, useState } from "react";
import { Modal, ModalBody, ModalContent, ModalOverlay } from "@chakra-ui/react";
import {
  BsBookmark,
  BsBookmarkFill,
  BsThreeDots,
  BsEmojiSmile,
} from "react-icons/bs";
import CommentCard from "./CommentCard";
import { RiSendPlaneLine } from "react-icons/ri";
import { FaRegComment } from "react-icons/fa";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { IoSend } from "react-icons/io5";
import { MdClose } from "react-icons/md";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { timeDifference } from "../../Config/Logic";
import EmojiPicker from "emoji-picker-react";
import { getToken } from "../../service/LocalStorageService";
import { fetchUserByUserId } from "../../api/userApi";

const CommentModal = ({
  user,
  post,
  comments,
  postMedia,
  likeCount,
  isOpen,
  onClose,
  isSaved,
  isPostLike,
  handlePostLike,
  handleSavePost,
  handleCreateComment,
}) => {
  const [isPlaying, setIsPlaying] = useState({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [comment, setComment] = useState("");
  const videoRefs = useRef([]);
  const [commentUsers, setCommentUsers] = useState({});
  const token = getToken();

  const togglePlayPause = (index) => {
    const video = videoRefs.current[index];
    if (!video) return;

    if (isPlaying[index]) {
      video.pause();
    } else {
      video.play();
    }

    setIsPlaying((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleEmojiClick = (emojiObject) => {
    setComment((prev) => prev + emojiObject.emoji);
  };

  useEffect(() => {
    const fetchUsers = async () => {
      const usersData = {};

      await Promise.all(
        comments.map(async (comment) => {
          if (!commentUsers[comment.userId]) {
            try {
              const userData = await fetchUserByUserId(comment.userId, token);
              usersData[comment.userId] = userData;
            } catch (error) {
              console.error("Failed to fetch user:", error);
            }
          }
        })
      );

      setCommentUsers((prev) => ({ ...prev, ...usersData }));
    };

    fetchUsers();
  }, [comments, token]);

  return (
    <Modal size={"4xl"} onClose={onClose} isOpen={isOpen} isCentered>
      <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(4px)" />
      <ModalContent borderRadius="2xl" overflow="hidden" shadow="2xl">
        <ModalBody p={0}>
          <div className="flex h-[85vh] bg-white">
            {/* Media Section */}
            <div className="w-[55%] flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm flex items-center justify-center transition-all group"
              >
                <MdClose className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
              </button>

              {postMedia?.length > 0 ? (
                <Swiper
                  className="w-full h-full flex items-center justify-center"
                  navigation
                  pagination={{ 
                    clickable: true,
                    bulletActiveClass: 'swiper-pagination-bullet-active !bg-sky-500'
                  }}
                  modules={[Navigation, Pagination]}
                >
                  {postMedia.map((url, index) => {
                    const isVideo = url.match(/\.(mp4|webm|ogg)$/i);
                    return (
                      <SwiperSlide
                        key={index}
                        className="flex items-center justify-center"
                      >
                        {isVideo ? (
                          <div className="relative w-full h-full flex items-center justify-center">
                            <video
                              ref={(el) => (videoRefs.current[index] = el)}
                              src={url}
                              controls
                              className="max-w-full max-h-full object-contain"
                              onClick={() => togglePlayPause(index)}
                            />
                          </div>
                        ) : (
                          <img
                            src={url}
                            className="max-w-full max-h-full object-contain"
                            alt={`Post Media ${index}`}
                          />
                        )}
                      </SwiperSlide>
                    );
                  })}
                </Swiper>
              ) : (
                <p className="text-gray-400">No media available</p>
              )}
            </div>

            {/* Comments Section */}
            <div className="w-[45%] flex flex-col bg-white">
              {/* Header */}
              <div className="flex justify-between items-center px-4 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-sky-400 to-blue-500 rounded-full blur-sm opacity-20"></div>
                    <img
                      className="relative w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                      src={
                        post?.userImageUrl ||
                        "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png"
                      }
                      alt="User Avatar"
                    />
                  </div>
                  <p className="font-semibold text-gray-800 hover:text-sky-600 cursor-pointer transition-colors">
                    {post?.userName}
                  </p>
                </div>
                <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                  <BsThreeDots className="text-gray-600" />
                </button>
              </div>

              {/* Comments List */}
              <div className="flex-1 overflow-auto px-4 py-2 bg-gray-50">
                {comments.length > 0 ? (
                  comments
                    .slice()
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .map((comment, index) => (
                      <CommentCard
                        key={index}
                        comment={comment}
                        user={commentUsers[comment.userId] || {}}
                      />
                    ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-br from-sky-100 to-blue-100 rounded-full flex items-center justify-center mb-4">
                      <FaRegComment className="w-8 h-8 text-sky-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">
                      No comments yet
                    </h3>
                    <p className="text-sm text-gray-500">
                      Be the first to comment
                    </p>
                  </div>
                )}
              </div>

              {/* Actions & Stats */}
              <div className="border-t border-gray-100 bg-white">
                {/* Action Buttons */}
                <div className="flex justify-between items-center px-4 py-3">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handlePostLike}
                      className="group transition-transform hover:scale-110 active:scale-95"
                    >
                      {isPostLike ? (
                        <AiFillHeart className="text-2xl text-red-500 animate-pulse" />
                      ) : (
                        <AiOutlineHeart className="text-2xl text-gray-700 group-hover:text-red-500 transition-colors" />
                      )}
                    </button>
                    <button className="group transition-transform hover:scale-110 active:scale-95">
                      <FaRegComment className="text-xl text-gray-700 group-hover:text-sky-500 transition-colors" />
                    </button>
                    <button className="group transition-transform hover:scale-110 active:scale-95">
                      <RiSendPlaneLine className="text-xl text-gray-700 group-hover:text-sky-500 transition-colors" />
                    </button>
                  </div>

                  <button
                    onClick={handleSavePost}
                    className="group transition-transform hover:scale-110 active:scale-95"
                  >
                    {isSaved ? (
                      <BsBookmarkFill className="text-xl text-sky-500" />
                    ) : (
                      <BsBookmark className="text-xl text-gray-700 group-hover:text-sky-500 transition-colors" />
                    )}
                  </button>
                </div>

                {/* Stats */}
                <div className="px-4 pb-3 space-y-1">
                  <p className="font-semibold text-sm text-gray-800">
                    {likeCount || 0} {likeCount === 1 ? 'like' : 'likes'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {timeDifference(post?.createdAt)}
                  </p>
                </div>

                {/* Comment Input */}
                <div className="relative flex items-center border-t border-gray-100 px-4 py-3 bg-white">
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="text-gray-400 hover:text-sky-500 transition-colors"
                  >
                    <BsEmojiSmile className="text-xl" />
                  </button>

                  {showEmojiPicker && (
                    <div className="absolute bottom-16 left-4 z-20 shadow-2xl rounded-xl overflow-hidden">
                      <EmojiPicker onEmojiClick={handleEmojiClick} height={350} width={300} />
                    </div>
                  )}

                  <input
                    className="flex-1 mx-3 outline-none text-sm placeholder-gray-400 focus:placeholder-gray-500"
                    type="text"
                    placeholder="Add a comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && comment.trim()) {
                        handleCreateComment(comment);
                        setComment("");
                      }
                    }}
                  />

                  {comment.trim() && (
                    <button
                      onClick={() => {
                        if (comment.trim()) {
                          handleCreateComment(comment);
                          setComment("");
                        }
                      }}
                      className="text-sky-500 hover:text-sky-600 transition-colors"
                    >
                      <IoSend className="text-xl" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default CommentModal;