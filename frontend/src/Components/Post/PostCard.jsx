import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import {
  BsBookmark,
  BsBookmarkFill,
  BsEmojiSmile,
  BsThreeDots,
} from "react-icons/bs";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { FaRegComment } from "react-icons/fa";
import { RiSendPlaneLine } from "react-icons/ri";
import { MdVolumeOff, MdVolumeUp, MdPlayArrow, MdPause, MdDelete } from "react-icons/md";
import { useDisclosure, useToast } from "@chakra-ui/react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import CommentModal from "../Comment/CommentModal";
import { timeDifference } from "../../Config/Logic";
import { getToken } from "../../service/LocalStorageService";
import { fetchLikePost, deletePost } from "../../api/postApi";
import { IoSend } from "react-icons/io5";
import { useNavigate } from "react-router-dom";

const PostCard = ({ post, user, onPostDeleted }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isPostLiked, setIsPostLiked] = useState(false);
  const toast = useToast();
  const [isSaved, setIsSaved] = useState(false);
  const [hoveredVideoIndex, setHoveredVideoIndex] = useState(null);
  const [isPlaying, setIsPlaying] = useState({});
  const [progress, setProgress] = useState({});
  const [comments, setComments] = useState([]);
  const [likes, setLikes] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const videoRefs = useRef([]);
  const token = getToken();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [comment, setComment] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!post?.id || !user?.id) return;

    const fetchData = async () => {
      try {
        const [commentRes, likeRes] = await Promise.all([
          axios.get(
            `http://localhost:8888/api/post/comment/${post.id}/comments`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          ),
          fetchLikePost(token, post.id),
        ]);

        setComments(commentRes.data.result || []);
        const likesArray = Array.isArray(likeRes) ? likeRes : [];
        setLikes(likesArray);
        const liked = likesArray.some(
          (likeItem) => likeItem.userId === post.userId
        );

        setIsPostLiked(liked);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLikes([]);
        setComments([]);
      }
    };

    fetchData();
  }, [post?.id, user?.id, token]);

  const handleDeletePost = async () => {
    toast({
      title: "Delete Post",
      description: "Are you sure you want to delete this post?",
      status: "warning",
      duration: null,
      position: "top",
      isClosable: true,
      render: ({ onClose }) => (
        <div className="bg-white rounded-lg shadow-xl border border-sky-200 p-6 max-w-md">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Post</h3>
              <p className="text-sm text-gray-600 mb-4">Are you sure you want to delete this post? This action cannot be undone.</p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    onClose();
                    try {
                      await deletePost(token, post.id);

                      toast({
                        title: "Post deleted successfully",
                        status: "success",
                        duration: 3000,
                        position: "top-right",
                        isClosable: true,
                      });

                      setShowDropdown(false);

                      if (onPostDeleted) {
                        onPostDeleted(post.id);
                      }
                    } catch (error) {
                      toast({
                        title: "Failed to delete post",
                        description: error.message || "Something went wrong",
                        status: "error",
                        duration: 3000,
                        position: "top-right",
                        isClosable: true,
                      });
                    }
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors duration-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      ),
    });
  };

  const handleCreateComment = async (comment) => {
    try {
      const res = await axios.post(
        `http://localhost:8888/api/post/comment/${post.id}/create`,
        {
          content: comment,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (res.data.code !== 1000) throw new Error("Create comment failed");
      setComments((prev) => [...prev, res.data.result]);
      setComment(res.data.result.content);

      toast({
        title: "Comment created successfully.",
        status: "success",
        duration: 3000,
        position: "top-right",
        isClosable: true,
      });
      setComment("");
    } catch (error) {
      console.error("Error creating comment:", error);
    }
  };

  const handleSeek = (index, value) => {
    const video = videoRefs.current[index];
    if (!video) return;
    video.currentTime = (video.duration * value) / 100;
    setProgress((prev) => ({ ...prev, [index]: value }));
  };

  const handlePostLike = async () => {
    try {
      const res = await axios.put(
        `http://localhost:8888/api/post/${post.id}/like`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (res.data.code !== 1000) throw new Error("Like failed");

      setIsPostLiked(true);

      setLikes((prev) => [
        ...prev,
        {
          userId: post.userId,
          postId: post.id,
          createdAt: new Date().toISOString(),
          id: res.data.result?.id || `temp-${Date.now()}`,
        },
      ]);
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handlePostUnLike = async () => {
    try {
      const res = await axios.put(
        `http://localhost:8888/api/post/${post.id}/unlike`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (res.data.code !== 1000) throw new Error("Unlike failed");

      setIsPostLiked(false);
      setLikes((prev) =>
        prev.filter((likeItem) => likeItem.userId !== user.id)
      );
    } catch (error) {
      console.error("Error unliking post:", error);
    }
  };

  const handleSavePost = () => setIsSaved(true);
  const handleUnSavePost = () => setIsSaved(false);
  const handleClick = () => setShowDropdown(!showDropdown);
  const handleOpenCommentModal = () => onOpen();

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

  const handleTimeUpdate = (index) => {
    const video = videoRefs.current[index];
    if (!video) return;

    const progressPercent = (video.currentTime / video.duration) * 100;
    setProgress((prev) => ({
      ...prev,
      [index]: progressPercent || 0,
    }));
  };

  const mediaUrls = Array.isArray(post?.mediaUrls) ? post.mediaUrls : [];
  
  const handleClickUserName = () => {
    navigate(`/profile/user/?profileId=${post?.profileId}`);
  };

  const isCurrentUserPostOwner = post?.userId === user?.userId;

  return (
    <div className="bg-white shadow-lg hover:shadow-2xl rounded-3xl overflow-hidden mb-8 border-2 border-sky-100 hover:border-sky-300 transition-all duration-300 transform hover:-translate-y-1">
      <style>{`
        .swiper-button-next,
        .swiper-button-prev {
          color: white !important;
          background-color: rgba(14, 165, 233, 0.7) !important;
          width: 36px !important;
          height: 36px !important;
          border-radius: 50% !important;
          transition: all 0.3s ease !important;
        }
        
        .swiper-button-next:after,
        .swiper-button-prev:after {
          font-size: 16px !important;
          font-weight: bold !important;
        }
        
        .swiper-button-next:hover,
        .swiper-button-prev:hover {
          background-color: rgba(14, 165, 233, 0.9) !important;
          transform: scale(1.1);
        }
        
        .swiper-button-disabled {
          opacity: 0 !important;
          pointer-events: none !important;
        }
        
        .swiper-pagination-bullet {
          background-color: rgba(255, 255, 255, 0.5) !important;
          opacity: 1 !important;
        }
        
        .swiper-pagination-bullet-active {
          background-color: rgb(14, 165, 233) !important;
        }
      `}</style>

      {/* Header */}
      <div className="flex justify-between items-center py-5 px-6 bg-gradient-to-r from-sky-50 via-white to-sky-50">
        <div className="flex items-center gap-4">
          <div className="relative group cursor-pointer" onClick={handleClickUserName}>
            <div className="absolute inset-0 bg-gradient-to-br from-sky-400 to-sky-600 rounded-full blur-md opacity-40 group-hover:opacity-60 transition-opacity duration-300"></div>
            <img
              className="relative h-14 w-14 rounded-full object-cover border-3 border-white shadow-lg ring-2 ring-sky-200 group-hover:ring-sky-400 transition-all duration-300"
              src={
                post?.userImageUrl ||
                "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png"
              }
              alt="User"
            />
          </div>
          <div>
            <p
              className="font-bold text-base cursor-pointer hover:text-sky-600 transition-colors duration-200"
              onClick={handleClickUserName}
            >
              {post?.userName || "Unknown"}
            </p>
            <p className="text-xs text-gray-500 font-medium">
              {post?.createdAt ? timeDifference(post.createdAt) : "Just now"}
            </p>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={handleClick}
            className="p-2 rounded-full hover:bg-sky-50 transition-colors duration-200"
          >
            <BsThreeDots className="text-xl text-gray-600" />
          </button>
          {showDropdown && (
            <div className="absolute top-12 right-0 bg-white shadow-xl rounded-xl py-2 z-20 min-w-[140px] border border-sky-100">
              {isCurrentUserPostOwner && (
                <button
                  onClick={handleDeletePost}
                  className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 transition-colors duration-200 flex items-center gap-2 font-medium"
                >
                  <MdDelete className="w-4 h-4" />
                  Delete
                </button>
              )}
              {!isCurrentUserPostOwner && (
                <button className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-sky-50 transition-colors duration-200 font-medium">
                  Report
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Caption */}
      {post?.content && (
        <div className="px-6 pb-4 text-sm text-gray-800 leading-relaxed">
          {post.content}
        </div>
      )}

      {/* Media */}
      {mediaUrls.length > 0 && (
        <div className="relative w-full bg-gradient-to-br from-sky-50 to-gray-50">
          <Swiper
            spaceBetween={0}
            slidesPerView={1}
            navigation={{
              nextEl: '.swiper-button-next',
              prevEl: '.swiper-button-prev',
            }}
            pagination={{ 
              clickable: true,
              bulletActiveClass: 'swiper-pagination-bullet-active'
            }}
            modules={[Navigation, Pagination]}
            className="post-swiper"
          >
            {mediaUrls.map((url, index) => {
              const isVideo = url.match(/\.(mp4|webm|ogg)$/i);
              return (
                <SwiperSlide key={index} className="relative">
                  {isVideo ? (
                    <div
                      className="relative group bg-black"
                      onMouseEnter={() => setHoveredVideoIndex(index)}
                      onMouseLeave={() => setHoveredVideoIndex(null)}
                    >
                      <video
                        ref={(el) => (videoRefs.current[index] = el)}
                        src={url}
                        className="max-h-[80vh] w-full object-contain"
                        loop
                        muted={isMuted}
                        onTimeUpdate={() => handleTimeUpdate(index)}
                        onClick={() => togglePlayPause(index)}
                      />

                      {hoveredVideoIndex === index && (
                        <div className="absolute inset-0 bg-black/10 transition-opacity duration-300">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsMuted((prev) => !prev);
                            }}
                            className="absolute top-4 right-4 bg-sky-500/80 backdrop-blur-sm text-white p-2.5 rounded-full hover:bg-sky-600/90 transition-all duration-300 shadow-lg hover:scale-110"
                          >
                            {isMuted ? (
                              <MdVolumeOff className="w-5 h-5" />
                            ) : (
                              <MdVolumeUp className="w-5 h-5" />
                            )}
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePlayPause(index);
                            }}
                            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-sky-500/80 backdrop-blur-sm text-white p-4 rounded-full hover:bg-sky-600/90 transition-all duration-300 hover:scale-110 shadow-xl"
                          >
                            {isPlaying[index] ? (
                              <MdPause className="w-8 h-8" />
                            ) : (
                              <MdPlayArrow className="w-8 h-8" />
                            )}
                          </button>
                        </div>
                      )}

                      <div className="absolute bottom-0 left-0 right-0 px-4 pb-3">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={progress[index] || 0}
                          onChange={(e) => handleSeek(index, e.target.value)}
                          className="w-full h-1.5 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-sky-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125"
                          style={{
                            background: `linear-gradient(to right, rgb(14, 165, 233) 0%, rgb(14, 165, 233) ${progress[index] || 0}%, rgba(255,255,255,0.4) ${progress[index] || 0}%, rgba(255,255,255,0.4) 100%)`
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <img
                      src={url}
                      alt={`post-media-${index}`}
                      className="w-full h-auto max-h-[80vh] object-contain"
                    />
                  )}
                </SwiperSlide>
              );
            })}
          </Swiper>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-white to-sky-50/30">
        <div className="flex items-center gap-5">
          <button
            onClick={isPostLiked ? handlePostUnLike : handlePostLike}
            className="group transition-transform hover:scale-110 active:scale-95 duration-200"
          >
            {isPostLiked ? (
              <AiFillHeart className="text-2xl text-red-500 animate-pulse drop-shadow-md" />
            ) : (
              <AiOutlineHeart className="text-2xl text-gray-700 group-hover:text-red-500 transition-colors duration-200" />
            )}
          </button>
          <button
            onClick={handleOpenCommentModal}
            className="group transition-transform hover:scale-110 active:scale-95 duration-200"
          >
            <FaRegComment className="text-xl text-gray-700 group-hover:text-sky-500 transition-colors duration-200" />
          </button>
          <button className="group transition-transform hover:scale-110 active:scale-95 duration-200">
            <RiSendPlaneLine className="text-xl text-gray-700 group-hover:text-sky-500 transition-colors duration-200" />
          </button>
        </div>
        <button
          onClick={isSaved ? handleUnSavePost : handleSavePost}
          className="group transition-transform hover:scale-110 active:scale-95 duration-200"
        >
          {isSaved ? (
            <BsBookmarkFill className="text-xl text-sky-500 drop-shadow-md" />
          ) : (
            <BsBookmark className="text-xl text-gray-700 group-hover:text-sky-500 transition-colors duration-200" />
          )}
        </button>
      </div>

      {/* Likes & Comments */}
      <div className="px-6 pb-4">
        <p className="text-sm font-semibold text-gray-800">
          {likes.length} {likes.length === 1 ? 'like' : 'likes'}
        </p>
        <button
          onClick={handleOpenCommentModal}
          className="text-sm text-gray-500 hover:text-sky-600 mt-1 transition-colors duration-200 font-medium"
        >
          View all {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
        </button>
      </div>

      {/* Add Comment */}
      <div className="border-t border-sky-100 px-6 py-4 flex items-center gap-3 bg-gradient-to-r from-sky-50/50 to-white">
        <button className="text-gray-400 hover:text-sky-500 transition-colors duration-200 hover:scale-110 transform">
          <BsEmojiSmile className="text-xl" />
        </button>
        <input
          className="flex-1 outline-none text-sm placeholder-gray-400 focus:placeholder-gray-500 bg-transparent border-none py-2 px-1"
          type="text"
          placeholder="Add a comment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && comment.trim()) {
              handleCreateComment(comment);
            }
          }}
        />
        {comment.trim() && (
          <button
            onClick={(e) => {
              e.preventDefault();
              handleCreateComment(comment);
              setComment("");
            }}
            className="text-sky-500 hover:text-sky-600 transition-all duration-200 hover:scale-110 transform"
          >
            <IoSend className="text-xl" />
          </button>
        )}
      </div>

      <CommentModal
        user={user}
        post={post}
        comments={comments}
        postMedia={post.mediaUrls}
        likeCount={likes.length}
        isOpen={isOpen}
        onClose={onClose}
        isSaved={isSaved}
        isPostLike={isPostLiked}
        handlePostLike={handlePostLike}
        handleSavePost={handleSavePost}
        handleCreateComment={handleCreateComment}
      />
    </div>
  );
};

export default PostCard;