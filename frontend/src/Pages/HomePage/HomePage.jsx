import { useEffect, useState, useCallback, useRef } from 'react';

// import { useEffect, useState, useCallback } from 'react';
import StoryCircle from '../../Components/Story/StoryCircle';
import PostCard from '../../Components/Post/PostCard';
import { fetchAllPost } from '../../api/postApi';
import { fetchUserInfo } from '../../api/userApi';
import { fetchAllStories } from '../../api/storyApi';
import { getToken } from '../../service/LocalStorageService';
import CreatePostModal from '../../Components/Post/CreatePostModal';

// ✅ utils mergeUniqueById
const mergeUniqueById = (prev, incoming) => {
  const map = new Map(prev.map(p => [(p.id || p._id), p]));
  for (const it of incoming) {
    map.set((it.id || it._id), it);
  }
  return Array.from(map.values());
};

const HomePage = () => {
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stories, setStories] = useState([]);

  // ⚙️ THÊM DÒNG NÀY
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // ✅ Phân trang
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const sentinelRef = useRef(null);    // div đánh dấu cuối danh sách
  const inFlightRef = useRef(false);   // chặn gọi loadMorePosts trùng

  const token = getToken();

  /*
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
  */

  // ✅ Load user + stories (1 lần duy nhất)
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [userInfo, userStories] = await Promise.all([
        fetchUserInfo(token),
        fetchAllStories(token),
      ]);
      setUser(userInfo);
      setStories(userStories || []);
    } catch (error) {
      console.error("Error fetching user/stories:", error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // ✅ Load bài đăng theo trang
  const loadMorePosts = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    try {
      const { posts: newPostsRaw = [], hasNextPage } = await fetchAllPost(token, page, 5);

      // Chuẩn hoá id 1 lần (tránh lúc id, lúc _id)
      const newPosts = newPostsRaw.map(p => ({ ...p, id: p.id || p._id }));

      setPosts(prev => mergeUniqueById(prev, newPosts));

      if (newPosts.length > 0) {
        setPage(prev => prev + 1);
      }
      setHasMore(Boolean(hasNextPage && newPosts.length > 0));
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [token, page, hasMore, isLoadingMore]);

  // ✅ Gọi lần đầu tiên
  useEffect(() => {
    if (!token) return;

    // load user + stories
    fetchData();

    // load trang 1 trực tiếp
    (async () => {
      setIsLoadingMore(true);
      try {
        const { posts: newPostsRaw = [], hasNextPage } = await fetchAllPost(token, 1, 5);
        const first = newPostsRaw.map(p => ({ ...p, id: p.id || p._id }));
        setPosts(first);
        setPage(2);                    // lần sau sẽ là trang 2
        setHasMore(Boolean(hasNextPage && first.length > 0));
      } catch (e) {
        console.error("Error loading first page:", e);
      } finally {
        setIsLoadingMore(false);
      }
    })();
  }, [token, fetchData]);  // <-- KHÔNG có loadMorePosts ở đây

  // callback khi sentinel vào viewport
  const onIntersect = useCallback(async (entries) => {
    const [entry] = entries;
    if (!entry.isIntersecting) return;
    if (!hasMore) return;
    if (isLoadingMore) return;
    if (inFlightRef.current) return;

    try {
      inFlightRef.current = true;      // khóa
      await loadMorePosts();           // gọi nạp trang kế tiếp
    } finally {
      inFlightRef.current = false;     // mở khóa
    }
  }, [hasMore, isLoadingMore, loadMorePosts]);

  // tạo observer 1 lần
  useEffect(() => {
    if (!sentinelRef.current) return;
    const obs = new IntersectionObserver(onIntersect, {
      root: null,
      rootMargin: '300px 0px', // gọi sớm hơn một chút
      threshold: 0,
    });
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [onIntersect]);

  //

  const handleStoryCreated = async (newStory) => {
    await fetchData();
  };

  /*
  const handlePostCreated = async (newPost) => {
    await fetchData();
  }; */

  // ✅ IMPROVED: Add new post to top of list without reload
  const handlePostCreated = useCallback((created) => {
    console.log('📝 [HomePage] Post được tạo từ modal:', created);
    console.log('📝 [HomePage] User hiện tại:', user);
    
    if (!created) {
      console.error('❌ [HomePage] No post data received!');
      return;
    }
    
    // Normalize the post structure with complete user info
    const normalized = { 
      ...created, 
      id: created.id || created._id || `temp-${Date.now()}`,
      // Ensure user info is included for PostCard display
      userName: created.userName || (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'Unknown User'),
      userImageUrl: created.userImageUrl || user?.imageUrl || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png',
      userId: created.userId || user?.id || user?.userId,
      profileId: created.profileId || user?.profileId || user?.id,
      createdAt: created.createdAt || new Date().toISOString(),
      mediaUrls: created.mediaUrls || [],
      content: created.content || '',
    };
    
    console.log('✅ [HomePage] Post đã được chuẩn hóa:', normalized);
    
    // Add to top of posts list immediately
    setPosts(prev => {
      console.log('📋 [HomePage] Danh sách posts trước khi thêm:', prev.length);
      const newList = [normalized, ...prev];
      console.log('📋 [HomePage] Danh sách posts sau khi thêm:', newList.length);
      console.log('📋 [HomePage] Post mới ở vị trí đầu:', newList[0]);
      return newList;
    });
    
    console.log('✅ [HomePage] Post đã được thêm vào đầu feed thành công!');
  }, [user]);

  const handlePostDeleted = (deletedPostId) => {
    setPosts(prevPosts => prevPosts.filter(post => post.id !== deletedPostId));
  };

  // --- Skeleton ---
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

  // --- renderPosts (chuẩn sentinel) ---
  const renderPosts = () => (
    <div className="space-y-6 w-full">
      {isLoading ? (
        Array.from({ length: 3 }).map((_, i) => <PostSkeleton key={`post-skeleton-${i}`} />)
      ) : posts.length > 0 ? (
        <>
          {posts.map((post) => (
            <PostCard
              key={post.id || post._id}
              post={post}
              user={user}
              onPostDeleted={handlePostDeleted}
            />
          ))}

          {/* Sentinel: quan sát khi chạm đáy để load thêm */}
          <div ref={sentinelRef} style={{ height: 1 }} />
        </>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-sky-100 to-blue-100 flex items-center justify-center">
            <svg className="w-12 h-12 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">No posts yet</h3>
          <p className="text-gray-500 text-sm">Start sharing your moments with friends!</p>
        </div>
      )}

      {isLoadingMore && (
        <div className="text-center text-gray-500 py-4">Đang tải thêm...</div>
      )}
      {!hasMore && (
        <div className="text-center text-gray-400 py-4">Bạn đã xem hết bài viết</div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="flex justify-center w-full px-4 xl:px-0 py-6">
        <div className="w-full max-w-[620px]">
          {/* Stories Section */}
          {renderStories()}

          {/* ✅ Create Post Input - Moved below Stories */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
            <div className="flex items-center gap-3">
              <img
                src={user?.imageUrl || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png"}
                alt="Your avatar"
                className="w-12 h-12 rounded-full object-cover border-2 border-sky-200"
              />
              <button
                onClick={() => setIsCreateOpen(true)}
                className="flex-1 text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-500 transition-colors duration-200"
              >
                What's on your mind, {user?.firstName || 'there'}?
              </button>
            </div>
          </div>

          {/* Posts Section */}
          {renderPosts()}
        </div>
      </div>

      {/* Modal tạo bài */}
      <CreatePostModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onPostCreate={handlePostCreated}
      />

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