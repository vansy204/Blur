import React from "react";
import "./CommentModal.css";
import { Modal, ModalBody, ModalContent, ModalOverlay } from "@chakra-ui/react";
import {
  BsBookmark,
  BsBookmarkFill,
  BsEmojiSmile,
  BsThreeDots,
} from "react-icons/bs";
import CommentCard from "./CommentCard";
import { RiSendPlaneLine } from "react-icons/ri";
import { FaRegComment } from "react-icons/fa";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
const CommentModal = ({
  user,
  post,
  comments,
  isOpen,
  onClose,
  isSaved,
  isPostLike,
  handlePostLike,
  handleSavePost,
}) => {
  //const [commnetContent, setCommentContent] = useState();
  return (
    <div>
      <Modal size={"4xl"} onClose={onClose} isOpen={isOpen} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalBody>
            <div className="flex h-[75vh]">
              <div className="w-[45%] flex flex-col justify-center">
                <img
                  className="max-h-full w-full"
                  src="https://cdn.pixabay.com/photo/2024/09/20/01/37/dubai-creek-9060098_640.jpg"
                  alt=""
                />
              </div>
              <div className="w-[55%] pl-10 relative">
                <div className="flex justify-between items-center py-5">
                  <div className="flex items-center">
                    <div>
                      <img
                        className="w-9 h-9 rounded-full"
                        src={post?.userImageUrl || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png"}
                        alt=""
                      />
                    </div>
                    <div className="m;-2">
                      <p>{post?.userName}</p>
                    </div>
                  </div>
                  <BsThreeDots />
                </div>
                <hr />
                <div className="comment">
                  {[1, 1, 1, 1].map((item) => (
                    <CommentCard comment={item} />
                  ))}
                </div>
                <div className="absolute bottom-0 w-[90%]">
                  <div className="flex justify-between items-center w-full py-4 ">
                    <div className="flex items-center space-x-2">
                      {isPostLike ? (
                        <AiFillHeart
                          className="text-2xl hover:opacity-50 cursor-pointer text-red-600"
                          onClick={handlePostLike}
                        />
                      ) : (
                        <AiOutlineHeart
                          className="text-2xl hover:opacity-50 cursor-pointer"
                          onClick={handlePostLike}
                        />
                      )}
                      <FaRegComment className="text-xl hover:opacity-50 cursor-pointer" />
                      <RiSendPlaneLine className="text-xl hover:opacity-50 cursor-pointer" />
                    </div>
                    <div className="cursor-pointer">
                      {isSaved ? (
                        <BsBookmarkFill
                          onClick={handleSavePost}
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
                  <div className="w-full py-2">
                    {<p>100 likes</p>}
                    <p className="opacity-50 text-sm">create at</p>
                  </div>
                  <div className="flex items-center w-full ">
                    <BsEmojiSmile />
                    <input
                      className="commentInputs"
                      type="text"
                      placeholder="Add a comment..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default CommentModal;
