import React, { useEffect, useState } from "react";
import { LuCircleDashed } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import { getToken } from "../../service/LocalStorageService";
import { fetchUserInfo, getFollowers, getFollowings } from "../../api/userApi";
import { fetchUserPosts } from "../../api/postApi";

const ProfileUserDetails = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);
  const [followers, setFollowers] = useState([]);
  const [followings, setFollowings] = useState([]);
  const token = getToken();

  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const result = await fetchUserInfo(token);
        setUser(result);

        if (result?.id) {
          // Gọi API lấy followers và followings sau khi có user id
          const [followerData, followingData] = await Promise.all([
            getFollowers(result.id, token),
            getFollowings(result.id, token),
          ]);
          setFollowers(followerData || []);
          setFollowings(followingData || []);

        }
      } catch (error) {
        console.log("Error fetching user:", error);
      }
    };

    const getUserPosts = async () => {
      try {
        const result = await fetchUserPosts(token);
        setPosts(result);
      } catch (error) {
        console.log("Error fetching posts:", error);
      }
    };

    if (token) {
      getUserInfo();
      getUserPosts();
    }
  }, [token]);

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
    </div>
  );
};

export default ProfileUserDetails;
