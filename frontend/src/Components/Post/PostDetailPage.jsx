import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  fetchPostById, 
  likePost, 
  unlikePost, 
  createComment,
  fetchLikePost
} from "../../api/postApi";
import { getToken } from "../../service/LocalStorageService";
import { useToast } from "@chakra-ui/react";
import { ArrowLeft, Share2 } from "lucide-react";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { FaRegComment } from "react-icons/fa";
import { IoSend } from "react-icons/io5";
import { jwtDecode } from "jwt-decode";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const PostDetailPage = () => {
  const { postId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const token = getToken();
  
  const [post, setPost] = useState(location.state?.post || null);
  const [postOwner, setPostOwner] = useState(null);
  const [currentUser, setCurrentUser] = useState(null); // ✅ Current logged-in user
  const [isLoading, setIsLoading] = useState(true);
  const [isPostLiked, setIsPostLiked] = useState(false);
  const [likes, setLikes] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [userId, setUserId] = useState(null);
  
  // ✅ For image sizing like PostCard
  const [mediaDimensions, setMediaDimensions] = useState({});
  const [primaryAspectRatio, setPrimaryAspectRatio] = useState(null);
  const videoRefs = useRef([]);

  // ✅ Get current logged-in user
  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserId(decoded.sub);
        
        // Fetch current user profile
        const fetchCurrentUser = async () => {
          try {
            const response = await axios.get(
              `http://localhost:8888/api/identity/users/${decoded.sub}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const userData = response.data?.result || response.data;
            console.log("👤 Current user:", userData);
            setCurrentUser(userData);
          } catch (error) {
            console.error("Error fetching current user:", error);
          }
        };
        
        fetchCurrentUser();
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, [token]);

  // Fetch user profile by ID
  const fetchUserProfile = async (uid) => {
    try {
      const response = await axios.get(
        `http://localhost:8888/api/identity/users/${uid}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data?.result || response.data;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  };

  // ✅ Image/Video dimension handlers - GIỐNG POSTCARD
  const handleImageLoad = (index, e) => {
    const img = e.target;
    const aspectRatio = img.naturalWidth / img.naturalHeight;
    setMediaDimensions((prev) => ({
      ...prev,
      [index]: { aspectRatio, width: img.naturalWidth, height: img.naturalHeight },
    }));
    if (index === 0 && primaryAspectRatio === null) {
      setPrimaryAspectRatio(aspectRatio);
    }
  };

  const handleVideoLoad = (index, e) => {
    const video = e.target;
    const aspectRatio = video.videoWidth / video.videoHeight;
    setMediaDimensions((prev) => ({
      ...prev,
      [index]: { aspectRatio, width: video.videoWidth, height: video.videoHeight },
    }));
    if (index === 0 && primaryAspectRatio === null) {
      setPrimaryAspectRatio(aspectRatio);
    }
  };

  // ✅ Get container style - GIỐNG POSTCARD
  const getMediaContainerStyle = () => {
    if (primaryAspectRatio === null) {
      return { height: "400px", width: "100%" };
    }

    const aspectRatio = primaryAspectRatio;

    if (aspectRatio < 0.8) {
      return { aspectRatio: aspectRatio.toString(), maxHeight: "600px", width: "100%" };
    } else if (aspectRatio > 1.3) {
      return { aspectRatio: aspectRatio.toString(), maxHeight: "500px", width: "100%" };
    } else {
      return { aspectRatio: aspectRatio.toString(), maxHeight: "600px", width: "100%" };
    }
  };

  // Main fetch
  useEffect(() => {
    const fetchData = async () => {
      if (!postId || !token) return;

      try {
        setIsLoading(true);

        let postData = post;
        if (!postData) {
          postData = await fetchPostById(postId, token);
          setPost(postData);
        }

        if (postData?.userId) {
          const userData = await fetchUserProfile(postData.userId);
          setPostOwner(userData);
        }

        const [commentRes, likeRes] = await Promise.all([
          axios.get(
            `http://localhost:8888/api/post/comment/${postId}/comments`,
            { headers: { Authorization: `Bearer ${token}` } }
          ),
          fetchLikePost(token, postId),
        ]);

        // ✅ Fetch user info cho từng comment
        const commentsWithUsers = await Promise.all(
          (commentRes.data.result || []).map(async (comment) => {
            if (comment.userId) {
              const userInfo = await fetchUserProfile(comment.userId);
              return { ...comment, created: userInfo };
            }
            return comment;
          })
        );

        setComments(commentsWithUsers);
        
        const likesArray = Array.isArray(likeRes) ? likeRes : [];
        setLikes(likesArray);
        
        if (userId) {
          const liked = likesArray.some((likeItem) => likeItem.userId === userId);
          setIsPostLiked(liked);
        }

      } catch (error) {
        console.error("❌ Error fetching data:", error);
        if (!post) {
          toast({
            title: "Không thể tải bài viết",
            status: "error",
            duration: 2000,
            position: "top-right",
          });
          setTimeout(() => navigate(-1), 1500);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [postId, token, userId]);

  const handlePostLike = async () => {
    if (!userId) return;
    
    try {
      if (isPostLiked) {
        setIsPostLiked(false);
        setLikes((prev) => prev.filter((like) => like.userId !== userId));
        await unlikePost(token, postId);
      } else {
        setIsPostLiked(true);
        setLikes((prev) => [
          ...prev,
          { userId, postId, createdAt: new Date().toISOString(), id: `temp-${Date.now()}` },
        ]);
        await likePost(token, postId);
      }
    } catch (error) {
      console.error("❌ Error toggling like:", error);
      try {
        const likeRes = await fetchLikePost(token, postId);
        setLikes(Array.isArray(likeRes) ? likeRes : []);
        setIsPostLiked(likeRes.some((l) => l.userId === userId));
      } catch (refetchError) {
        console.error("Error refetching likes:", refetchError);
      }
    }
  };

  const handleCreateComment = async (commentContent) => {
    if (!commentContent.trim() || isSubmittingComment) return;
    
    try {
      setIsSubmittingComment(true);
      
      const createdComment = await createComment(token, postId, commentContent);
      
      // ✅ Fetch user info cho comment mới
      const userInfo = await fetchUserProfile(userId);
      const commentWithUser = { ...createdComment, created: userInfo };
      
      setComments((prev) => [...prev, commentWithUser]);
      setCommentText("");
      
      toast({
        title: "Đã bình luận",
        status: "success",
        duration: 2000,
        position: "top-right",
      });
      
    } catch (error) {
      console.error("❌ Error creating comment:", error);
      toast({
        title: "Không thể gửi bình luận",
        status: "error",
        duration: 2000,
        position: "top-right",
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Đang tải bài viết...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-800 mb-2">Không tìm thấy bài viết</h3>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-gradient-to-r from-sky-400 to-blue-500 text-white rounded-xl font-semibold"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const mediaUrls = Array.isArray(post?.mediaUrls) ? post.mediaUrls : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-semibold">Bài viết</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4">
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          {/* User Info */}
          <div className="p-4 flex items-center gap-3">
            <img
              src={postOwner?.avatar || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png"}
              alt="User"
              className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
            />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">
                {postOwner?.username || 
                 (postOwner?.firstName ? `${postOwner.firstName} ${postOwner.lastName || ""}`.trim() : "User")}
              </h3>
              <p className="text-xs text-gray-500">
                {post.createdAt 
                  ? new Date(post.createdAt).toLocaleDateString("vi-VN", {
                      year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
                    })
                  : "Recently"}
              </p>
            </div>
          </div>

          {/* Content */}
          {post.content && (
            <div className="px-4 pb-4">
              <p className="text-gray-800 text-base leading-relaxed whitespace-pre-wrap">{post.content}</p>
            </div>
          )}

          {/* Media - GIỐNG POSTCARD */}
          {mediaUrls.length > 0 && (
            <div className="relative w-full bg-gradient-to-br from-sky-50 to-gray-50">
              <Swiper
                spaceBetween={0}
                slidesPerView={1}
                navigation
                pagination={{ clickable: true }}
                modules={[Navigation, Pagination]}
                className="post-swiper w-full"
              >
                {mediaUrls.map((url, index) => {
                  const isVideo = url.match(/\.(mp4|webm|ogg)$/i);
                  const containerStyle = getMediaContainerStyle();

                  return (
                    <SwiperSlide key={index}>
                      <div
                        className="flex justify-center items-center w-full bg-black/5 overflow-hidden"
                        style={containerStyle}
                      >
                        {isVideo ? (
                          <video
                            ref={(el) => (videoRefs.current[index] = el)}
                            src={url}
                            className="max-w-full max-h-full w-auto h-auto object-contain"
                            controls
                            onLoadedMetadata={(e) => handleVideoLoad(index, e)}
                          />
                        ) : (
                          <img
                            src={url}
                            alt={`post-media-${index}`}
                            className="max-w-full max-h-full w-auto h-auto object-contain"
                            onLoad={(e) => handleImageLoad(index, e)}
                          />
                        )}
                      </div>
                    </SwiperSlide>
                  );
                })}
              </Swiper>
            </div>
          )}

          {/* Actions */}
          <div className="px-4 pb-4 pt-2 flex items-center gap-6 border-t">
            <button onClick={handlePostLike} className="flex items-center gap-2 transition-all group">
              {isPostLiked ? (
                <AiFillHeart className="text-2xl text-red-500 animate-pulse" />
              ) : (
                <AiOutlineHeart className="text-2xl text-gray-700 group-hover:text-red-500" />
              )}
              <span className="text-sm font-semibold">{likes.length}</span>
            </button>
            
            <button className="flex items-center gap-2 text-gray-600 hover:text-sky-500">
              <FaRegComment className="text-xl" />
              <span className="text-sm font-semibold">{comments.length}</span>
            </button>
            
            <button className="flex items-center gap-2 text-gray-600 hover:text-sky-500 ml-auto">
              <Share2 size={22} />
            </button>
          </div>
        </div>

        {/* Comments */}
        <div className="mt-4 bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="font-semibold text-lg mb-4">Bình luận ({comments.length})</h2>
          
          {/* Comment Input */}
          <div className="flex gap-3 mb-6 items-center">
            <img
              src={currentUser?.avatar || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png"}
              alt="You"
              className="w-10 h-10 rounded-full object-cover"
            />
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && commentText.trim()) {
                  handleCreateComment(commentText);
                }
              }}
              placeholder="Viết bình luận..."
              className="flex-1 px-4 py-2 bg-gray-50 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
            {commentText.trim() && (
              <IoSend
                onClick={() => handleCreateComment(commentText)}
                className="text-xl text-sky-500 cursor-pointer hover:scale-110"
              />
            )}
          </div>

          {/* Comments List */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">Chưa có bình luận nào.</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <img
                    src={comment.created?.avatar || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png"}
                    alt="User"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-2xl px-4 py-2">
                      <p className="font-semibold text-sm">
                        {comment.created?.username ||
                         (comment.created?.firstName ? `${comment.created.firstName} ${comment.created.lastName || ""}`.trim() : "User")}
                      </p>
                      <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 ml-4">
                      {comment.createdAt ? new Date(comment.createdAt).toLocaleString("vi-VN") : "Vừa xong"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetailPage;