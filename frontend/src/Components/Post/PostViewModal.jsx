import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  useToast,
} from "@chakra-ui/react";
import {
  BsBookmark,
  BsBookmarkFill,
  BsThreeDots,
  BsEmojiSmile,
} from "react-icons/bs";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { FaRegComment } from "react-icons/fa";
import { MdClose } from "react-icons/md";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { timeDifference } from "../../Config/Logic";
import EmojiPicker from "emoji-picker-react";
import { getToken } from "../../service/LocalStorageService";
import {
  likePost,
  fetchAllComments, // ✅ FIX: dùng fetchAllComments thay vì getComments
  createComment,
} from "../../api/postApi";
import { fetchUserByUserId } from "../../api/userApi";
// ✅ FIX: Import CommentCard từ đúng path
import CommentCard from "../Comment/CommentCard";

const PostViewModal = ({ isOpen, onClose, post, currentUserId }) => {
  const [postData, setPostData] = useState(post);
  const [comments, setComments] = useState([]);
  const [commentUsers, setCommentUsers] = useState({});
  const [comment, setComment] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isPlaying, setIsPlaying] = useState({});
  const [mediaDimensions, setMediaDimensions] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const videoRefs = useRef([]);
  const token = getToken();
  const toast = useToast();

  // ✅ Load comments khi mở modal
  useEffect(() => {
    if (!isOpen || !postData?.id) return;

    const loadComments = async () => {
      try {
        const commentsData = await fetchAllComments(postData.id, token); // ✅ FIX
        setComments(commentsData || []);
      } catch (error) {
        console.error("Error loading comments:", error);
      }
    };

    loadComments();
  }, [isOpen, postData?.id, token]);

  // ✅ Fetch user info cho comments
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

    if (comments.length > 0) fetchUsers();
  }, [comments, token]);

  // ✅ Handle like
  const handleLike = async () => {
    try {
      await likePost(postData.id, token);
      setPostData((prev) => ({
        ...prev,
        isLiked: !prev.isLiked,
        likeCount: prev.isLiked ? prev.likeCount - 1 : prev.likeCount + 1,
      }));
    } catch (error) {
      console.error("Error liking post:", error);
      toast({
        title: "Không thể like bài viết",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
    }
  };

  // ✅ FIX: Handle save - tạm thời comment out hoặc implement logic khác
  const handleSave = async () => {
    // ✅ Nếu bạn có API save riêng, thêm vào postApi.js:
    // export const savePost = async (postId, token) => { ... }
    
    // ✅ Tạm thời chỉ update UI (fake save)
    setPostData((prev) => ({ ...prev, isSaved: !prev.isSaved }));
    toast({
      title: postData.isSaved ? "Đã bỏ lưu bài viết" : "Đã lưu bài viết",
      status: "success",
      duration: 2000,
      isClosable: true,
    });
    
    /* ✅ KHI CÓ API, uncomment đoạn này:
    try {
      await savePost(postData.id, token);
      setPostData((prev) => ({ ...prev, isSaved: !prev.isSaved }));
      toast({
        title: postData.isSaved ? "Đã bỏ lưu bài viết" : "Đã lưu bài viết",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error saving post:", error);
    }
    */
  };

  // ✅ Handle comment
  const handleCreateComment = async (commentText) => {
    if (!commentText.trim()) return;

    try {
      setIsLoading(true);
      const newComment = await createComment(postData.id, commentText, token);
      setComments((prev) => [newComment, ...prev]);
      setComment("");
      setShowEmojiPicker(false);
      toast({
        title: "Đã gửi bình luận",
        status: "success",
        duration: 1500,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error creating comment:", error);
      toast({
        title: "Không thể gửi bình luận",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Video controls
  const togglePlayPause = (index) => {
    const video = videoRefs.current[index];
    if (!video) return;

    if (isPlaying[index]) {
      video.pause();
    } else {
      video.play();
    }

    setIsPlaying((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  // ✅ Emoji picker
  const handleEmojiClick = (emojiObject) => {
    setComment((prev) => prev + emojiObject.emoji);
  };

  // ✅ Track dimensions
  const handleImageLoad = (index, e) => {
    const img = e.target;
    setMediaDimensions((prev) => ({
      ...prev,
      [index]: {
        aspectRatio: img.naturalWidth / img.naturalHeight,
        width: img.naturalWidth,
        height: img.naturalHeight,
      },
    }));
  };

  const handleVideoLoad = (index, e) => {
    const video = e.target;
    setMediaDimensions((prev) => ({
      ...prev,
      [index]: {
        aspectRatio: video.videoWidth / video.videoHeight,
        width: video.videoWidth,
        height: video.videoHeight,
      },
    }));
  };

  const getObjectFit = (index) => {
    const dimension = mediaDimensions[index];
    if (!dimension) return "cover";
    return dimension.aspectRatio > 1 ? "contain" : "cover";
  };

  if (!postData) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl" isCentered>
      <ModalOverlay bg="blackAlpha.800" />
      <ModalContent
        maxW="90vw"
        maxH="90vh"
        bg="white"
        borderRadius="xl"
        overflow="hidden"
      >
        <ModalBody p={0} className="flex h-[90vh]">
          {/* ===== LEFT: MEDIA ===== */}
          <div className="w-[60%] bg-black flex items-center justify-center relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all"
            >
              <MdClose size={24} />
            </button>

            {postData.media?.length > 0 ? (
              <Swiper
                modules={[Navigation, Pagination]}
                navigation
                pagination={{ clickable: true }}
                className="w-full h-full"
              >
                {postData.media.map((url, index) => {
                  const isVideo = url.match(/\.(mp4|webm|ogg)$/i);
                  return (
                    <SwiperSlide
                      key={index}
                      className="flex items-center justify-center"
                    >
                      {isVideo ? (
                        <video
                          ref={(el) => (videoRefs.current[index] = el)}
                          src={url}
                          controls
                          className="w-full h-full"
                          style={{ objectFit: getObjectFit(index) }}
                          onClick={() => togglePlayPause(index)}
                          onLoadedMetadata={(e) => handleVideoLoad(index, e)}
                        />
                      ) : (
                        <img
                          src={url}
                          alt={`Post media ${index + 1}`}
                          className="w-full h-full"
                          style={{ objectFit: getObjectFit(index) }}
                          onLoad={(e) => handleImageLoad(index, e)}
                        />
                      )}
                    </SwiperSlide>
                  );
                })}
              </Swiper>
            ) : (
              <div className="text-white text-center">
                <p className="text-lg">No media available</p>
              </div>
            )}
          </div>

          {/* ===== RIGHT: COMMENTS & ACTIONS ===== */}
          <div className="w-[40%] flex flex-col bg-white">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <img
                  src={postData.userImage || "/default-avatar.png"}
                  alt={postData.userName}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <span className="font-semibold text-gray-800">
                  {postData.userName}
                </span>
              </div>
              <button className="text-gray-600 hover:text-gray-800">
                <BsThreeDots size={20} />
              </button>
            </div>

            {/* Caption */}
            {postData.caption && (
              <div className="p-4 border-b">
                <p className="text-gray-700">{postData.caption}</p>
              </div>
            )}

            {/* Comments */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {comments.length > 0 ? (
                comments
                  .slice()
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .map((comment) => (
                    <CommentCard
                      key={comment.id}
                      comment={comment}
                      user={commentUsers[comment.userId]}
                    />
                  ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <FaRegComment size={48} className="mb-2 opacity-50" />
                  <p>Chưa có bình luận</p>
                  <p className="text-sm">Hãy là người đầu tiên bình luận</p>
                </div>
              )}
            </div>

            {/* Actions & Stats */}
            <div className="border-t">
              {/* Action Buttons */}
              <div className="flex items-center justify-between p-4">
                <div className="flex gap-4">
                  <button
                    onClick={handleLike}
                    className="hover:opacity-70 transition-opacity"
                  >
                    {postData.isLiked ? (
                      <AiFillHeart size={28} className="text-red-500" />
                    ) : (
                      <AiOutlineHeart size={28} />
                    )}
                  </button>
                  <button className="hover:opacity-70 transition-opacity">
                    <FaRegComment size={24} />
                  </button>
                </div>
                <button
                  onClick={handleSave}
                  className="hover:opacity-70 transition-opacity"
                >
                  {postData.isSaved ? (
                    <BsBookmarkFill size={24} />
                  ) : (
                    <BsBookmark size={24} />
                  )}
                </button>
              </div>

              {/* Stats */}
              <div className="px-4 pb-2">
                <p className="font-semibold text-sm">
                  {postData.likeCount || 0}{" "}
                  {postData.likeCount === 1 ? "like" : "likes"}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  {timeDifference(postData.createdAt)}
                </p>
              </div>

              {/* Comment Input */}
              <div className="border-t p-4 relative">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="text-gray-400 hover:text-sky-500 transition-colors"
                  >
                    <BsEmojiSmile size={24} />
                  </button>

                  {showEmojiPicker && (
                    <div className="absolute bottom-16 left-4 z-50">
                      <EmojiPicker onEmojiClick={handleEmojiClick} />
                    </div>
                  )}

                  <input
                    type="text"
                    placeholder="Add a comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && comment.trim()) {
                        handleCreateComment(comment);
                      }
                    }}
                    className="flex-1 outline-none text-sm"
                    disabled={isLoading}
                  />

                  {comment.trim() && (
                    <button
                      onClick={() => handleCreateComment(comment)}
                      disabled={isLoading}
                      className="text-sky-500 hover:text-sky-600 font-semibold text-sm transition-colors disabled:opacity-50"
                    >
                      {isLoading ? "Posting..." : "Post"}
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

export default PostViewModal;