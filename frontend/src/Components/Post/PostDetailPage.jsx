import { useLocation } from "react-router-dom";

const PostDetailPage = () => {
  const location = useLocation();
  const post = location.state?.post;

  if (!post) return <div>Đang tải bài viết...</div>;

  return (
    <div className="p-6 bg-white rounded-2xl shadow-md">
      <h2 className="text-xl font-bold">{post.userName}</h2>
      <p className="mt-2">{post.content}</p>
      {post.mediaUrls?.length > 0 && (
        <img
          src={post.mediaUrls[0]}
          alt="Post media"
          className="w-full rounded-xl mt-4"
        />
      )}
    </div>
  );
};
