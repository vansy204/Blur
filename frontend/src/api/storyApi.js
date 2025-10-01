import axios from "axios";
import { getToken } from "../service/LocalStorageService";

const BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8888";
const STORY_API = `${BASE_URL}/api/stories`;

// Helper function to get the authorization headers
const getAuthHeaders = (token = getToken()) => {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
};

// Lấy tất cả stories từ tất cả người dùng
export const fetchAllStories = async (token = getToken()) => {
  try {
    const res = await axios.get(`${STORY_API}/all`, getAuthHeaders(token));
    const data = res.data.result || [];
    
    return data.map(story => ({
      id: story.id,
      media: story.mediaUrl, // dùng key `media` cho đúng UI
      username: `${story.firstName} ${story.lastName}`, // tên đầy đủ
      ...story, // giữ lại các key khác nếu cần dùng
    }));
  } catch (error) {
    console.error("Error fetching all stories:", error);
    return [];
  }
};

// Lấy stories của người dùng hiện tại
export const fetchMyStories = async () => {
  try {
    const res = await axios.get(`${STORY_API}/my-stories`, getAuthHeaders());
    return res.data.result || [];
  } catch (error) {
    console.error("Error fetching my stories:", error);
    return [];
  }
};

// Lấy stories theo userId
export const fetchStoriesByUserId = async (userId) => {
  try {
    const res = await axios.get(`${STORY_API}/user/${userId}`, getAuthHeaders());
    return res.data.result || [];
  } catch (error) {
    console.error(`Error fetching stories for user ${userId}:`, error);
    return [];
  }
};

// Lấy story chi tiết theo ID
export const fetchStoryById = async (storyId) => {
  try {
    const res = await axios.get(`${STORY_API}/${storyId}`, getAuthHeaders());
    return res.data.result;
  } catch (error) {
    console.error(`Error fetching story ${storyId}:`, error);
    return null;
  }
};

// Tạo story mới
export const createStory = async (storyData) => {
  try {
    const res = await axios.post(
      `${STORY_API}/create`,
      storyData,
      getAuthHeaders()
    );
    return res.data;
  } catch (error) {
    console.error("Error creating story:", error);
    return null;
  }
};

// Cập nhật story 
export const updateStory = async (storyId, storyData) => {
  try {
    const res = await axios.put(
      `${STORY_API}/${storyId}`,
      storyData, 
      getAuthHeaders()
    );
    return res.data.result;
  } catch (error) {
    console.error(`Error updating story ${storyId}:`, error);
    return null;
  }
};

// Xóa story
export const deleteStory = async (storyId) => {
  try {
    const res = await axios.delete(`${STORY_API}/${storyId}`, getAuthHeaders());
    return res.data.result;
  } catch (error) {
    console.error(`Error deleting story ${storyId}:`, error);
    return null;
  }
};

// Like story
export const likeStory = async (storyId,token) => {
  try {
    const res = await axios.put(
      `${STORY_API}/like/${storyId}`,
      {},
      getAuthHeaders()
    );
    return res.data.result;
  } catch (error) {
    console.error(`Error liking story ${storyId}:`, error);
    return null;
  }
};

// Unlike story
export const unlikeStory = async (storyId) => {
  try {
    const res = await axios.put(
      `${STORY_API}/unlike/${storyId}`,
      {},
      getAuthHeaders()
    );
    return res.data.result;
  } catch (error) {
    console.error(`Error unliking story ${storyId}:`, error);
    return null;
  }
};