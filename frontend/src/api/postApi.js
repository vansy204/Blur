import axios from "axios";

export const fetchUserPosts = async (token) => {
  try {
    const response = await axios.get(
      "http://localhost:8888/api/post/my-posts",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data?.code !== 1000) {
      throw new Error(`fetch error: ${response.data?.code}`);
    }

    return response.data?.result;
  } catch (error) {
    console.error("Fetch posts error:", error);
    throw error; // Cho phép nơi sử dụng bắt lỗi nếu cần
  }
};
export const fetchAllPost = async (token) => {
  try {
    const response = await axios.get("http://localhost:8888/api/post/all", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (response.data?.code !== 1000) {
      throw new Error(`fetch error: ${response.data?.code}`);
    }

    return response.data?.result;
  } catch (error) {
    console.error("Fetch posts error:", error);
    throw error; // Cho phép nơi sử dụng bắt lỗi nếu cần
  }
};
export const fetchLikePost = async (token,postId) =>{
  try {
    const response = await axios.get(`http://localhost:8888/api/post/${postId}/likes`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (response.data?.code !== 1000) {
      throw new Error(`fetch error: ${response.data?.code}`);
    }

    return response.data?.result;
  } catch (error) {
    console.error("Fetch posts error:", error);
    throw error; // Cho phép nơi sử dụng bắt lỗi nếu cần
  }
}
