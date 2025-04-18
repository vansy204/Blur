import React, { useState } from "react";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { timeDifference } from "../../Config/Logic";

const CommentCard = ({comment, user}) => {
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
              src={user?.imageUrl || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png"}
              alt=""
            />
          </div>
          <div className="ml-3">
            <p>
              <span className="font-semibold">{comment?.firstName} {comment?.lastName}</span>
              <span className="ml-2">{comment?.content}</span>
            </p>
            <div className="flex items-center space-x-3 text-xs opacity-60 pt-2">
              <span>{timeDifference(comment?.createdAt)}</span>
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
              className="text-xs hover:opacity-50 cursor-pointer"
              onClick={handleLikeComment}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentCard;
