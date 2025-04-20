import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  fetchUserProfileById,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowings,
} from "../../api/userApi";
import { getToken } from "../../service/LocalStorageService";
import { useToast } from "@chakra-ui/react";
import { getPostsByUserId } from "../../api/postApi";
import { AiFillHeart } from "react-icons/ai";
import { FaComment } from "react-icons/fa";
import { jwtDecode } from "jwt-decode";  // Correct import for jwt-decode

export default function OtherUserProfile() {
  const [searchParams] = useSearchParams();
  const profileId = searchParams.get("profileId");
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("post");
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [userPosts, setUserPosts] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const token = getToken();

  useEffect(() => {
    // Decode JWT token to extract current user's ID
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        setCurrentUserId(decodedToken.sub); // 'sub' claim usually contains the user ID
      } catch (error) {
        console.error("Failed to decode token:", error);
      }
    }
  }, [token]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await fetchUserProfileById(profileId, token);
        setUser(userData);
        
        // Check if current user has already followed this profile
        const followers = await getFollowers(profileId, token);
        setFollowersCount(followers.length);
        
        // Check if current user is among the followers
        const isAlreadyFollowing = followers.some(follower => follower.userId === currentUserId);
        setIsFollowing(isAlreadyFollowing);

        const following = await getFollowings(profileId, token);
        setFollowingCount(following.length);

        const posts = await getPostsByUserId(userData?.userId, token);
        setUserPosts(posts);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      }
    };

    if (profileId && currentUserId) {
      fetchData();
    }
  }, [profileId, currentUserId]);

  const handleFollow = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      await followUser(profileId, token);
      setFollowersCount((prev) => prev + 1);
      setIsFollowing(true);
      toast({ title: "Followed successfully", status: "success", duration: 2000, isClosable: true });
    } catch (error) {
      console.error("Follow error:", error);
      toast({ title: "Failed to follow", status: "error", duration: 2000, isClosable: true });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      await unfollowUser(profileId, token);
      setFollowersCount((prev) => prev - 1);
      setIsFollowing(false);
      toast({ title: "Unfollowed successfully", status: "info", duration: 2000, isClosable: true });
    } catch (error) {
      console.error("Unfollow error:", error);
      toast({ title: "Failed to unfollow", status: "error", duration: 2000, isClosable: true });
    } finally {
      setIsLoading(false);
    }
  };

  const isVideo = (url) => url?.endsWith(".mp4") || url?.includes("video");

  if (!user) return <div className="text-center mt-20">Loading...</div>;

  return (
    <div className="flex w-full">
      <div className="flex-1 max-w-4xl mx-auto mt-8">
        {/* Profile Info */}
        <div className="flex items-center gap-8 px-4">
          <img
            src={user?.imageUrl || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png"}
            className="w-28 h-28 rounded-full object-cover"
            alt="Avatar"
          />
          <div>
            <h2 className="text-2xl font-semibold">
              {user?.firstName} {user?.lastName}
            </h2>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex gap-6 text-sm text-gray-600">
                <span><strong>{userPosts.length}</strong> posts</span>
                <span><strong>{followersCount}</strong> followers</span>
                <span><strong>{followingCount}</strong> following</span>
              </div>
              
              {/* Separate Follow/Unfollow buttons */}
              {isFollowing ? (
                <button
                  onClick={handleUnfollow}
                  disabled={isLoading}
                  className="px-4 py-1 rounded-md text-sm font-medium bg-gray-300 text-black hover:bg-gray-400 transition"
                >
                  {isLoading ? "Processing..." : "Unfollow"}
                </button>
              ) : (
                <button
                  onClick={handleFollow}
                  disabled={isLoading}
                  className="px-4 py-1 rounded-md text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition"
                >
                  {isLoading ? "Processing..." : "Follow"}
                </button>
              )}
            </div>
            <p className="mt-2 text-gray-700">{user.bio}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8 border-t">
          <div className="flex justify-center gap-10 text-sm font-medium text-gray-500 mt-4">
            {["post", "reels", "saved"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2 ${activeTab === tab ? "border-b-2 border-black text-black" : ""}`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Media Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6 px-4">
            {userPosts.length === 0 ? (
              <div className="col-span-3 text-center text-gray-500 mt-4">No posts yet.</div>
            ) : (
              userPosts.map((post, index) => {
                const media = post.mediaUrls?.[0];
                const isVideoMedia = isVideo(media);

                return (
                  <div key={index} className="w-full max-w-md mx-auto rounded-2xl overflow-hidden shadow-md bg-white hover:shadow-xl transition-all">
                    {media ? (
                      <div className="relative w-full aspect-square bg-black group">
                        {isVideoMedia ? (
                          <video
                            src={media}
                            className="w-full h-full object-cover"
                            controls
                            preload="metadata"
                            onClick={(e) => e.stopPropagation()}  // Prevent other click events
                          />
                        ) : (
                          <img
                            src={media}
                            alt="Post"
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="flex gap-6 text-white text-lg font-semibold">
                            <div className="flex items-center gap-2">
                              <AiFillHeart className="text-red-500" />
                              <span>{post.likesCount || 0}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <FaComment />
                              <span>{post.commentsCount || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 space-y-3">
                        <p className="text-gray-800 text-sm leading-relaxed">{post.content}</p>
                        <div className="flex gap-6 text-gray-600 text-sm font-semibold">
                          <div className="flex items-center gap-2">
                            <AiFillHeart className="text-red-500" />
                            <span>{post.likesCount || 0}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FaComment />
                            <span>{post.commentsCount || 0}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
