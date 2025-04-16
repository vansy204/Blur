import axios from "axios";
import { getToken } from "../service/LocalStorageService";

export const createStory = async (storyData) => {
  try {
    const res = await axios.post(
      "http://localhost:8888/api/stories/create",
      storyData,
      {
        headers: {
            Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
      }
    );
    return res.data;
  } catch (error) {
    console.error("Error creating story:", error);
    return null;
  }
};
export const fetchAllStories = async () => {
    try {
      const res = await axios.get("http://localhost:8888/api/stories/all", {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
      });
      console.log("Fetched stories:", res.data); // 👈 kiểm tra định dạng
      return res.data;
    } catch (error) {
      console.error("Error fetching stories:", error);
      return []; // 👈 luôn trả về mảng
    }
  };
  