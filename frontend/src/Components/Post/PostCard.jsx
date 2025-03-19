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
import { useDisclosure } from "@chakra-ui/react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import CommentModal from "../Comment/CommentModal";
import { timeDifference } from "../../Config/Logic";
import { getToken } from "../../service/LocalStorageService";
import { fetchLikePost } from "../../api/postApi";

const PostCard = ({ post, user }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isPostLiked, setIsPostLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [hoveredVideoIndex, setHoveredVideoIndex] = useState(null);
  const [isPlaying, setIsPlaying] = useState({});
  const [progress, setProgress] = useState({});
  const [comments, setComments] = useState([]);
  const [likes, setLikes] = useState([]);

  const videoRefs = useRef([]);
  const token = getToken();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Fetch likes & comments
  useEffect(() => {
    if (!post?.id || !user?.id) return;
  
    const fetchData = async () => {
      try {
        const [commentRes, likeRes] = await Promise.all([
          axios.get(`http://localhost:8888/api/post/comment/${post.id}/comments`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }),
          fetchLikePost(token, post.id),
        ]);
  
        setComments(commentRes.data.result || []);
        const likesArray = Array.isArray(likeRes) ? likeRes : [];
        setLikes(likesArray);
        const liked = likesArray.some((likeItem) => likeItem.userId === post.userId);
        
        setIsPostLiked(liked);
      } catch (error) {
        console.error("Error fetching data:", error);
        // Đặt mảng rỗng trong trường hợp lỗi
        setLikes([]);
        setComments([]);
      }
    };
  
    fetchData();
  }, [post?.id, user?.id, token]);

  // Toggle like
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
      
      // Thêm một đối tượng like mới với cấu trúc đúng
      setLikes((prev) => [...prev, {
        userId: post.userId,
        postId: post.id,
        createdAt: new Date().toISOString(),
        id: res.data.result?.id || `temp-${Date.now()}` // ID tạm thời nếu API không trả về id
      }]);
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  // Toggle unlike
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
      // Lọc ra những like không phải của người dùng hiện tại
      setLikes((prev) => prev.filter((likeItem) => likeItem.userId !== user.id));
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

  return (
    <div className="bg-white shadow-md rounded-xl overflow-hidden mb-8 border border-gray-200">
      {/* Header */}
      <div className="flex justify-between items-center py-4 px-5">
        <div className="flex items-center">
          <img
            className="h-12 w-12 rounded-full object-cover"
            src={
              post?.userImageUrl ||
              "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png"
            }
            alt="User"
          />
          <div className="pl-3">
            <p className="font-semibold text-sm">{post?.userName || "Unknown"}</p>
            <p className="text-xs text-gray-500">
              {post?.createdAt ? timeDifference(post.createdAt) : "Just now"}
            </p>
          </div>
        </div>
        <div className="relative">
          <BsThreeDots
            className="cursor-pointer text-xl"
            onClick={handleClick}
          />
          {showDropdown && (
            <div className="absolute top-6 right-0 bg-black text-white text-sm py-1 px-4 rounded-md z-10 cursor-pointer">
              Delete
            </div>
          )}
        </div>
      </div>

      {/* Caption */}
      {post?.content && (
        <div className="px-5 pb-3 text-sm">
          <span className="font-semibold mr-1">{post?.userName}</span>
          {post.content}
        </div>
      )}

      {/* Media */}
      {mediaUrls.length > 0 && (
        <div className="relative w-full">
          <Swiper
            spaceBetween={10}
            slidesPerView={1}
            navigation
            pagination={{ clickable: true }}
            modules={[Navigation, Pagination]}
            className="rounded-md"
          >
            {mediaUrls.map((url, index) => {
              const isVideo = url.match(/\.(mp4|webm|ogg)$/i);
              return (
                <SwiperSlide key={index} className="relative">
                  {isVideo ? (
                    <div
                      className="relative group"
                      onMouseEnter={() => setHoveredVideoIndex(index)}
                      onMouseLeave={() => setHoveredVideoIndex(null)}
                    >
                      <video
                        ref={(el) => (videoRefs.current[index] = el)}
                        src={url}
                        className="w-full h-[400px] object-cover"
                        loop
                        muted
                        onTimeUpdate={() => handleTimeUpdate(index)}
                      />
                      {hoveredVideoIndex === index && (
                        <button
                          onClick={() => togglePlayPause(index)}
                          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/60 text-white px-3 py-2 rounded-full text-sm"
                        >
                          {isPlaying[index] ? "Pause" : "Play"}
                        </button>
                      )}
                      <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-300">
                        <div
                          className="h-full bg-blue-500"
                          style={{ width: `${progress[index] || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={url}
                      alt={`post-media-${index}`}
                      className="w-full h-[400px] object-cover"
                    />
                  )}
                </SwiperSlide>
              );
            })}
          </Swiper>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center px-5 py-4">
        <div className="flex items-center gap-3">
          {isPostLiked ? (
            <AiFillHeart
              className="text-2xl text-red-600 cursor-pointer hover:opacity-60"
              onClick={handlePostUnLike}
            />
          ) : (
            <AiOutlineHeart
              className="text-2xl cursor-pointer hover:opacity-60"
              onClick={handlePostLike}
            />
          )}
          <FaRegComment
            className="text-xl cursor-pointer hover:opacity-60"
            onClick={handleOpenCommentModal}
          />
          <RiSendPlaneLine className="text-xl cursor-pointer hover:opacity-60" />
        </div>
        <div className="cursor-pointer">
          {isSaved ? (
            <BsBookmarkFill
              onClick={handleUnSavePost}
              className="text-xl hover:opacity-60"
            />
          ) : (
            <BsBookmark
              onClick={handleSavePost}
              className="text-xl hover:opacity-60"
            />
          )}
        </div>
      </div>

      {/* Likes & Comments */}
      <div className="px-5 pb-2">
        <p className="text-sm font-semibold">{likes.length} likes</p>
        <p
          className="text-sm text-gray-500 mt-1 cursor-pointer"
          onClick={handleOpenCommentModal}
        >
          View all {comments.length} comments
        </p>
      </div>

      {/* Add Comment */}
      <div className="border-t px-5 py-3 flex items-center gap-2">
        <BsEmojiSmile className="text-lg text-gray-500" />
        <input
          className="w-full outline-none text-sm"
          type="text"
          placeholder="Add a comment..."
        />
      </div>

      {/* Comment Modal */}
      <CommentModal
        post={post}
        comments={comments}
        isOpen={isOpen}
        onClose={onClose}
        isSaved={isSaved}
        isPostLike={isPostLiked}
        handlePostLike={handlePostLike}
        handleSavePost={handleSavePost}
      />
    </div>
  );
};

export default PostCard;