import { useEffect, useState, useCallback } from 'react';
import StoryCircle from '../../Components/Story/StoryCircle';
import PostCard from '../../Components/Post/PostCard';
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

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);

      const [userInfo, userPosts, userStories] = await Promise.all([
        fetchUserInfo(token),
        fetchAllPost(token),
        fetchAllStories(token),
      ]);

      setUser(userInfo);
      setPosts(userPosts);
      setStories(userStories || []);
    } catch (error) {
      console.log("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token, fetchData]);

  // Xử lý khi story mới được tạo
  const handleStoryCreated = (newStory) => {
    // Refresh lại danh sách stories
    fetchData();
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

  const StorySkeleton = () => (
    <div className="w-16 h-16 rounded-full bg-gray-300 animate-pulse"></div>
  );

  const renderStories = () => {
    // Nhóm stories theo authorId
    const storiesByUser = {};
    
    if (Array.isArray(stories) && stories.length > 0) {
      stories.forEach(story => {
        if (!story.authorId) return;
        
        if (!storiesByUser[story.authorId]) {
          storiesByUser[story.authorId] = [];
        }
        
        storiesByUser[story.authorId].push(story);
      });
    }
    
    // Lấy danh sách các user có story
    const usersWithStories = Object.keys(storiesByUser).map(authorId => {
      const userStories = storiesByUser[authorId];

      // Sắp xếp stories theo thời gian (mới nhất trước)
      userStories.sort((a, b) => {
        const timeA = a.timestamp || a.createdAt;
        const timeB = b.timestamp || b.createdAt;
        return new Date(timeB) - new Date(timeA);
      });
      
      return {
        authorId,
        stories: userStories,
        // Sử dụng story đầu tiên (mới nhất) để hiển thị trong StoryCircle
        representativeStory: userStories[0]
      };
    });
  
    return (
      <div className="storyDiv flex space-x-2 p-4 rounded-md justify-start w-full overflow-x-auto">
        <StoryCircle isAddNew={true} onStoryCreated={handleStoryCreated} />
        
        {isLoading ? (
          // Show skeletons when loading
          Array.from({ length: 4 }).map((_, index) => (
            <div key={`skeleton-${index}`} className="flex flex-col items-center">
              <StorySkeleton />
              <div className="w-12 h-3 bg-gray-200 rounded mt-1"></div>
            </div>
          ))
        ) : (
          // Show actual stories when loaded
          usersWithStories.map((userStory, index) => (
            <StoryCircle 
              key={`story-${userStory.authorId}`} 
              story={userStory.representativeStory} 
              stories={userStory.stories} // Truyền tất cả stories của user này
              currentUserId={user?.id} // cần truyền user hiện tại để kiểm tra quyền xoá
            user={user} // Truyền user để hiển thị tên
            />
          ))
        )}
      </div>
    );
  };

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
        {renderStories()}
        {renderPosts()}
      </div>
    </div>
  );
};

export default HomePage;