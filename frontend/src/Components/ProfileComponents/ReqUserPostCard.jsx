import React, { useEffect, useState } from "react";
import { AiFillHeart } from "react-icons/ai";
import { FaComment } from "react-icons/fa";
import { fetchAllComments, fetchLikePost } from "../../api/postApi";
import { getToken } from "../../service/LocalStorageService";

const ReqUserPostCard = ({ post }) => {
  const token = getToken();
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0);

  const hasMedia = post.mediaUrls && post.mediaUrls.length > 0;
  const isVideo = (url) => url.endsWith(".mp4") || url.includes("video");

  useEffect(() => {
    const fetchLikeAndComment = async () => {
      try {
        const likeData = await fetchLikePost(token, post.id);
        setLikesCount(likeData?.length || 0);

        const commentData = await fetchAllComments(token, post.id);
        setCommentsCount(commentData?.length || 0);
      } catch (err) {
        console.error("Lỗi khi load likes/comments", err);
      }
    };
    fetchLikeAndComment();
  }, [post.id, token]);

  return (
    <div className="w-full max-w-md mx-auto rounded-2xl overflow-hidden shadow-lg bg-white transition-all duration-300 hover:shadow-xl">
      {hasMedia ? (
        <div className="relative w-full aspect-square bg-black overflow-hidden">
          {isVideo(post.mediaUrls[0]) ? (
            <video
              className="w-full h-full object-contain transition-transform duration-300 hover:scale-105 bg-black"
              src={post.mediaUrls[0]}
              controls
              preload="metadata"
            />
          ) : (
            <img
              className="w-full h-full object-contain transition-transform duration-300 hover:scale-105 bg-black"
              src={post.mediaUrls[0]}
              alt="Post media"
            />
          )}
        </div>
      ) : (
        <div className="p-4">
          <p className="text-gray-800 text-sm leading-relaxed">
            {post?.content}
          </p>
        </div>
      )}

      <div className="px-4 py-3 border-t flex gap-6 text-gray-600 text-sm font-semibold">
        <div className="flex items-center gap-2">
          <AiFillHeart className="text-red-500" />
          <span>{likesCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <FaComment />
          <span>{commentsCount}</span>
        </div>
      </div>
    </div>
  );
};

export default ReqUserPostCard;
