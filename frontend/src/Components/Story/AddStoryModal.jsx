import React, { useState } from "react";
import { createStory } from "../../api/storyApi";
import { uploadToCloudnary } from "../../Config/UploadToCloudnary";

const CreateStoryCircle = () => {
  const [loading, setLoading] = useState(false);

  const handleCreateStory = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      const mediaUrl = await uploadToCloudnary(file);
      const timestamp = Date.now();
      const storyData = {
        content: "New story",
        mediaUrl,
        timestamp,
      };
      const result = await createStory(storyData);
      if (result) {
        alert("Story created!");
      }
    } catch (err) {
      console.error("Error creating story:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <label className="cursor-pointer relative">
        <img
          className="w-16 h-16 rounded-full border-2 border-gray-400 p-1"
          src="https://cdn-icons-png.flaticon.com/512/1828/1828919.png"
          alt="Add Story"
        />
        <input
          type="file"
          accept="image/*,video/*"
          onChange={handleCreateStory}
          className="hidden"
        />
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center rounded-full">
            <span className="text-xs text-gray-700">...</span>
          </div>
        )}
      </label>
      <p className="text-sm mt-1">Tạo</p>
    </div>
  );
};

export default CreateStoryCircle;
