import React, { useState } from "react";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { timeDifference } from "../../Config/Logic";

const CommentCard = ({ comment, user }) => {
  const [isCommentLike, setIsCommentLike] = useState(false);
  
  const handleUnlikeComment = () => {
    setIsCommentLike(false);
  };
  
  const handleLikeComment = () => {
    setIsCommentLike(true);
  };

  return (
    <div className="group py-3 px-2 hover:bg-sky-50/30 rounded-xl transition-colors duration-200">
      <div className="flex items-start justify-between gap-3">
        {/* Left side - Avatar and Comment */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Avatar with gradient ring */}
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-400 to-blue-500 rounded-full blur-sm opacity-0 group-hover:opacity-20 transition-opacity"></div>
            <img
              className="relative w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm"
              src={
                user?.imageUrl ||
                "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png"
              }
              alt={`${comment?.firstName} ${comment?.lastName}`}
            />
          </div>

          {/* Comment Content */}
          <div className="flex-1 min-w-0">
            <div className="bg-gray-50 group-hover:bg-white rounded-2xl px-4 py-2.5 transition-colors border border-gray-100">
              <p className="text-sm leading-relaxed break-words">
                <span className="font-semibold text-gray-900 hover:text-sky-600 cursor-pointer transition-colors">
                  {comment?.firstName} {comment?.lastName}
                </span>
                <span className="ml-2 text-gray-700">
                  {comment?.content}
                </span>
              </p>
            </div>
            
            {/* Metadata */}
            <div className="flex items-center gap-3 mt-1.5 ml-4">
              <span className="text-xs text-gray-500 font-medium">
                {timeDifference(comment?.createdAt)}
              </span>
              <button className="text-xs text-gray-500 hover:text-sky-600 font-semibold transition-colors">
                Reply
              </button>
            </div>
          </div>
        </div>

        {/* Right side - Like Button */}
        <div className="flex-shrink-0 pt-3">
          <button
            onClick={isCommentLike ? handleUnlikeComment : handleLikeComment}
            className="group/like transition-transform hover:scale-110 active:scale-95"
          >
            {isCommentLike ? (
              <AiFillHeart className="w-4 h-4 text-red-500 animate-pulse" />
            ) : (
              <AiOutlineHeart className="w-4 h-4 text-gray-400 group-hover/like:text-red-500 transition-colors" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentCard;