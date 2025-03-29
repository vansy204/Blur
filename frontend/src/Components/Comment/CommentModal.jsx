import React, { useEffect, useRef, useState } from "react";
import "./CommentModal.css";
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
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { timeDifference } from "../../Config/Logic";
import { IoSend } from "react-icons/io5";
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
  const [commentUsers,setCommentUsers] = useState({});
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
      <ModalOverlay />
      <ModalContent>
        <ModalBody>
          <div className="flex h-[80vh]">
            {/* Hiển thị ảnh bài viết */}
            <div className="w-[50%] flex items-center justify-center bg-black">
              {postMedia?.length > 0 ? (
                <Swiper
                  className="w-full h-full flex items-center justify-center"
                  navigation
                  pagination={{ clickable: true }}
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
                <p className="text-gray-500">No media available</p>
              )}
            </div>

            {/* Phần comment */}
            <div className="w-[50%] pl-5 flex flex-col">
              <div className="flex justify-between items-center py-5">
                <div className="flex items-center">
                  <img
                    className="w-9 h-9 rounded-full"
                    src={
                      post?.userImageUrl ||
                      "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png"
                    }
                    alt="User Avatar"
                  />
                  <p className="ml-2 font-semibold">{post?.userName}</p>
                </div>
                <BsThreeDots className="cursor-pointer" />
              </div>
              <hr />

              {/* Danh sách comment */}
              {/* Danh sách comment */}
              <div className="flex-1 overflow-auto max-h-[55vh] pr-2">
                {comments
                  .slice()
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // Sắp xếp theo thời gian
                  .map((comment, index) => (
                    <CommentCard key={index} comment={comment} user={commentUsers[comment.userId] || {}} />
                  ))}
                {comments.length === 0 && (
                  <p className="text-gray-500">No comments yet</p>
                )}
              </div>

              {/* Like, Comment, Save */}
              <div className="py-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    {isPostLike ? (
                      <AiFillHeart
                        className="text-2xl text-red-600 cursor-pointer hover:opacity-50"
                        onClick={handlePostLike}
                      />
                    ) : (
                      <AiOutlineHeart
                        className="text-2xl cursor-pointer hover:opacity-50"
                        onClick={handlePostLike}
                      />
                    )}
                    <FaRegComment className="text-xl cursor-pointer hover:opacity-50" />
                    <RiSendPlaneLine className="text-xl cursor-pointer hover:opacity-50" />
                  </div>

                  {/* Nút lưu bài viết */}
                  <div className="cursor-pointer">
                    {isSaved ? (
                      <BsBookmarkFill
                        onClick={handleSavePost}
                        className="text-xl cursor-pointer hover:opacity-50"
                      />
                    ) : (
                      <BsBookmark
                        onClick={handleSavePost}
                        className="text-xl cursor-pointer hover:opacity-50"
                      />
                    )}
                  </div>
                </div>

                {/* Hiển thị số like & số comment */}
                <div className="py-2">
                  <p className="font-semibold">{likeCount || 0} likes</p>
                  <p className="text-sm text-gray-500">
                    {comments?.length} comments
                  </p>
                  <p className="opacity-50 text-xs">
                    {timeDifference(post?.createdAt) || "Ngày đăng"}
                  </p>
                </div>

                {/* Ô nhập bình luận */}
                <div className="relative flex items-center border-t py-2">
                  <BsEmojiSmile
                    className="text-xl text-gray-500 cursor-pointer"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  />

                  {showEmojiPicker && (
                    <div className="absolute bottom-10 left-0 z-10">
                      <EmojiPicker onEmojiClick={handleEmojiClick} />
                    </div>
                  )}

                  <input
                    className="flex-1 ml-2 border-none outline-none"
                    type="text"
                    placeholder="Thêm bình luận..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && comment.trim()) {
                        handleCreateComment(comment);
                        setComment("");
                      }
                    }}
                  />

                  <IoSend
                    className="cursor-pointer"
                    onClick={() => {
                      if (comment.trim()) {
                        handleCreateComment(comment);
                        setComment(""); // Xóa nội dung sau khi gửi
                      }
                    }}
                  />
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
