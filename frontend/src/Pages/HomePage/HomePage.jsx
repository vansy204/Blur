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

  const handleStoryCreated = async (newStory) => {
    await fetchData();
  };

  const handlePostCreated = async (newPost) => {
    await fetchData();
  };

  const handlePostDeleted = (deletedPostId) => {
    setPosts(prevPosts => prevPosts.filter(post => post.id !== deletedPostId));
  };

  const PostSkeleton = () => (
    <div className="bg-white shadow-lg rounded-3xl overflow-hidden mb-8 border-2 border-gray-100 animate-pulse">
      <div className="flex items-center p-6 gap-4 bg-gradient-to-r from-gray-50 to-white">
        <div className="relative">
          <div className="w-14 h-14 bg-gradient-to-br from-sky-200 to-blue-200 rounded-full"></div>
        </div>
        <div className="flex-1">
          <div className="w-32 h-4 bg-gray-200 rounded-lg mb-2"></div>
          <div className="w-20 h-3 bg-gray-100 rounded-lg"></div>
        </div>
      </div>
      <div className="w-full h-96 bg-gradient-to-br from-sky-50 to-blue-50"></div>
      <div className="p-6">
        <div className="flex gap-5 mb-4">
          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-lg mb-2"></div>
        <div className="w-3/4 h-3 bg-gray-100 rounded-lg"></div>
      </div>
    </div>
  );

  const StorySkeleton = () => (
    <div className="flex flex-col items-center flex-shrink-0">
      <div className="w-20 h-28 rounded-2xl bg-gradient-to-br from-sky-100 to-blue-100 animate-pulse"></div>
    </div>
  );

  const renderStories = () => {
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
    
    const usersWithStories = Object.keys(storiesByUser).map(authorId => {
      const userStories = storiesByUser[authorId];

      userStories.sort((a, b) => {
        const timeA = a.timestamp || a.createdAt;
        const timeB = b.timestamp || b.createdAt;
        return new Date(timeB) - new Date(timeA);
      });
      
      return {
        authorId,
        stories: userStories,
        representativeStory: userStories[0]
      };
    });
  
    return (
      <div className="storyDiv bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
          <StoryCircle isAddNew={true} onStoryCreated={handleStoryCreated} />
          
          {isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <StorySkeleton key={`skeleton-${index}`} />
            ))
          ) : (
            usersWithStories.map((userStory) => (
              <StoryCircle 
                key={`story-${userStory.authorId}`} 
                story={userStory.representativeStory} 
                stories={userStory.stories}
                currentUserId={user?.id}
                user={user}
              />
            ))
          )}
        </div>
      </div>
    );
  };

  const renderPosts = () => (
    <div className="space-y-6 w-full">
      {isLoading ? (
        Array.from({ length: 3 }).map((_, index) => (
          <PostSkeleton key={`post-skeleton-${index}`} />
        ))
      ) : posts.length > 0 ? (
        posts.map((post) => (
          <PostCard 
            key={post.id || `post-${Math.random()}`}
            post={post} 
            user={user}
            onPostDeleted={handlePostDeleted}
          />
        ))
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-sky-100 to-blue-100 flex items-center justify-center">
            <svg 
              className="w-12 h-12 text-sky-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" 
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">No posts yet</h3>
          <p className="text-gray-500 text-sm">
            Start sharing your moments with friends!
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="flex justify-center w-full px-4 xl:px-0 py-6">
        <div className="w-full max-w-[620px]">
         
          {renderStories()}
          {renderPosts()}
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default HomePage;