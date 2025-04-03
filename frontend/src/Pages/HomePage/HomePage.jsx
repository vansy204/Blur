import StoryCircle from '../../Components/Story/StoryCircle';
import HomeRight from '../../Components/HomeRight/HomeRight';
import PostCard from '../../Components/Post/PostCard';
import { fetchAllPost, fetchLikePost } from '../../api/postApi';
import { useEffect, useState } from 'react';
import { fetchUserInfo } from '../../api/userApi';
import { getToken } from '../../service/LocalStorageService';

const HomePage = () => {
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const token = getToken();

  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const result = await fetchUserInfo(token);
        setUser(result);
      } catch (error) {
        console.log("Error fetching user info:", error);
      }
    };

    const getUserPosts = async () => {
      try {
        setIsLoading(true);
        const result = await fetchAllPost(token);
        setPosts(result);
      } catch (error) {
        console.log("Error fetching posts:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      getUserInfo();
      getUserPosts();
    }
  }, [token]);


  
  // 👉 Fake loading shimmer component
  const PostSkeleton = () => (
    <div className="bg-white shadow-md rounded-xl overflow-hidden mb-8 border border-gray-200 animate-pulse">
      <div className="flex items-center p-4">
        <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
        <div className="ml-4">
          <div className="w-32 h-4 bg-gray-300 rounded mb-2"></div>
          <div className="w-20 h-3 bg-gray-200 rounded"></div>
        </div>
      </div>
      <div className="w-full h-96 bg-gray-300"></div>
      <div className="p-4">
        <div className="w-full h-3 bg-gray-200 rounded mb-2"></div>
        <div className="w-1/2 h-3 bg-gray-200 rounded"></div>
      </div>
    </div>
  );


  
  return (
    <div className="flex justify-center w-full px-4 xl:px-0">
      {/* MAIN FEED */}
      <div className="w-full max-w-[600px]">
        {/* Story */}
        <div className="storyDiv flex space-x-2 p-4 rounded-md justify-start w-full">
          {[1, 2, 3].map((_, index) => (
            <StoryCircle key={index} />
          ))}
        </div>

        {/* Post List */}
        <div className="space-y-10 w-full mt-6">
          {isLoading
            ? Array.from({ length: 3 }).map((_, index) => (
                <PostSkeleton key={index} />
              ))
            : posts.map((post, index) => (
                <PostCard key={index} post={post} user={user} l/>
              ))}
        </div>
      </div>

      {/* Right sidebar */}
      <div className="hidden xl:block w-[320px] ml-10">
        <HomeRight />
      </div>
    </div>
  );
};

export default HomePage;
