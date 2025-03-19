import React from "react";
import { AiFillHeart } from "react-icons/ai";
import { FaComment } from "react-icons/fa";

const ReqUserPostCard = ({ post }) => {
  const hasMedia = post.mediaUrls && post.mediaUrls.length > 0;
  const isVideo = (url) => url.endsWith(".mp4") || url.includes("video");

  return (
    <div className="w-full max-w-md mx-auto rounded-xl overflow-hidden shadow hover:shadow-md transition bg-white">
      {hasMedia ? (
        <div className="relative w-full aspect-square bg-black">
          {isVideo(post.mediaUrls[0]) ? (
            <video
              className="w-full h-full object-cover"
              src={post.mediaUrls[0]}
              controls
              preload="metadata"
            />
          ) : (
            <img
              className="w-full h-full object-cover"
              src={post.mediaUrls[0]}
              alt="Post media"
            />
          )}
          <div className="absolute inset-0 bg-black bg-opacity-30 hover:bg-opacity-60 transition flex items-center justify-center opacity-0 hover:opacity-100">
            <div className="flex gap-6 text-white text-lg font-semibold">
              <div className="flex items-center gap-1">
                <AiFillHeart />
                <span>{post.likesCount || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <FaComment />
                <span>{post.commentsCount || 0}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 space-y-3">
          <p className="text-sm text-gray-800">{post.content}</p>
          <div className="flex gap-6 text-gray-600 text-sm font-semibold">
            <div className="flex items-center gap-1">
              <AiFillHeart />
              <span>{post.likesCount || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <FaComment />
              <span>{post.commentsCount || 0}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReqUserPostCard;
