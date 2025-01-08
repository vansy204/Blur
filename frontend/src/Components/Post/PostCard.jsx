import React, { useState } from "react";
import {
  BsBookmark,
  BsBookmarkFill,
  BsEmojiSmile,
  BsThreeDots,
} from "react-icons/bs";
import "./PostCard.css";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { FaRegComment } from "react-icons/fa";
import { RiSendPlaneLine } from "react-icons/ri";
import CommentModal from "../Comment/CommentModal";
import { useDisclosure } from "@chakra-ui/react";
const PostCard = () => {
  const [showDropdown, setShowDropdown] = useState();
  const [isPostLiked, setIsPostLiked] = useState();
  const [isSaved, setIsSaved] = useState();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const handleClick = () => {
    setShowDropdown(!showDropdown);
  };
  const handlePostUnlike = () => {
    setIsPostLiked(false);
  };
  const handlePostLike = () => {
    setIsPostLiked(true);
  };
  const handleOpenCommentModal = () => {
    onOpen();
  };
  const handleSavePost = () => {
    setIsSaved(true);
  };
  const handleUnSavePost = () => {
    setIsSaved(false);
  };
  return (
    <div className="border rounded-md">
      <div className="flex justify-between items-center w-full py-4 px-5">
        <div className="flex items-center">
          <img
            className="h-12 w-12 rounded-full"
            src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png"
            alt=""
          />
          <div className="pl-2">
            <p className="font-semibold text-sm items-center">UserName</p>
            <p className="font-thin text-sm">Localtion</p>
          </div>
        </div>
        <div className="dropdown">
          <BsThreeDots className="dots" onClick={handleClick} />
          <div className="dropdown-content">
            {showDropdown && (
              <p className="bg-black text-white py-1 px-4 rounded-md cursor-pointer">
                Delete
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="w-full">
        <img
          className="w-full"
          src="https://cdn.pixabay.com/photo/2024/09/20/01/37/dubai-creek-9060098_640.jpg"
          alt=""
        />
        <div className="flex justify-between items-center w-full px-5 py-4">
          <div className="flex items-center space-x-2">
            {isPostLiked ? (
              <AiFillHeart
                className="text-2xl hover:opacity-50 cursor-pointer text-red-600"
                onClick={handlePostUnlike}
              />
            ) : (
              <AiOutlineHeart
                className="text-2xl hover:opacity-50 cursor-pointer"
                onClick={handlePostLike}
              />
            )}
            <FaRegComment
              onClick={handleOpenCommentModal}
              className="text-xl hover:opacity-50 cursor-pointer"
            />
            <RiSendPlaneLine className="text-xl hover:opacity-50 cursor-pointer" />
          </div>
          <div className="cursor-pointer">
            {isSaved ? (
              <BsBookmarkFill
                onClick={handleUnSavePost}
                className="text-xl hover:opacity-50 cursor-pointer"
              />
            ) : (
              <BsBookmark
                onClick={handleSavePost}
                className="text-xl hover:opacity-50 cursor-pointer"
              />
            )}
          </div>
        </div>
        <div className="w-full py-2 px-5">
          <p>10 likes</p>
          <p className="opacity-50 py-2 cursor-pointer">view all 99 comments</p>
        </div>
        <div className="borber border-t w-full">
          <div className="flex w-full items-center px-5">
            <BsEmojiSmile />
            <input
              className="commentInputs"
              type="text"
              placeholder="Add a comment..."
            />
          </div>
        </div>
      </div>
      <CommentModal
        onClose={onClose}
        isOpen={isOpen}
        isSaved={isSaved}
        isPostLike={isPostLiked}
        handlePostLike={handlePostLike}
        handleSavePost={handleSavePost} 
      />
    </div>
  );
};

export default PostCard;
