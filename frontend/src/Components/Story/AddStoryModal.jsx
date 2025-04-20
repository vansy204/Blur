import React, { useState, useRef } from "react";
import { useToast } from "@chakra-ui/react";
import { uploadToCloudnary } from "../../Config/UploadToCloudnary";
import { createStory } from "../../api/storyApi";

const AddStoryModal = ({ onClose, onStoryCreated }) => {
  const [media, setMedia] = useState(null);
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const toast = useToast();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

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

  const generateThumbnail = (videoFile) => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      // This event fires when metadata is loaded
      video.onloadedmetadata = () => {
        // Set video to 1/3 of its duration
        video.currentTime = Math.min(video.duration / 3, 2);
      };
      
      // Add seeked event - this is the key fix!
      // This event fires when the seeking operation completed - meaning the video is actually at the time we specified
      video.onseeked = () => {
        // Create canvas with video dimensions
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw video frame to canvas
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to blob
        canvas.toBlob((blob) => {
          if (blob) {
            // Create a file from the blob
            const thumbnailFile = new File([blob], `thumbnail_${videoFile.name.split('.')[0]}.jpg`, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(thumbnailFile);
          } else {
            reject(new Error("Failed to generate thumbnail"));
          }
        }, 'image/jpeg', 0.7);
      };
      
      video.onerror = () => {
        reject(new Error("Error loading video"));
      };
      
      video.src = URL.createObjectURL(videoFile);
      // For some browsers, we need to trigger load explicitly
      video.load();
    });
  };
  const handlePost = async () => {
    if (!media) {
      setError("Vui lòng chọn hình ảnh hoặc video");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      let mediaUrl = null;
      let thumbnailUrl = null;
      const isVideo = media.type.startsWith('video/');
      
      // Upload media to Cloudinary
      mediaUrl = await uploadToCloudnary(media);
      
      // If it's a video, generate and upload thumbnail
      if (isVideo) {
        try {
          const thumbnailFile = await generateThumbnail(media);
          thumbnailUrl = await uploadToCloudnary(thumbnailFile);
        } catch (thumbnailError) {
          console.error("Error generating thumbnail:", thumbnailError);
          // Continue without thumbnail if generation fails
        }
      }
      
      const storyData = {
        content: caption,
        mediaUrl,
        mediaType: isVideo ? "video" : "image",
        thumbnailUrl: thumbnailUrl || (isVideo ? null : mediaUrl), // Use original image as thumbnail for images
        timestamp: Date.now()
      };
      
      const result = await createStory(storyData);
      
      if (result) {
        toast({
          title: "Story đã được tạo thành công!",
          description: "Story của bạn đã được đăng.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        
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
              <video 
                ref={videoRef} 
                controls 
                className="h-full w-full object-contain"
              >
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
          <canvas ref={canvasRef} style={{ display: 'none' }} />
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