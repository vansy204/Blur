import React, { useEffect, useState } from "react";
import { AiOutlineTable } from "react-icons/ai";
import { BsFillBookmarkFill } from "react-icons/bs";
import { RiVideoAddLine } from "react-icons/ri";
import ReqUserPostCard from "./ReqUserPostCard";
import { fetchUserPosts } from "../../api/postApi";
import { getToken } from "../../service/LocalStorageService";

const ReqUserPostPart = () => {
  const [activeTab, setActiveTab] = useState("Post");
  const [posts, setPosts] = useState([]);
  const token = getToken();

  useEffect(() => {
    const getUserPosts = async () => {
      try {
        const result = await fetchUserPosts(token);
        setPosts(result);
      } catch (error) {
        console.error("Error:", error);
      }
    };

    if (token) {
      getUserPosts();
    }
  }, [token]);

  const tabs = [
    { tab: "Post", icon: <AiOutlineTable /> },
    { tab: "Reels", icon: <RiVideoAddLine /> },
    { tab: "Saved", icon: <BsFillBookmarkFill /> },
  ];

  return (
    <div className="mt-8">
      <div className="flex justify-center gap-10 border-t py-4 text-sm">
        {tabs.map((item) => (
          <div
            key={item.tab}
            onClick={() => setActiveTab(item.tab)}
            className={`flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === item.tab ? "text-black font-semibold border-b-2 border-black" : "text-gray-500"
            }`}
          >
            {item.icon}
            <span>{item.tab}</span>
          </div>
        ))}
      </div>

      <div className="space-y-4 px-4">
        {posts.length === 0 ? (
          <p className="text-center text-gray-500 py-10">No posts to show.</p>
        ) : (
          posts.map((post) => <ReqUserPostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
};

export default ReqUserPostPart;
