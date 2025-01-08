import React, { useState } from "react";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";

const CommentCard = () => {
  const [isCommentLike, setIsCommentLike] = useState();
  const handleUnlikeComment = () => {
    setIsCommentLike(false);
  };
  const handleLikeComment = () => {
    setIsCommentLike(true);
  };
  return (
    <div>
      <div className="flex items-center justify-between py-5">
        <div className="flex items-center">
          <div>
            <img
              className="w-9 h-9 rounded-full"
              src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png"
              alt=""
            />
          </div>
          <div className="ml-3">
            <p>
              <span className="font-semibold">UserName</span>
              <span className="ml-2">comment content</span>
            </p>
            <div className="flex items-center space-x-3 text-xs opacity-60 pt-2">
              <span>create at</span>
              <p>20 likes</p>
            </div>
          </div>
        </div>
        <div>
          {isCommentLike ? (
            <AiFillHeart
              onClick={handleUnlikeComment}
              className="text-xs hover:opacity-50 cursor-pointer text-red-600"
            />
          ) : (
            <AiOutlineHeart
              onClick={handleLikeComment}
              className="text-xs hover:opacity-50 cursor-pointer"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentCard;
