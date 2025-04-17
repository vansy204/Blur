import React, { useState } from "react";
import { uploadToCloudnary } from "../../Config/UploadToCloudnary";
import { createStory } from "../../api/storyApi";

const AddStoryModal = ({ onClose, onStoryCreated }) => {
  const [media, setMedia] = useState(null);
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Kiểm tra loại file
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        setError("Vui lòng chọn file hình ảnh hoặc video");
        return;
      }
      
      // Kiểm tra kích thước file (dưới 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError("File vượt quá kích thước cho phép (10MB)");
        return;
      }
      
      setMedia(file);
      setError("");
    }
  };

  const handlePost = async () => {
    if (!media) {
      setError("Vui lòng chọn hình ảnh hoặc video");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      const mediaUrl = await uploadToCloudnary(media);
      
      const storyData = {
        content: caption,
        mediaUrl,
        timestamp: Date.now()
      };
      
      const result = await createStory(storyData);
      
      if (result) {
        // Thông báo thành công
        alert("Story đã được tạo thành công!");
        
        // Callback để refresh danh sách story nếu có
        if (onStoryCreated && typeof onStoryCreated === 'function') {
          onStoryCreated(result);
        }
        
        onClose();
      }
    } catch (err) {
      console.error("Error creating story:", err);
      setError("Có lỗi xảy ra khi tạo story. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white w-[700px] h-[450px] rounded-xl flex overflow-hidden">
        {/* Left side – Preview */}
        <div className="flex-1 flex items-center justify-center bg-gray-50 text-gray-400 text-sm">
          {media ? (
            media.type.startsWith("video") ? (
              <video controls className="h-full w-full object-contain">
                <source src={URL.createObjectURL(media)} />
              </video>
            ) : (
              <img
                src={URL.createObjectURL(media)}
                alt="preview"
                className="h-full w-full object-contain"
              />
            )
          ) : (
            "No Image/Video Selected"
          )}
        </div>

        {/* Right side – Form */}
        <div className="w-1/3 p-4 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold mb-4">Tạo Story Mới</h2>
            <textarea
              placeholder="Viết caption cho story..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full border border-gray-300 rounded p-2 resize-none h-24"
            />
            <label className="block border border-dashed border-gray-400 rounded p-3 text-center mt-4 cursor-pointer text-sm font-semibold text-gray-700">
              Chọn hình ảnh/video
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleMediaChange}
                className="hidden"
              />
            </label>
            
            {error && (
              <p className="text-red-500 text-xs mt-2">{error}</p>
            )}
          </div>

          <div className="flex justify-between items-center mt-4">
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-black text-sm"
            >
              Hủy
            </button>
            <button
              onClick={handlePost}
              disabled={!media || loading}
              className={`px-4 py-1 rounded text-white text-sm ${
                !media || loading ? "bg-blue-200 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
              }`}
            >
              {loading ? "Đang đăng..." : "Đăng"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddStoryModal;