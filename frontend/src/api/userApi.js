import axios from "axios";

const BASE_URL = "http://localhost:8888/api/profile";

const config = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
});

// Lấy thông tin profile của chính mình
export const fetchUserInfo = async (token) => {
  try {
    const response = await axios.get(`${BASE_URL}/users/myInfo`, config(token));
    if (response.data?.code !== 1000) {
      throw new Error(response.data?.message);
    }
    return response.data?.result;
  } catch (error) {
    console.log("Error: ", error);
    throw error;
  }
};

// Lấy thông tin user theo userId (dành cho nội bộ)
export const fetchUserByUserId = async (userId, token) => {
  try {
    const response = await axios.get(`${BASE_URL}/internal/users/${userId}`, config(token));
    if (response.data?.code !== 1000) {
      throw new Error(response.data?.message);
    }
    return response.data?.result;
  } catch (error) {
    console.log("Error: ", error);
    throw error;
  }
};

// Lấy tất cả user profiles
export const fetchAllUserProfiles = async (token) => {
  try {
    const response = await axios.get(`${BASE_URL}/users/`, config(token));
    if (response.data?.code !== 1000) {
      throw new Error(response.data?.message);
    }
    return response.data?.result;
  } catch (error) {
    console.log("Error: ", error);
    throw error;
  }
};

// Cập nhật profile người dùng
export const updateUserProfile = async (userProfileId, data, token) => {
  try {
    const response = await axios.put(`${BASE_URL}/users/${userProfileId}`, data, config(token));
    if (response.data?.code !== 1000) {
      throw new Error(response.data?.message);
    }
    return response.data?.result;
  } catch (error) {
    console.log("Error: ", error);
    throw error;
  }
};

// Xoá profile người dùng
export const deleteUserProfile = async (userProfileId, token) => {
  try {
    const response = await axios.delete(`${BASE_URL}/users/${userProfileId}`, config(token));
    if (response.data?.code !== 1000) {
      throw new Error(response.data?.message);
    }
    return response.data?.result;
  } catch (error) {
    console.log("Error: ", error);
    throw error;
  }
};

// Follow người dùng
export const followUser = async (userId, token) => {
  try {
    const response = await axios.put(`${BASE_URL}/users/follow/${userId}`, {}, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data?.result;
  } catch (error) {
    console.log("Error: ", error);
    throw error;
  }
};

// Unfollow người dùng
export const unfollowUser = async (userId, token) => {
  try {
    const response = await axios.put(`${BASE_URL}/users/unfollow/${userId}`, {},{
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data?.result;
  } catch (error) {
    console.log("Error: ", error);
    throw error;
  }
};

// Tìm kiếm user theo tên
export const searchUsersByFirstName = async (firstName, token) => {
  try {
    const response = await axios.get(`${BASE_URL}/users/search/${firstName}`, config(token));
    return response.data?.result;
  } catch (error) {
    console.log("Error: ", error);
    throw error;
  }
};
// Lấy thông tin user theo profileId
export const fetchUserProfileById = async (profileId, token) => {
  try {
    const response = await axios.get(`${BASE_URL}/users/${profileId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    if (response.data?.code !== 1000) {
      throw new Error(response.data?.message);
    }
    return response.data?.result;
  } catch (error) {
    console.log("Error: ", error);
    throw error;
  }
};

export const getFollowers = async (profileId, token) => {
  try {
    const response = await axios.get(`${BASE_URL}/users/follower/${profileId}`, config(token));
    return response.data?.result;
  } catch (error) {
    console.error("Error fetching followers:", error);
    return [];
  }
};

export const getFollowings = async (profileId, token) => {
  try {
    const response = await axios.get(`${BASE_URL}/users/following/${profileId}`, config(token));
    return response.data?.result;
  } catch (error) {
    console.error("Error fetching followings:", error);
    return [];
  }
};
