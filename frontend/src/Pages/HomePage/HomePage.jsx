import { useEffect, useState } from 'react';
import StoryCircle from '../../Components/Story/StoryCircle';
import PostCard from '../../Components/Post/PostCard';
import CreateStoryCircle from '../../Components/Story/AddStoryModal';
import { fetchAllPost } from '../../api/postApi';
import { fetchUserInfo } from '../../api/userApi';
import { fetchAllStories } from '../../api/storyApi';
import { getToken } from '../../service/LocalStorageService';

const HomePage = () => {
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stories, setStories] = useState([]);
  const token = getToken();

  // Fetch user info, posts, and stories in parallel
  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch user info, posts, and stories in parallel
      const [userInfo, userPosts, userStories] = await Promise.all([
        fetchUserInfo(token),
        fetchAllPost(token),
        fetchAllStories(),
      ]);

      setUser(userInfo);
      setPosts(userPosts);
      setStories(userStories || []);
    } catch (error) {
      console.log("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

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

  const renderStories = () => (
    <div className="storyDiv flex space-x-2 p-4 rounded-md justify-start w-full">
      <CreateStoryCircle />
      {Array.isArray(stories) && stories.map((story, index) => (
        <StoryCircle key={index} story={story} />
      ))}
    </div>
  );

  const renderPosts = () => (
    <div className="space-y-10 w-full mt-6">
      {isLoading
        ? Array.from({ length: 3 }).map((_, index) => <PostSkeleton key={index} />)
        : posts.map((post, index) => <PostCard key={index} post={post} user={user} />)}
    </div>
  );

  return (
    <div className="flex justify-center w-full px-4 xl:px-0">
      <div className="w-full max-w-[600px]">
        {/* Story Section */}
        {renderStories()}

        {/* Post List Section */}
        {renderPosts()}
      </div>
    </div>
  );
};

export default HomePage;
