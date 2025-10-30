import axios from "axios";

const API_BASE_URL = "/api";

// ✅ Tạo post mới
export const createPost = async (token, postData) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/post/create`,
      postData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data?.code !== 1000) {
      throw new Error(`Create post error: ${response.data?.code}`);
    }

    console.log('✅ Post created successfully:', response.data?.result);
    return response.data?.result;
  } catch (error) {
    console.error("❌ Create post error:", error);
    throw error;
  }
};

// ✅ Lấy tất cả bài posts của user hiện tại
export const fetchUserPosts = async (token) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/post/my-posts`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data?.code !== 1000) {
      throw new Error(`Fetch error: ${response.data?.code}`);
    }

    return response.data?.result;
  } catch (error) {
    console.error("Fetch posts error:", error);
    throw error;
  }
};

// ✅ Lấy tất cả bài posts (có phân trang)
export const fetchAllPost = async (token, page = 1, limit = 5) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/post/all`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        params: { page, limit },
      }
    );

    if (response.data?.code !== 1000) {
      throw new Error(`Fetch error: ${response.data?.code}`);
    }

    return response.data?.result;
  } catch (error) {
    console.error("Fetch all posts error:", error);
    throw error;
  }
};

// ✅ Lấy danh sách likes của một post (GET)
export const fetchLikePost = async (token, postId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/post/${postId}/likes`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data?.code !== 1000) {
      throw new Error(`Fetch likes error: ${response.data?.code}`);
    }

    return response.data?.result;
  } catch (error) {
    console.error("Fetch likes error:", error);
    throw error;
  }
};

// ✅ LIKE post (PUT request)
export const likePost = async (token, postId) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/post/${postId}/like`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data?.code !== 1000) {
      throw new Error(`Like error: ${response.data?.code}`);
    }

    console.log('✅ Post liked:', response.data);
    return response.data?.result;
  } catch (error) {
    console.error("❌ Like post error:", error);
    throw error;
  }
};

// ✅ UNLIKE post (PUT request)
export const unlikePost = async (token, postId) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/post/${postId}/unlike`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data?.code !== 1000) {
      throw new Error(`Unlike error: ${response.data?.code}`);
    }

    console.log('✅ Post unliked:', response.data);
    return response.data?.result;
  } catch (error) {
    console.error("❌ Unlike post error:", error);
    throw error;
  }
};

// ✅ Toggle Like/Unlike (helper function)
export const toggleLikePost = async (token, postId, isCurrentlyLiked) => {
  if (isCurrentlyLiked) {
    return await unlikePost(token, postId);
  } else {
    return await likePost(token, postId);
  }
};

// ✅ Xóa bài post
export const deletePost = async (token, postId) => {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/post/${postId}/delete`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data?.code !== 1000) {
      throw new Error(`Delete error: ${response.data?.code}`);
    }

    return response.data?.result;
  } catch (error) {
    console.error("Delete post error:", error);
    throw error;
  }
};

// ✅ Lấy bài posts của một user cụ thể (theo userId)
export const getPostsByUserId = async (userId, token) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/post/users/posts/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data?.code !== 1000) {
      throw new Error(`Fetch user posts error: ${response.data?.code}`);
    }

    return response.data?.result || [];
  } catch (error) {
    console.error("Fetch user posts error:", error);
    return [];
  }
};

// ✅ Lấy tất cả comments của một post
export const fetchAllComments = async (token, postId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/post/comment/${postId}/comments`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data?.code !== 1000) {
      throw new Error(`Fetch comments error: ${response.data?.code}`);
    }

    return response.data?.result;
  } catch (error) {
    console.error("Fetch all comments error:", error);
    throw error;
  }
};

// ✅ Tạo comment mới (POST request)
export const createComment = async (token, postId, content) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/post/comment/${postId}/create`,
      { content },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data?.code !== 1000) {
      throw new Error(`Create comment error: ${response.data?.code}`);
    }

    console.log('✅ Comment created:', response.data);
    return response.data?.result;
  } catch (error) {
    console.error("❌ Create comment error:", error);
    throw error;
  }
};

// ✅ Xóa comment
export const deleteComment = async (token, commentId) => {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/post/comment/${commentId}/delete`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data?.code !== 1000) {
      throw new Error(`Delete comment error: ${response.data?.code}`);
    }

    return response.data?.result;
  } catch (error) {
    console.error("Delete comment error:", error);
    throw error;
  }
};