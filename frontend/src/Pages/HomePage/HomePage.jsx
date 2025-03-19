
import StoryCircle from '../../Components/Story/StoryCircle';
import HomeRight from '../../Components/HomeRight/HomeRight';
import PostCard from '../../Components/Post/PostCard';
import { fetchAllPost, fetchUserPosts } from '../../api/postApi';
import { useEffect, useState } from 'react';
import { fetchUserInfo } from '../../api/userApi';
import { getToken } from '../../service/LocalStorageService';

const HomePage = () => {  
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);
  const token = getToken();

  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const result = await fetchUserInfo(token);
        setUser(result);
      } catch (error) {
        console.log("Error: ", error);
      }
    };

    const getUserPosts = async () => {
      try {
        const result = await fetchAllPost(token);
        setPosts(result);
      } catch (error) {
        console.log("Error: ", error);
      }
    };

    if (token) {
      getUserInfo();
      getUserPosts();
    }
  }, [token]);
 

  return (
    <div className="flex justify-center w-full px-4 xl:px-0">
      {/* MAIN FEED */}
      <div className="w-full max-w-[600px]">
        {/* Story */}
        <div className="storyDiv flex space-x-2 p-4 rounded-md justify-start w-full">
          {[1, 1, 1].map((_, index) => (
            <StoryCircle key={index} />
          ))}
        </div>
  
        {/* Post List */}
        <div className="space-y-10 w-full mt-6">
          {posts.map((post, index) => (
            <PostCard key={index} post={post} user={user} />
          ))}
        </div>
      </div>
  
      {/* Right sidebar */}
      <div className="hidden xl:block w-[320px] ml-10">
        <HomeRight />
      </div>
    </div>
  );
}
export default HomePage;