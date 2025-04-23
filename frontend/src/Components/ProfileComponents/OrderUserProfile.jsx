import React, { useEffect, useState } from "react";
import { LuCircleDashed } from "react-icons/lu";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getToken } from "../../service/LocalStorageService";
import {
  fetchUserInfo,
  fetchUserProfileById,
  getFollowers,
  getFollowings,
  followUser,
  unfollowUser,
} from "../../api/userApi";
import { getPostsByUserId } from "../../api/postApi";
import ReqUserPostCard from "./ReqUserPostCard";

const ProfileUserDetails = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);
  const [followers, setFollowers] = useState([]);
  const [followings, setFollowings] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const token = getToken();
  const [params] = useSearchParams();
  const profileId = params.get("profileId");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        const loggedInUser = await fetchUserInfo(token);
        setCurrentUser(loggedInUser);

        const profileData = await fetchUserProfileById(profileId, token);
        setUser(profileData);

        if (profileData?.id) {
          const [followerData, followingData] = await Promise.all([
            getFollowers(profileData.id, token),
            getFollowings(profileData.id, token),
          ]);
          setFollowers(followerData || []);
          setFollowings(followingData || []);

          const isUserFollowing = followerData?.some(
            (follower) => follower.id === loggedInUser.id
          );
          setIsFollowing(isUserFollowing);
        }

        const postData = await getPostsByUserId(profileData.userId, token);
        setPosts(postData);
      } catch (error) {
        console.log("Error fetching profile data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (token && profileId) {
      fetchData();
    }
  }, [profileId]);

  const handleFollowToggle = async () => {
    if (!currentUser) return;

    try {
      setIsLoading(true);
      if (isFollowing) {
        await unfollowUser(user.id, token);
        setFollowers((prev) =>
          prev.filter((follower) => follower.id !== currentUser.id)
        );
      } else {
        await followUser(user.id, token);
        setFollowers((prev) => [...prev, currentUser]);
      }
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.log("Error toggling follow status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isOwnProfile = currentUser?.id === user?.id;

  return (
    <div className="py-10 w-full px-4">
      <div className="flex flex-col md:flex-row items-center gap-8">
        <img
          className="w-32 h-32 rounded-full object-cover border"
          src={
            user?.imageUrl ||
            "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png"
          }
          alt="Profile"
        />
        <div className="space-y-4 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-4">
            <h2 className="text-xl font-semibold">{user?.firstName}</h2>
            {isOwnProfile ? (
              <>
                <button
                  onClick={() => navigate("/account/edit")}
                  className="bg-gray-100 hover:bg-gray-200 transition px-3 py-1 rounded text-sm"
                >
                  Edit Profile
                </button>
                <LuCircleDashed
                  className="cursor-pointer"
                  onClick={() => navigate("/account/edit")}
                />
              </>
            ) : (
              <button
                onClick={handleFollowToggle}
                disabled={isLoading}
                className={`px-3 py-1 rounded text-sm transition ${
                  isFollowing
                    ? "bg-gray-100 hover:bg-gray-200"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
              >
                {isLoading ? "Loading..." : isFollowing ? "Unfollow" : "Follow"}
              </button>
            )}
          </div>
          <div className="flex justify-center md:justify-start gap-6 text-sm">
            <div>
              <span className="font-semibold">{posts?.length}</span> posts
            </div>
            <div>
              <span className="font-semibold">{followers.length}</span> followers
            </div>
            <div>
              <span className="font-semibold">{followings.length}</span> following
            </div>
          </div>
          <div>
            <p className="font-semibold">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-gray-600 text-sm">{user?.bio}</p>
          </div>
        </div>
      </div>

      {/* Danh sách bài viết */}
      <div className="mt-10 w-full">
        <h3 className="text-lg font-semibold mb-4">Posts</h3>
        {posts.length === 0 ? (
          <p className="text-gray-500">No posts to show.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {posts.map((post) => (
              <ReqUserPostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileUserDetails;
