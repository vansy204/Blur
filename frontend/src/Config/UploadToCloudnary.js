export const uploadToCloudnary = async (file) => {
    if (file) {
      const data = new FormData();
      data.append("file", file);
      data.append("upload_preset", "instagram");
      data.append("cloud_name", "dqg5pghlu");
  
      // Xác định loại file để chọn endpoint phù hợp
      const isVideo = file.type.startsWith("video");
      const endpoint = isVideo
        ? "https://api.cloudinary.com/v1_1/dqg5pghlu/video/upload"
        : "https://api.cloudinary.com/v1_1/dqg5pghlu/image/upload";
  
      const res = await fetch(endpoint, {
        method: "POST",
        body: data,
      });
  
      const fileData = await res.json();
      return fileData.url?.toString();
    }
  };
  